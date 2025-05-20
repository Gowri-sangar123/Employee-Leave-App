const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, default: 'pending' },
    managerComment: { type: String, default: '' }
});

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);