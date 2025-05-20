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
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

// GET /api/manager/leave-requests
router.get('/leave-requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Only managers can view all leave requests' });
    }

    try {
        const leaves = await LeaveRequest.find().sort({ from: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/manager/leave-requests/:id
router.put('/leave-requests/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Only managers can update leave requests' });
    }

    const { status, managerComment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        leave.status = status;
        leave.managerComment = managerComment || '';
        await leave.save();

        res.json({ message: 'Leave request updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;