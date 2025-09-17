// server.js
const express = require('express');
const cors = require('cors');
const moment = require('moment');
const app = express();
const PORT = 3000;

// An in-memory array to simulate a database for storing license keys
let keys = [];

// Enable CORS for all routes so your HTML file can access the API
app.use(cors());
// Parse JSON bodies for POST requests
app.use(express.json());

// A simple function to generate a random key.
function generateLicenseKey(duration, prefix = '') {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            key += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        if (i < 3) key += '-';
    }
    return prefix ? `${prefix}-${key}` : key;
}

// Endpoint to generate and save a license key
app.post('/api/generate-key', (req, res) => {
    console.log('API call received to /api/generate-key');
    const { duration, prefix } = req.body;

    if (!duration) {
        return res.status(400).json({ error: 'Duration is required.' });
    }

    const newKey = {
        key: generateLicenseKey(duration, prefix),
        duration: parseInt(duration),
        creationDate: moment().toISOString(),
        expiryDate: moment().add(duration, 'days').toISOString(),
        status: 'unused'
    };
    
    // Add the new key to our in-memory store
    keys.push(newKey);
    console.log('Generated and stored new key:', newKey.key);

    res.status(200).json({
        message: 'Key generated successfully!',
        key: newKey.key,
        duration: newKey.duration,
        expiryDate: newKey.expiryDate
    });
});

// New endpoint to verify and mark a key as used
app.post('/api/use-key', (req, res) => {
    console.log('API call received to /api/use-key');
    const { key } = req.body;

    // Find the key in the in-memory store
    const foundKey = keys.find(k => k.key === key);

    if (!foundKey) {
        return res.status(404).json({
            success: false,
            message: 'Key not found.'
        });
    }

    // Check if the key is already used
    if (foundKey.status === 'used') {
        return res.status(409).json({
            success: false,
            message: 'Key is already used.'
        });
    }
    
    // Check if the key is expired
    if (moment().isAfter(moment(foundKey.expiryDate))) {
        foundKey.status = 'expired'; // Update status to expired
        return res.status(410).json({
            success: false,
            message: 'Key has expired.'
        });
    }

    // Mark the key as used
    foundKey.status = 'used';
    console.log('Key marked as used:', foundKey.key);

    res.status(200).json({
        success: true,
        message: 'Key verified and used successfully.',
        duration: foundKey.duration
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
