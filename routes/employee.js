const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/Leaverequest');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT and extract user info
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role, name }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

// POST /api/employee/leave-request
router.post('/leave-request', authMiddleware, async (req, res) => {
    if (req.user.role !== 'employee') {
        return res.status(403).json({ message: 'Only employees can submit leave requests' });
    }

    const { from, to, reason, employeeName } = req.body;
    try {
        const leaveRequest = new LeaveRequest({
            employee: req.user.id,
            employeeName: employeeName || req.user.name,
            from,
            to,
            reason,
            status: 'pending'
        });
        await leaveRequest.save();
        res.status(201).json({ message: 'Leave request submitted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/employee/leave-requests
router.get('/leave-requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'employee') {
        return res.status(403).json({ message: 'Only employees can view their leave requests' });
    }

    try {
        const leaves = await LeaveRequest.find({ employee: req.user.id }).sort({ from: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;