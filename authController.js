/**
 * Auth Controller
 * Registration, Login, OTP Verification, Password Reset
 */

const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { sendVerificationToken, checkVerificationToken } = require('../utils/smsService');

// ─── Helper: send token response ──────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    company: user.company,
    skills: user.skills,
    resume: user.resume,
    location: user.location,
    bio: user.bio,
    phone: user.phone,
    experience: user.experience,
    education: user.education,
  };
  res.status(statusCode).json({ success: true, token, user: userData });
};

// ─── @POST /api/auth/register ─────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, role, company, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name, email, password,
    role: role || 'jobseeker',
    phone,
    company: role === 'recruiter' ? company : undefined
  });

  // Send Twilio Verification if phone is provided
  if (user.phone) {
    await sendVerificationToken(user.phone);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please enter the OTP sent to your phone.',
    userId: user._id
  });
};

// ─── @POST /api/auth/verify-otp ───────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  const { userId, email, otp, phone } = req.body;

  let user;
  if (userId) {
    user = await User.findById(userId);
  } else if (email) {
    user = await User.findOne({ email });
  }

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Use Twilio Verify to check the token
  const phoneNumber = phone || user.phone;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required for verification' });
  }

  const result = await checkVerificationToken(phoneNumber, otp);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// ─── @POST /api/auth/resend-otp ───────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user.phone) {
    await sendVerificationToken(user.phone);
  }

  res.json({ success: true, message: 'OTP resent! Check your phone.' });
};

// ─── @POST /api/auth/login ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
  }

  if (!user.isVerified) {
    if (user.phone) {
      await sendVerificationToken(user.phone);
    }
    return res.status(403).json({
      success: false,
      message: 'Account not verified. A new OTP has been sent to your phone.',
      userId: user._id,
      phone: user.phone,
      requiresVerification: true
    });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// ─── @GET /api/auth/me ────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedJobs', 'title company status');
  res.json({ success: true, user });
};

// ─── @POST /api/auth/forgot-password ──────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user, resetToken);
  res.json({ success: true, message: 'Password reset link sent to your email' });
};

// ─── @PUT /api/auth/reset-password/:token ────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// ─── @PUT /api/auth/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
};
