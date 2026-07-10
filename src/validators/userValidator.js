const Joi = require('joi');

const validateUserSchema = Joi.object({
  full_name: Joi.string().trim().min(1).max(150).required().messages({
    'any.required': 'full_name is required',
    'string.empty': 'full_name cannot be empty'
  }),
  email: Joi.string().trim().email().required().messages({
    'any.required': 'email is required',
    'string.email': 'email must be a valid email address'
  }),
  mobile: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
    'any.required': 'mobile is required',
    'string.pattern.base': 'mobile must be exactly 10 digits'
  })
});

module.exports = { validateUserSchema };
