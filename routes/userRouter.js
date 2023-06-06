const crypto = require('crypto');
const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgetpassword', authController.forgetPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

// we can also use
router.patch(
  '/updatepassword',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  authController.protect,
  authController.getMe,
  authController.getUser
);
router.patch(
  '/updateMe',
  authController.protect,
  authController.uploadUserPhoto,
  authController.resizeUserPhoto,
  authController.updateMe
);
router.delete('/deleteMe', authController.protect, authController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(
    // authController.protect,-
    // authController.restrictTo('admin'),
    userController.getAllUsers
  )
  .post(userController.createUser);

router
  .route('/:id')
  .get(
    // authController.protect,
    // authController.restrictTo('admin'),
    userController.getUser
  )
  .patch(
    // authController.protect,
    // authController.restrictTo('admin'),
    userController.updateUser
  )
  .delete(
    // authController.protect,
    // authController.restrictTo('admin'),
    userController.deleteUser
  );

module.exports = router;
