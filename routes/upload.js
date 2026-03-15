const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import authentication middleware
const { isAuthenticated } = require('./auth');

const EXTERNAL_LINKS_FILE = path.join(__dirname, '..', 'data', 'external_links.json');

// Helper to read external links
const getExternalLinks = () => {
    try {
        if (!fs.existsSync(EXTERNAL_LINKS_FILE)) {
            if (!fs.existsSync(path.dirname(EXTERNAL_LINKS_FILE))) {
                fs.mkdirSync(path.dirname(EXTERNAL_LINKS_FILE), { recursive: true });
            }
            fs.writeFileSync(EXTERNAL_LINKS_FILE, '[]');
            return [];
        }
        return JSON.parse(fs.readFileSync(EXTERNAL_LINKS_FILE, 'utf8'));
    } catch (err) {
        console.error('Error reading external links:', err);
        return [];
    }
};

// Helper to save external links
const saveExternalLinks = (links) => {
    try {
        fs.writeFileSync(EXTERNAL_LINKS_FILE, JSON.stringify(links, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving external links:', err);
        return false;
    }
};

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, '..', 'public', 'uploads');

        if (req.originalUrl.includes('/gallery/')) {
            const category = req.originalUrl.split('/gallery/')[1].split('/')[0];
            uploadPath = path.join(uploadPath, 'gallery', category);
        } else if (req.originalUrl.includes('/banner')) {
            uploadPath = path.join(uploadPath, 'banner');
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports images and videos!"));
    }
});


// Helper to get all files in a directory
const getFilesInDir = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) return [];
        const files = fs.readdirSync(dirPath);
        return files.filter(file => {
            // Basic check to ensure it's a file, not a directory
            return fs.statSync(path.join(dirPath, file)).isFile();
        });
    } catch (err) {
        console.error(`Error reading directory ${dirPath}:`, err);
        return [];
    }
};

// --- Public Routes ---

// Get all gallery images dynamically
router.get('/gallery', (req, res) => {
    const galleryBase = path.join(__dirname, '..', 'public', 'uploads', 'gallery');
    const result = { all: [] };

    if (fs.existsSync(galleryBase)) {
        const categories = fs.readdirSync(galleryBase).filter(f => fs.statSync(path.join(galleryBase, f)).isDirectory());

        categories.forEach(cat => {
            const files = getFilesInDir(path.join(galleryBase, cat)).map(f => `/uploads/gallery/${cat}/${f}`);
            result[cat] = files;
        });
    }

    // Add external links
    const externalLinks = getExternalLinks();
    externalLinks.forEach(item => {
        if (!result[item.category]) result[item.category] = [];
        result[item.category].push(item.url);
    });

    // Generate 'all' category
    result.all = [];
    Object.keys(result).forEach(key => {
        if (key !== 'all') {
            result.all.push(...result[key]);
        }
    });

    res.json(result);
});

// Get all banner images
router.get('/banner', (req, res) => {
    const bannerPath = path.join(__dirname, '..', 'public', 'uploads', 'banner');
    const bannerFiles = getFilesInDir(bannerPath).map(f => `/uploads/banner/${f}`);
    res.json(bannerFiles);
});


// --- Protected Admin Routes ---

// Upload Gallery Image
router.post('/gallery/:category', isAuthenticated, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/gallery/${req.params.category}/${req.file.filename}`;
    res.json({ success: true, message: 'Image uploaded', url: imageUrl });
});

// Delete Gallery Image
router.delete('/gallery/:category/:filename', isAuthenticated, (req, res) => {
    const { category, filename } = req.params;
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'gallery', category, filename);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Image deleted' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error deleting file' });
    }
});

// Upload Banner Image
router.post('/banner', isAuthenticated, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/banner/${req.file.filename}`;
    res.json({ success: true, message: 'Banner uploaded', url: imageUrl });
});

// Delete Banner Image
router.delete('/banner/:filename', isAuthenticated, (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'banner', filename);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Banner deleted' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error deleting file' });
    }
});

// Add External Link
router.post('/external-link', isAuthenticated, (req, res) => {
    const { url, category } = req.body;
    if (!url || !category) {
        return res.status(400).json({ error: 'URL and category are required' });
    }

    const links = getExternalLinks();
    links.push({ id: Date.now().toString(), url, category });
    
    if (saveExternalLinks(links)) {
        res.json({ success: true, message: 'Link added successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save link' });
    }
});

// Delete External Link
router.delete('/external-link', isAuthenticated, (req, res) => {
    const { url, category } = req.query;
    if (!url || !category) {
        return res.status(400).json({ error: 'URL and category are required' });
    }

    let links = getExternalLinks();
    links = links.filter(l => !(l.url === url && l.category === category));

    if (saveExternalLinks(links)) {
        res.json({ success: true, message: 'Link deleted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

module.exports = router;
