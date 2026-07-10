const pool = require('../config/db');
const { validateUserSchema } = require('../validators/userValidator');
const { findMatchingUser } = require('../utils/userLookup');


async function validateUser(req, res, next) {
  const { error, value } = validateUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message)
    });
  }

  const { email, mobile } = value;

  try {
    const match = await findMatchingUser(pool, email, mobile);

    if (match.status === 'CONFLICT') {
      return res.status(409).json({ success: false, message: match.reason });
    }

    if (match.status === 'EXISTING') {
      if (match.user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'User is valid and active',
        data: match.user
      });
    }

    return res.status(200).json({
      success: true,
      message: 'No duplicate email/mobile found. Data is valid.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { validateUser };