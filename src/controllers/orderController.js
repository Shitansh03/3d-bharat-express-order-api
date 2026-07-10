const pool = require('../config/db');
const { createOrderSchema } = require('../validators/orderValidator');
const { findMatchingUser } = require('../utils/userLookup');


async function createOrder(req, res, next) {
  const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message)
    });
  }

  const { user, order } = value;

  const seenProducts = new Set();
  for (const item of order.items) {
    const key = item.product_name.trim().toLowerCase();
    if (seenProducts.has(key)) {
      return res.status(400).json({
        success: false,
        message: `Duplicate product "${item.product_name}" found within the same order`
      });
    }
    seenProducts.add(key);
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const match = await findMatchingUser(connection, user.email, user.mobile);

    if (match.status === 'CONFLICT') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: match.reason });
    }

    let userRecord;

    if (match.status === 'EXISTING') {
      userRecord = match.user;
    } else {
      const [insertUserResult] = await connection.query(
        'INSERT INTO users (full_name, email, mobile, status) VALUES (?, ?, ?, ?)',
        [user.full_name, user.email, user.mobile, 'Active']
      );
      userRecord = {
        user_id: insertUserResult.insertId,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        status: 'Active'
      };
    }

    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const totalAmountRounded = Math.round(totalAmount * 100) / 100;

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, order_date, total_amount) VALUES (?, ?, ?)',
      [userRecord.user_id, order.order_date, totalAmountRounded]
    );
    const orderId = orderResult.insertId;

    const insertedItems = [];
    for (const item of order.items) {
      const productName = item.product_name.trim();
      await connection.query(
        'INSERT INTO order_items (order_id, product_name, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, productName, item.quantity, item.price]
      );
      insertedItems.push({
        product_name: productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: Math.round(item.quantity * item.price * 100) / 100
      });
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order_id: orderId,
      summary: {
        user: userRecord,
        order: {
          order_id: orderId,
          order_date: order.order_date,
          total_amount: totalAmountRounded
        },
        items: insertedItems
      }
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
}


async function getOrderById(req, res, next) {
  const orderId = req.params.id;

  if (!/^\d+$/.test(orderId)) {
    return res.status(400).json({ success: false, message: 'Order id must be a positive integer' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         u.user_id, u.full_name, u.email, u.mobile, u.status,
         o.order_id, o.order_date, o.total_amount,
         oi.item_id, oi.product_name, oi.quantity, oi.price
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       JOIN order_items oi ON oi.order_id = o.order_id
       WHERE o.order_id = ?
       ORDER BY oi.item_id ASC`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const first = rows[0];
    const nested = {
      user: {
        user_id: first.user_id,
        full_name: first.full_name,
        email: first.email,
        mobile: first.mobile,
        status: first.status
      },
      order: {
        order_id: first.order_id,
        order_date: first.order_date,
        total_amount: first.total_amount
      },
      items: rows.map((r) => ({
        item_id: r.item_id,
        product_name: r.product_name,
        quantity: r.quantity,
        price: r.price
      }))
    };

    return res.status(200).json({ success: true, data: nested });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrderById };