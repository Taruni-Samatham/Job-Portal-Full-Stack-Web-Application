/**
 * Job Controller
 * Full CRUD, search, filters, pagination
 */

const Job = require('../models/Job');
const { Notification } = require('../models/Application');

// ─── @GET /api/jobs ───────────────────────────────────────────────────────────
exports.getJobs = async (req, res) => {
  const {
    keyword, location, type, category, experience,
    minSalary, maxSalary, page = 1, limit = 10, sort = '-createdAt',
    status = 'active'
  } = req.query;

  const query = { status };

  // Text search
  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { 'company.name': { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } }
    ];
  }

  if (location) query['location.city'] = { $regex: location, $options: 'i' };
  if (type) query.type = type;
  if (category) query.category = category;
  if (experience) query.experience = experience;

  // Salary filter
  if (minSalary || maxSalary) {
    query['salary.min'] = {};
    if (minSalary) query['salary.min'].$gte = Number(minSalary);
    if (maxSalary) query['salary.max'] = { $lte: Number(maxSalary) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('recruiter', 'name email company avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: jobs,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit)
    }
  });
};

// ─── @GET /api/jobs/:id ───────────────────────────────────────────────────────
exports.getJob = async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('recruiter', 'name email avatar company');

  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  // Increment views
  await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.json({ success: true, data: job });
};

// ─── @POST /api/jobs ──────────────────────────────────────────────────────────
exports.createJob = async (req, res) => {
  const recruiter = req.user;

  const job = await Job.create({
    ...req.body,
    recruiter: recruiter._id,
    company: {
      name: req.body.companyName || recruiter.company?.name,
      logo: recruiter.company?.logo,
      website: recruiter.company?.website
    }
  });

  res.status(201).json({ success: true, data: job, message: 'Job posted successfully' });
};

// ─── @PUT /api/jobs/:id ───────────────────────────────────────────────────────
exports.updateJob = async (req, res) => {
  let job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: job, message: 'Job updated successfully' });
};

// ─── @DELETE /api/jobs/:id ────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await job.deleteOne();
  res.json({ success: true, message: 'Job deleted successfully' });
};

// ─── @GET /api/jobs/recruiter/my-jobs ────────────────────────────────────────
exports.getMyJobs = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { recruiter: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
    Job.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: jobs,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
  });
};

// ─── @GET /api/jobs/stats/overview ───────────────────────────────────────────
exports.getJobStats = async (req, res) => {
  const [byCategory, byType, recent] = await Promise.all([
    Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Job.find({ status: 'active' })
      .sort('-createdAt')
      .limit(5)
      .populate('recruiter', 'name company')
  ]);

  res.json({ success: true, data: { byCategory, byType, recent } });
};
