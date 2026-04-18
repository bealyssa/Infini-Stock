const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-qrcode-originalname
        const qrCode = req.body.qrCode || 'asset'
        const timestamp = Date.now()
        const ext = path.extname(file.originalname)
        const filename = `${qrCode}-${timestamp}${ext}`
        cb(null, filename)
    },
})

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'))
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
})

module.exports = { upload, uploadsDir }
