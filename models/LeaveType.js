const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    defaultBalance: { type: Number, required: true }
});

module.exports = mongoose.model('LeaveType', leaveTypeSchema);