const cloudinary = require('../config').cloudinary;
const multer = require('multer'); // Need to install multer for file handling

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = async (file, folder = 'uploads') => {
    try {
        const result = await cloudinary.uploader.upload(file.path || file.buffer, {
            folder,
            resource_type: 'auto'
        });
        return result.secure_url;
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

module.exports = { upload, uploadToCloudinary };