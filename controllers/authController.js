const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const handlerFactory = require('./../controllers/handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     const fileName = `user-${req.user.id}-${Date.now()}.${ext}`;
//     cb(null, fileName);
//   },
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload an image.', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const photo = req.file.buffer;

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(photo)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const filtered = {};
  // console.log(allowedFields, obj);
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filtered[el] = obj[el];
      // console.log(el);
    }
  });

  return filtered;
};
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, res, statusCode) => {
  const token = signToken(user._id);
  var now = new Date();
  const cookieOptions = {
    expires: new Date(
      now.getTime() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};
exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  console.log(newUser);

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 404));
  }
  const user = await User.findOne({ email }).select('+password');

  // const correct = ;

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password!', 401));
  }
  // console.log(user);
  createSendToken(user, res, 200);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  console.log('hello');
  console.log(req.cookies.jwt);
  // console.log(req);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(decode.id);
  if (!freshUser) {
    return next(
      new AppError('The token belonging to user does no longer exits', 401)
    );
  }

  const isChanged = freshUser.changePasswordAfter(decode.iat);
  if (isChanged) {
    return next(
      new AppError('User recently changed password! Please login again.', 401)
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'userloggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.isloggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;
      console.log(token);
      if (!token) {
        return next();
      }

      const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      const freshUser = await User.findById(decode.id);
      if (!freshUser) {
        return next();
      }

      const isChanged = freshUser.changePasswordAfter(decode.iat);
      if (isChanged) {
        return next();
      }
      res.locals.user = freshUser;

      return next();
    }
    next();
  } catch (err) {
    console.log(err);
    next();
  }
};

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!req.user && !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/resetpassword/${resetToken}`;
  // const resetUrl = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/resetpassword/${resetToken}`;
  // const message = `Forget your password? Submit a patch request with new password and passwordConfirm to: ${resetUrl}\n if you didn't forget your password please ignore this!`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token valid for 10 min.',
    //   message,
    // });
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error in sending email, try after sometime!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log('resetPassword');
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(hashedToken);
  var now = new Date();
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: now },
  });

  // console.log(now.getTimezoneOffset() * 6000);
  // console.log(new Date(user.passwordResetExpires));
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  console.log('changed');
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  console.log('user saved');
  createSendToken(user, res, 200);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (
    !user ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  ) {
    return next(new AppError('Your current password is wrong!', 401));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  console.log(user);
  await user.save();
  createSendToken(user, res, 200);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = handlerFactory.getOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not allowed for updating password. Please use route /updatepassword.',
        400
      )
    );
  }
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // console.log(filteredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    runValidators: true,
    new: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
