const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/Leaverequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { sendEmail } = require('../utils/email');

// GET /api/manager/leave-requests?status=&page=&limit=&employee=&from=&to=
router.get(
    '/leave-requests',
    auth,
    role('manager'),
    [
        query('status').optional({ checkFalsy: true }).isIn(['pending', 'approved', 'rejected']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1 }),
        query('employee').optional().isString(),
        query('from').optional().isISO8601(),
        query('to').optional().isISO8601(),
        query('sort').optional().isIn(['asc', 'desc']),
        validate
    ],
    async (req, res) => {
        let { status, page = 1, limit = 10, employee, from, to, sort = 'desc' } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (!limit || limit < 1) limit = 0;
        const filter = {};
        if (status) filter.status = status;
        if (employee) filter.employeeName = new RegExp(employee, 'i');
        if (from && to) filter.from = { $gte: from, $lte: to };
        try {
            let query = LeaveRequest.find(filter).sort({ from: sort === 'asc' ? 1 : -1 });
            if (limit > 0) {
                query = query.skip((page - 1) * limit).limit(limit);
            }
            const leaves = await query;
            const total = await LeaveRequest.countDocuments(filter);
            res.json({ leaves, total });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// PUT /api/manager/leave-requests/:id
router.put(
    '/leave-requests/:id',
    auth,
    role('manager'),
    [
        body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
        body('managerComment').optional().isString(),
        validate
    ],
    async (req, res) => {
        const { status, managerComment } = req.body;
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

            // Send email notification to employee
            const employee = await User.findById(leave.employee);
            if (employee && employee.email) {
                const subject = `Your leave request has been ${status}`;
                const text = `Hi ${employee.name},\n\nYour leave request from ${leave.from.toISOString().slice(0, 10)} to ${leave.to.toISOString().slice(0, 10)} has been ${status} by the manager.\n\nComment: ${managerComment || 'No comment'}\n\nRegards,\nLeave Management System`;
                sendEmail(employee.email, subject, text).catch(console.error);
            }

            res.json({ message: 'Leave request updated' });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

module.exports = router;