const mongoose = require('mongoose');
const dotenv = require('dotenv');
const halmet = require('helmet');
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHTEXCEPTION: 💥 Shutting down.....');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log(con.connection);
    console.log('DB connection successful!');
  });

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}....`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLEDREJECTION: 💥 Shutting down.....');
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
