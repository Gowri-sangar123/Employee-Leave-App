const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['employee', 'manager', 'admin']).withMessage('Invalid role'),
        validate
    ],
    async (req, res) => {
        const { name, email, password, role } = req.body;
        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ message: 'User already exists' });
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ name, email, password: hashedPassword, role });
            await newUser.save();
            const token = jwt.sign(
                { id: newUser._id, role: newUser.role, name: newUser.name, email: newUser.email },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            res.status(201).json({ token, role: newUser.role, name: newUser.name });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) return res.status(400).json({ message: 'User not found' });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
            const token = jwt.sign(
                { id: user._id, role: user.role, name: user.name, email: user.email },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            res.json({ token, role: user.role, name: user.name });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

module.exports = router;