const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// GET /api/admin/users
router.get('/users', auth, role('admin'), async (req, res) => {
    try {
        const users = await User.find({}, 'name email role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/leave-types
router.get('/leave-types', auth, role('admin'), async (req, res) => {
    try {
        const types = await LeaveType.find();
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/leave-types
router.post(
    '/leave-types',
    auth,
    role('admin'),
    [
        body('name').notEmpty().withMessage('Leave type name is required'),
        body('defaultBalance').isInt({ min: 0 }).withMessage('Default balance must be a non-negative integer'),
        validate
    ],
    async (req, res) => {
        const { name, defaultBalance } = req.body;
        try {
            const exists = await LeaveType.findOne({ name });
            if (exists) return res.status(400).json({ message: 'Leave type already exists' });
            const leaveType = new LeaveType({ name, defaultBalance });
            await leaveType.save();
            res.status(201).json({ message: 'Leave type created', leaveType });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// PUT /api/admin/leave-types/:id
router.put(
    '/leave-types/:id',
    auth,
    role('admin'),
    [
        body('name').notEmpty().withMessage('Leave type name is required'),
        body('defaultBalance').isInt({ min: 0 }).withMessage('Default balance must be a non-negative integer'),
        validate
    ],
    async (req, res) => {
        const { name, defaultBalance } = req.body;
        try {
            const leaveType = await LeaveType.findByIdAndUpdate(
                req.params.id,
                { name, defaultBalance },
                { new: true }
            );
            if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });
            res.json({ message: 'Leave type updated', leaveType });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// DELETE /api/admin/leave-types/:id
router.delete('/leave-types/:id', auth, role('admin'), async (req, res) => {
    try {
        const leaveType = await LeaveType.findByIdAndDelete(req.params.id);
        if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });
        res.json({ message: 'Leave type deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;