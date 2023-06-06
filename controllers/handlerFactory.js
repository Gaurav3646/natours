const catchAsync = require('./../utils/catchAsync');
const APIfeatures = require('./../utils/apiFeatures');
const AppError = require('./../utils/appError');
const { populate } = require('../models/tourModel');
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      next(new Error(`No doc found with that ID.`, 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res) => {
    console.log(req);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    console.log(req.params);
    const id = req.params.id;
    const doc = await Model.findById(req.params.id).populate(populateOptions);

    if (!doc) {
      return next(new AppError('No doc is found with this ID', 404));
    }
    console.log('error');
    res.status(200).json({
      status: 200,
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //(hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitfields()
      .paginates();
    const doc = await features.query;
    console.log(req.requestTime);
    res.status(200).json({
      status: 200,
      requestTime: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
