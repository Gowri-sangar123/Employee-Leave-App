const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/Leaverequest');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
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

// GET /api/manager/leave-requests?status=&page=&limit=&employee=&from=&to=
router.get('/leave-requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).json({ message: 'Only managers can view all leave requests' });
    const { status, page = 1, limit = 10, employee, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employee) filter.employeeName = new RegExp(employee, 'i');
    if (from && to) filter.from = { $gte: from, $lte: to };
    try {
        const leaves = await LeaveRequest.find(filter)
            .sort({ from: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await LeaveRequest.countDocuments(filter);
        res.json({ leaves, total });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/manager/leave-requests/:id
router.put('/leave-requests/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'manager') return res.status(403).json({ message: 'Only managers can update leave requests' });
    const { status, managerComment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        // Deduct leave balance if approved
        if (status === 'approved' && leave.status !== 'approved') {
            const user = await User.findById(leave.employee);
            user.leaveBalances[leave.leaveType] -= 1;
            await user.save();
        }

        leave.status = status;
        leave.managerComment = managerComment || '';
        await leave.save();

        res.json({ message: 'Leave request updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;