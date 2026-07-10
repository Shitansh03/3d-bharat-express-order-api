const Joi = require('joi');

const isoDateString = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const isRealCalendarDate =
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d;
    if (!isRealCalendarDate) {
      return helpers.error('date.invalid');
    }
    return value;
  })
  .messages({
    'string.pattern.base': 'order_date must be in YYYY-MM-DD format',
    'date.invalid': 'order_date is not a valid calendar date'
  });

const itemSchema = Joi.object({
  product_name: Joi.string().trim().min(1).max(150).required().messages({
    'any.required': 'items[].product_name is required',
    'string.empty': 'items[].product_name cannot be empty'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'items[].quantity is required',
    'number.base': 'items[].quantity must be a number',
    'number.min': 'items[].quantity must be at least 1'
  }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'items[].price is required',
    'number.base': 'items[].price must be a number',
    'number.min': 'items[].price cannot be negative'
  })
});

const createOrderSchema = Joi.object({
  user: Joi.object({
    full_name: Joi.string().trim().min(1).max(150).required().messages({
      'any.required': 'user.full_name is required',
      'string.empty': 'user.full_name cannot be empty'
    }),
    email: Joi.string().trim().email().required().messages({
      'any.required': 'user.email is required',
      'string.email': 'user.email must be a valid email address'
    }),
    mobile: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
      'any.required': 'user.mobile is required',
      'string.pattern.base': 'user.mobile must be exactly 10 digits'
    })
  }).required().messages({ 'any.required': 'user object is required' }),

  order: Joi.object({
    order_date: isoDateString.required().messages({
      'any.required': 'order.order_date is required'
    }),
    items: Joi.array().items(itemSchema).min(1).required().messages({
      'any.required': 'order.items is required',
      'array.min': 'order.items must contain at least one item'
    })
  }).required().messages({ 'any.required': 'order object is required' })
});

module.exports = { createOrderSchema };