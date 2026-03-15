require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using https
}));

// Setup routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes.router);
app.use('/api/data', apiRoutes);
app.use('/api/upload', uploadRoutes);

// Static files (must be AFTER API routes so APIs resolve first)
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
