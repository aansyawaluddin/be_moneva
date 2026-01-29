import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const cleanName = file.originalname.replace(/\s+/g, '_');
        const finalName = Date.now() + '-' + cleanName;
        
        cb(null, finalName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('excel') || 
            file.mimetype.includes('spreadsheetml') || 
            file.mimetype.includes('sheet')) {
            cb(null, true);
        } else {
            cb(new Error("Hanya file Excel yang diperbolehkan!"), false);
        }
    }
});

export default upload;