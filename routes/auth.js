const express = require('express');
const router = express.Router();

// Middleware to check if admin is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
};

// Login Route
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check against .env credentials
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.json({ success: true, message: 'Logged in successfully' });
    }

    return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check Session Status
router.get('/check', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

module.exports = {
    router,
    isAuthenticated
};
