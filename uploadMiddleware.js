/**
 * Upload Middleware (Multer)
 * Handles resume PDFs and profile pictures
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ─── Storage Engine ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/misc';
    if (file.fieldname === 'resume') folder = 'uploads/resumes';
    if (file.fieldname === 'avatar') folder = 'uploads/avatars';
    if (file.fieldname === 'logo')   folder = 'uploads/logos';
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Resume must be a PDF file'), false);
  } else if (file.fieldname === 'avatar' || file.fieldname === 'logo') {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Image files only'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
