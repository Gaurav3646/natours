const express = require('express');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');
const viewsController = require('./../controllers/viewsController');
const router = express.Router();

router.get('/signup', viewsController.getSignupForm);
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isloggedIn,
  viewsController.getOverview
);
router.get('/forgetpassword', viewsController.getResetLink);
router.get('/resetpassword/:token', viewsController.getResetForm);
router.get('/login', authController.isloggedIn, viewsController.getLoginForm);
router.get('/tour/:slug', authController.isloggedIn, viewsController.getTour);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
module.exports = router;
