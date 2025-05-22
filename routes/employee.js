const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LeaveRequest = require('../models/Leaverequest');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const leaveUtils = require('../utils/leaveUtils');
const { sendEmail } = require('../utils/email');

// POST /api/employee/leave-request
router.post(
    '/leave-request',
    auth,
    role('employee'),
    [
        body('from').isISO8601().toDate().withMessage('Valid from date required'),
        body('to').isISO8601().toDate().withMessage('Valid to date required'),
        body('reason').notEmpty().withMessage('Reason is required'),
        body('leaveType').isIn(['casual', 'sick', 'earned']).withMessage('Invalid leave type'),
        validate
    ],
    async (req, res) => {
        const { from, to, reason, leaveType, employeeName } = req.body;
        try {
            // Prevent overlapping
            const overlap = await leaveUtils.hasOverlappingLeave(req.user.id, from, to);
            if (overlap) return res.status(400).json({ message: 'Overlapping leave exists.' });

            // Check leave balance
            const user = await User.findById(req.user.id);
            if (!leaveUtils.checkLeaveBalance(user, leaveType)) {
                return res.status(400).json({ message: 'Insufficient leave balance.' });
            }

            const leaveRequest = new LeaveRequest({
                employee: req.user.id,
                employeeName: employeeName || req.user.name,
                from,
                to,
                reason,
                leaveType,
                status: 'pending'
            });
            await leaveRequest.save();

            // Send email notification to manager(s)
            const managers = await User.find({ role: 'manager' });
            for (const manager of managers) {
                if (manager.email) {
                    const subject = `New leave request from ${user.name}`;
                    const text = `Hi ${manager.name},\n\n${user.name} has submitted a leave request from ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}.\nType: ${leaveType}\nReason: ${reason}\n\nPlease review it in the Leave Management System.\n\nRegards,\nLeave Management System`;
                    sendEmail(manager.email, subject, text).catch(console.error);
                }
            }

            res.status(201).json({ message: 'Leave request submitted' });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// GET /api/employee/leave-requests
router.get('/leave-requests', auth, role('employee'), async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ employee: req.user.id }).sort({ from: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;