const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'med-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => `${Date.now()}-${file.originalname}` // Add unique file names
  }
});

// Create multer upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Add a verification function
const verifyCloudinaryConfig = () => {
  const config = cloudinary.config();
  console.log('Cloudinary Configuration Status:', {
    cloud_name: config.cloud_name ? 'Configured' : 'Missing',
    api_key: config.api_key ? 'Configured' : 'Missing',
    api_secret: config.api_secret ? 'Configured' : 'Missing'
  });
  
  return config.cloud_name && config.api_key && config.api_secret;
};

module.exports = {
  cloudinary,
  upload,
  verifyCloudinaryConfig
};
