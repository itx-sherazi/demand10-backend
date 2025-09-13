import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create sponsor badges upload directory if it doesn't exist
const sponsorBadgesDir = path.join(process.cwd(), "uploads", "sponsor-badges");
if (!fs.existsSync(sponsorBadgesDir)) {
  fs.mkdirSync(sponsorBadgesDir, { recursive: true });
}

// Configure storage for sponsor badge images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, sponsorBadgesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sponsor-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default upload;