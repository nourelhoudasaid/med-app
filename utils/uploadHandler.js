const { cloudinary } = require('../config/cloudinary');

const handleUpload = async (file, folder = 'med-app') => {
  try {
    if (!file) return null;

    if (!file.buffer && !file.path) {
      throw new Error('Invalid file format');
    }

    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      public_id: `${folder}/${Date.now()}-${file.originalname}`,
      overwrite: true
    };

    const result = file.buffer 
      ? await cloudinary.uploader.upload_stream(uploadOptions)
      : await cloudinary.uploader.upload(file.path, uploadOptions);

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

const deleteFile = async (publicId) => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

module.exports = {
  handleUpload,
  deleteFile
}; 