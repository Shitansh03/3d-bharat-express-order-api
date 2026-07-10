const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error(err);

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Request body contains invalid JSON'
    });
  }


  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry violates a unique constraint (email/mobile)'
    });
  }

  if (err && err.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
    return res.status(400).json({
      success: false,
      message: 'A numeric value in the request is out of the allowed range'
    });
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;