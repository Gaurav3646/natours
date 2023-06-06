const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const handlerFactory = require('./handlerFactory');

// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'route is not yet defined, please use /signup',
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
