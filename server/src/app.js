const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { dailyCleanup } = require('./utils/cleanup');

dailyCleanup();

const app = express();
app.use(morgan('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', require('./routes/api'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

app.listen(3002, () => {
  console.log('Server is listening on port 3002...');
});