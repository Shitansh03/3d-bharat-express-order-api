const express = require('express');
const router = express.Router();
const { validateUser } = require('../controllers/userController');

router.post('/validate', validateUser);

module.exports = router;