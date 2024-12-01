const multer = require('multer');

//Configuration for multer
const storage = multer.memoryStorage();

const upload = multer({ 
    
    storage: storage,               // Use memory storage
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {       // Check if the file is an image
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);  // Reject the file
        }
    },

});

module.exports = upload;