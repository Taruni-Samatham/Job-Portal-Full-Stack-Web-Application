/**
 * Admin Controller
 * User management, analytics, job moderation
 */

const User = require('../models/User');
const Job = require('../models/Job');
const { Application, Notification } = require('../models/Application');

// ─── @GET /api/admin/dashboard ────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const [
    totalUsers, totalJobs, totalApplications,
    jobSeekers, recruiters,
    activeJobs, closedJobs,
    recentUsers, recentJobs,
    userGrowth, jobGrowth, appGrowth
  ] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'recruiter' }),
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({ status: 'closed' }),
    User.find().sort('-createdAt').limit(5).select('name email role avatar createdAt isVerified'),
    Job.find().sort('-createdAt').limit(5).populate('recruiter', 'name company'),
    // Monthly growth - last 6 months
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Job.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Application.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      stats: { totalUsers, totalJobs, totalApplications, jobSeekers, recruiters, activeJobs, closedJobs },
      recentUsers,
      recentJobs,
      charts: { userGrowth, jobGrowth, appGrowth }
    }
  });
};

// ─── @GET /api/admin/users ────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 20, role, search, isBlocked } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).select('-password'),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
  });
};

// ─── @PUT /api/admin/users/:id/block ─────────────────────────────────────────
exports.blockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot block admin' });

  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    data: { isBlocked: user.isBlocked }
  });
};

// ─── @DELETE /api/admin/users/:id ────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' });

  await Promise.all([
    user.deleteOne(),
    Job.deleteMany({ recruiter: user._id }),
    Application.deleteMany({ $or: [{ applicant: user._id }, { recruiter: user._id }] })
  ]);

  res.json({ success: true, message: 'User and related data deleted' });
};

// ─── @GET /api/admin/jobs ─────────────────────────────────────────────────────
exports.getAllJobs = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) query.title = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find(query).populate('recruiter', 'name email company').sort('-createdAt').skip(skip).limit(Number(limit)),
    Job.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: jobs,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
  });
};

// ─── @PUT /api/admin/jobs/:id/feature ────────────────────────────────────────
exports.toggleFeatureJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  job.isFeatured = !job.isFeatured;
  await job.save();
  res.json({ success: true, message: `Job ${job.isFeatured ? 'featured' : 'unfeatured'}`, data: job });
};

// ─── @DELETE /api/admin/jobs/:id ─────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  await Promise.all([
    job.deleteOne(),
    Application.deleteMany({ job: job._id })
  ]);

  res.json({ success: true, message: 'Job deleted' });
};
