const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Path to data files
const OFFERS_FILE = path.join(__dirname, '..', 'public', 'offers.json');
const SETTINGS_FILE = path.join(__dirname, '..', 'public', 'settings.json');
const CATEGORIES_FILE = path.join(__dirname, '..', 'data', 'categories.json');

// Import authentication middleware
const { isAuthenticated } = require('./auth');

// --- Helper Functions ---
const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return null;
    }
};

const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error(`Error writing to ${filePath}:`, err);
        return false;
    }
};


// --- Public Routes ---

// Keep-alive ping endpoint
router.get('/ping', (req, res) => {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Get current offers
router.get('/offers', (req, res) => {
    const data = readJsonFile(OFFERS_FILE) || [];
    res.json(data);
});

// Get global settings (social links, contact info)
router.get('/settings', (req, res) => {
    const data = readJsonFile(SETTINGS_FILE) || {};
    res.json(data);
});

// Contact form – send email to admin
router.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required.' });
    }

    // Read admin email from settings.json
    const settings = readJsonFile(SETTINGS_FILE) || {};
    const adminEmail = settings.email;

    if (!adminEmail) {
        return res.status(500).json({ error: 'Admin email not configured in settings.' });
    }

    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_gmail@gmail.com') {
        console.warn('[Contact] SMTP not configured – please set SMTP_USER and SMTP_PASS in .env');
        return res.status(500).json({ error: 'Email service is not configured on the server.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `"${process.env.SMTP_USER}"`,
        to: adminEmail,
        replyTo: `"${name}" <${email}>`,
        subject: subject ? `[Lavya Studio] ${subject}` : `[Lavya Studio] New Message from ${name}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
              <div style="background:#121212;padding:24px;text-align:center;">
                <h2 style="color:#D4AF37;margin:0;">Lavya Photo Studio</h2>
                <p style="color:#aaa;margin:4px 0 0;">New Contact Form Message</p>
              </div>
              <div style="padding:28px;background:#fff;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#666;width:100px;"><strong>Name</strong></td><td style="padding:8px 0;">${name}</td></tr>
                  <tr><td style="padding:8px 0;color:#666;"><strong>Email</strong></td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#666;"><strong>Subject</strong></td><td style="padding:8px 0;">${subject || '(none)'}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
                <h3 style="color:#333;margin-top:0;">Message</h3>
                <p style="color:#444;line-height:1.7;white-space:pre-line;">${message}</p>
              </div>
              <div style="background:#f5f5f5;padding:14px;text-align:center;font-size:12px;color:#999;">
                This email was sent via the contact form on your website.
                Reply directly to this email to respond to ${name}.
              </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
        console.error('[Contact] Failed to send email:', err.message);
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
});

// Get Categories
router.get('/categories', (req, res) => {
    const data = readJsonFile(CATEGORIES_FILE) || [
        { id: 'wedding', label: 'Wedding' },
        { id: 'birthday', label: 'Birthday' },
        { id: 'events', label: 'Events' }
    ];
    res.json(data);
});


// --- Protected Admin Routes ---

// Update existing offer or Add new offer
router.post('/offers', isAuthenticated, (req, res) => {
    const newOffer = req.body;
    let offers = readJsonFile(OFFERS_FILE) || [];

    if (newOffer.id) {
        // Update existing (Find index, replace object)
        const index = offers.findIndex(o => o.id === newOffer.id);
        if (index !== -1) {
            offers[index] = newOffer;
        } else {
            offers.push(newOffer); // It possessed an ID but wasn't found - push anyway
        }
    } else {
        // Add new (Generate random ID)
        newOffer.id = Date.now().toString();
        offers.push(newOffer);
    }

    if (writeJsonFile(OFFERS_FILE, offers)) {
        res.json({ success: true, message: 'Offer saved successfully', offers });
    } else {
        res.status(500).json({ error: 'Failed to save offer' });
    }
});

// Delete an offer
router.delete('/offers/:id', isAuthenticated, (req, res) => {
    const offerId = req.params.id;
    let offers = readJsonFile(OFFERS_FILE) || [];

    offers = offers.filter(o => o.id !== offerId);

    if (writeJsonFile(OFFERS_FILE, offers)) {
        res.json({ success: true, message: 'Offer deleted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

// Update global settings
router.post('/settings', isAuthenticated, (req, res) => {
    // Expects full settings object
    if (writeJsonFile(SETTINGS_FILE, req.body)) {
        res.json({ success: true, message: 'Settings saved successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Add Category
router.post('/categories', isAuthenticated, (req, res) => {
    const categories = readJsonFile(CATEGORIES_FILE) || [];
    categories.push(req.body);
    if (writeJsonFile(CATEGORIES_FILE, categories)) {
        res.json({ success: true, message: 'Category added' });
    } else {
        res.status(500).json({ error: 'Failed to add category' });
    }
});

// Delete Category
router.delete('/categories/:id', isAuthenticated, (req, res) => {
    let categories = readJsonFile(CATEGORIES_FILE) || [];
    categories = categories.filter(c => c.id !== req.params.id);
    if (writeJsonFile(CATEGORIES_FILE, categories)) {
        res.json({ success: true, message: 'Category deleted' });
    } else {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;
