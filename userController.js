/**
 * User Controller
 * Profile management, saved jobs, avatar/resume upload
 */

const User = require('../models/User');
const { Application } = require('../models/Application');
const Job = require('../models/Job');

// ─── @GET /api/users/profile ──────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedJobs', 'title company location type salary status createdAt');
  res.json({ success: true, data: user });
};

// ─── @PUT /api/users/profile ──────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const allowedFields = ['name', 'phone', 'location', 'bio', 'skills', 'experience', 'education', 'company'];
  const updates = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user, message: 'Profile updated successfully' });
};

// ─── @PUT /api/users/avatar ───────────────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path },
    { new: true }
  );
  res.json({ success: true, data: { avatar: user.avatar }, message: 'Avatar updated' });
};

// ─── @PUT /api/users/resume ───────────────────────────────────────────────────
exports.uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { resume: req.file.path },
    { new: true }
  );
  res.json({ success: true, data: { resume: user.resume }, message: 'Resume uploaded successfully' });
};

// ─── @POST /api/users/save-job/:jobId ────────────────────────────────────────
exports.saveJob = async (req, res) => {
  const user = await User.findById(req.user._id);
  const jobId = req.params.jobId;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const alreadySaved = user.savedJobs.includes(jobId);
  if (alreadySaved) {
    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    await user.save({ validateBeforeSave: false });
    return res.json({ success: true, saved: false, message: 'Job removed from saved list' });
  }

  user.savedJobs.push(jobId);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, saved: true, message: 'Job saved to wishlist' });
};

// ─── @GET /api/users/saved-jobs ──────────────────────────────────────────────
exports.getSavedJobs = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'savedJobs',
      select: 'title company location type salary status createdAt applicantsCount',
      populate: { path: 'recruiter', select: 'name' }
    });
  res.json({ success: true, data: user.savedJobs });
};

// ─── @GET /api/users/:id/public ──────────────────────────────────────────────
exports.getPublicProfile = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name avatar bio skills experience education location company role createdAt');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};
