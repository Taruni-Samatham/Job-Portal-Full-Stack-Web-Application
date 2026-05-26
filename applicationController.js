/**
 * Application Controller
 * Apply, track, shortlist, reject
 */

const { Application, Notification } = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendApplicationEmail, sendStatusUpdateEmail, sendApplicationConfirmationEmail } = require('../utils/emailService');

// ─── Helper: create notification ──────────────────────────────────────────────
const notify = async (recipient, type, title, message, link, data) => {
  try {
    await Notification.create({ recipient, type, title, message, link, data });
  } catch (e) { console.error('Notification error:', e.message); }
};

// ─── @POST /api/applications/:jobId ──────────────────────────────────────────
exports.applyForJob = async (req, res) => {
  const job = await Job.findById(req.params.jobId).populate('recruiter', 'email name');
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (job.status !== 'active') return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });

  // Check duplicate
  const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
  if (existing) return res.status(400).json({ success: false, message: 'You have already applied for this job' });

  const resumePath = req.file?.path || req.user.resume;
  if (!resumePath) return res.status(400).json({ success: false, message: 'Please upload a resume' });

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    recruiter: job.recruiter._id,
    resume: resumePath,
    coverLetter: req.body.coverLetter,
    expectedSalary: req.body.expectedSalary,
    statusHistory: [{ status: 'applied', note: 'Application submitted' }]
  });

  // Increment applicants count
  await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });

  // Notify recruiter
  await notify(
    job.recruiter._id,
    'application_received',
    'New Application',
    `${req.user.name} applied for ${job.title}`,
    `/recruiter/applications/${application._id}`
  );

  // Send email to recruiter
  await sendApplicationEmail(job.recruiter.email, req.user.name, job.title);

  // Send confirmation email to applicant
  const { previewUrl } = await sendApplicationConfirmationEmail(req.user, job);

  res.status(201).json({ 
    success: true, 
    data: application, 
    message: 'Application submitted successfully!',
    previewUrl // For demo purposes
  });
};

// ─── @GET /api/applications/my ────────────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { applicant: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('job', 'title company location type salary status')
      .populate('recruiter', 'name company')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: applications,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
  });
};

// ─── @GET /api/applications/job/:jobId ───────────────────────────────────────
exports.getJobApplications = async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { status, page = 1, limit = 10 } = req.query;
  const query = { job: req.params.jobId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('applicant', 'name email avatar skills experience education phone location resume')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: applications,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
  });
};

// ─── @PUT /api/applications/:id/status ───────────────────────────────────────
exports.updateApplicationStatus = async (req, res) => {
  const { status, note, interviewDate } = req.body;
  const validStatuses = ['viewed', 'shortlisted', 'interview', 'rejected', 'hired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const application = await Application.findById(req.params.id)
    .populate('applicant', 'name email')
    .populate('job', 'title');

  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  if (application.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  application.status = status;
  application.note = note;
  if (interviewDate) application.interviewDate = interviewDate;
  application.statusHistory.push({ status, note: note || `Status changed to ${status}` });
  await application.save();

  // Notify applicant
  const notifType = `application_${status}`;
  const notifMessages = {
    shortlisted: 'Congratulations! You have been shortlisted.',
    interview: 'You have been invited for an interview.',
    rejected: 'Your application status has been updated.',
    hired: '🎉 You have been hired!',
    viewed: 'Your application was viewed.'
  };

  await notify(
    application.applicant._id,
    notifType,
    `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    `${notifMessages[status]} (${application.job.title})`,
    `/applications/${application._id}`
  );

  // Send email
  await sendStatusUpdateEmail(
    application.applicant.email,
    application.applicant.name,
    application.job.title,
    status
  );

  res.json({ success: true, data: application, message: 'Status updated successfully' });
};

// ─── @DELETE /api/applications/:id ───────────────────────────────────────────
exports.withdrawApplication = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  if (application.applicant.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (['shortlisted', 'interview', 'hired'].includes(application.status)) {
    return res.status(400).json({ success: false, message: 'Cannot withdraw after being shortlisted' });
  }

  await application.deleteOne();
  await Job.findByIdAndUpdate(application.job, { $inc: { applicantsCount: -1 } });

  res.json({ success: true, message: 'Application withdrawn' });
};

// ─── @GET /api/applications/stats ────────────────────────────────────────────
exports.getApplicationStats = async (req, res) => {
  const matchQuery = req.user.role === 'recruiter'
    ? { recruiter: req.user._id }
    : { applicant: req.user._id };

  const stats = await Application.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const result = { applied: 0, viewed: 0, shortlisted: 0, interview: 0, rejected: 0, hired: 0, total: 0 };
  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  res.json({ success: true, data: result });
};
