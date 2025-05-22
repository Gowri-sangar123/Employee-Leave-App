const LeaveRequest = require('../models/Leaverequest');

exports.checkLeaveBalance = (user, leaveType) => {
    return user.leaveBalances[leaveType] > 0;
};

exports.hasOverlappingLeave = async (userId, from, to) => {
    return await LeaveRequest.findOne({
        employee: userId,
        $or: [
            { from: { $lte: to }, to: { $gte: from } }
        ],
        status: { $in: ['pending', 'approved'] }
    });
}; 