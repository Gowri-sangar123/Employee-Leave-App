const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
    leaveBalances: {
        casual: { type: Number, default: 10 },
        sick: { type: Number, default: 8 },
        earned: { type: Number, default: 15 }
    }
});

module.exports = mongoose.model('User', userSchema);