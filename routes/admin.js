const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LeaveType = require('../models/LeaveType'); // You need to create this model
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    next();
}

// GET /api/admin/users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// GET /api/admin/leave-types
router.get('/leave-types', authMiddleware, adminOnly, async (req, res) => {
    const types = await LeaveType.find();
    res.json(types);
});

module.exports = router;