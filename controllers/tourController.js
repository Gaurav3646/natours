const fs = require('fs');
const Tour = require('../models/tourModel');
const APIfeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload an image.', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  const imageCoverFilename = `tour-${req.user.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);
  req.body.imageCover = imageCoverFilename;
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.user.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is : ${val}`);
//   if (+val > tours.length) {
//     return res.status(404).json({
//       status: 'failed',
//       message: 'invalid id',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'missing name or price',
//     });
//   }
//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res) => {
//   // console.log(req.params);

//   // try {
//   // const queryObj = { ...req.query };
//   // // console.log(queryObj);
//   // const excludeFields = ['page', 'sort', 'limit', 'fields'];
//   // excludeFields.forEach((el) => delete queryObj[el]);

//   // let queryStr = JSON.stringify(queryObj);

//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//   // console.log(JSON.parse(queryStr));
//   // let query = Tour.find(JSON.parse(queryStr));
//   ////////////////////////////////////////////////////////////

//   // const tours = await Tour.find()
//   // .where('duration')
//   // .lte(5)
//   // .where('difficulty')
//   // .equals('easy');

//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   console.log(fields);

//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }
//   //////////////////////////////////////

//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');

//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }
//   ///////////////////////

//   // const page = +req.query.page || 1;
//   // const limit = +req.query.limit || 100;
//   // const skip = (page - 1) * limit;

//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip > numTours) {
//   //     throw new Error('This page does not exist');
//   //   }
//   // }
//   ///////////////

//   const features = new APIfeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitfields()
//     .paginates();
//   const tours = await features.query;
//   console.log(req.requestTime);
//   res.status(200).json({
//     status: 200,
//     requestTime: req.requestTime,
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fails',
//   //     message: err.message,
//   //   });
//   // }
// });

exports.getAllTours = handlerFactory.getAll(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  // try {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { numRating: 1 },
    },
  ]);

  res.status(200).json({
    status: 200,
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fails',
  //     message: err.message,
  //   });
  // }
});

exports.getMontlyPlan = catchAsync(async (req, res) => {
  // try {
  const year = +req.params.year;

  console.log(year);
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        // _id: null,
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numToursStarts: -1,
      },
    },
    { $limit: 1 },
  ]);
  res.status(200).json({
    status: 200,
    data: {
      plan,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fails',
  //     message: err.message,
  //   });
  // }
});

exports.getToursWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide longitude and latitude in this given format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit == 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide longitude and latitude in this given format lat,lng.',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

// exports.getTour = catchAsync(async (req, res, next) => {
//   console.log(req.params);
//   const id = req.params.id;
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // const tour = tours.find((el) => el.id === id);
//   // if (!tour) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: 'invalid id',
//   //   });
//   // }
//   // try {
//   // if (!tour) {

//   // }
//   // return next(new AppError('No tour is foun with this ID', 404));
//   if (!tour) {
//     return next(new AppError('No tour is found with this ID', 404));
//   }
//   console.log('error');
//   res.status(200).json({
//     status: 200,
//     data: {
//       tour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: 'invalid id',
//   //   });
//   // }
// });

exports.getTour = handlerFactory.getOne(Tour, { path: 'reviews' });
// exports.createTour = catchAsync(async (req, res, next) => {
//   // console.log(req.body);
//   // const newId = tours[tours.length - 1].id + 1;
//   // const newTour = Object.assign({ id: newId }, req.body);
//   // tours.push(newTour);
//   // fs.writeFile(
//   //   `${__dirname}/dev-data/data/tours-simple.json`,
//   //   JSON.stringify(tours),
//   //   (err) => {
//   //     res.status(201).json({
//   //       status: 'success',
//   //       data: {
//   //         tour: newTour,
//   //       },
//   //     });
//   //   }
//   // );
//   // try {
//   // const tour = await Tour.create({
//   //   name: 'test tour 2',
//   //   duration: 10,
//   //   difficulty: 'easy',
//   //   price: 500,
//   //   rating: 4.7,
//   // });
//   // tour.save();
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fails',
//   //     message: err,
//   //   });
//   // }
// });

exports.createTour = handlerFactory.createOne(Tour);

// exports.updateTour = catchAsync(async (req, res) => {
//   // console.log(req.params);
//   // const id = +req.params.id;
//   // if (id > tours.length) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: 'invalid id',
//   //   });
//   // }
//   // try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: err,
//   //   });
//   // }
// });

exports.updateTour = handlerFactory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res) => {
//   // console.log(req.params);
//   // const id = +req.params.id;
//   // if (id > tours.length) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: 'invalid id',
//   //   });
//   // }
//   // try {
//   await Tour.findByIdAndDelete(req.params.id);
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: err,
//   //   });
//   // }
// });

exports.deleteTour = handlerFactory.deleteOne(Tour);
