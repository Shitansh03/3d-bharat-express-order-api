async function findMatchingUser(runner, email, mobile) {
  const [rows] = await runner.query(
    'SELECT user_id, full_name, email, mobile, status FROM users WHERE email = ? OR mobile = ?',
    [email, mobile]
  );

  if (rows.length === 0) {
    return { status: 'NEW' };
  }

  if (rows.length === 1) {
    const existing = rows[0];
    const emailMatches = existing.email === email;
    const mobileMatches = existing.mobile === mobile;

    if (emailMatches && mobileMatches) {
      return { status: 'EXISTING', user: existing };
    }
    if (emailMatches && !mobileMatches) {
      return {
        status: 'CONFLICT',
        reason: 'Email is already registered with a different mobile number'
      };
    }
    return {
      status: 'CONFLICT',
      reason: 'Mobile is already registered with a different email address'
    };
  }

  return {
    status: 'CONFLICT',
    reason: 'Email and mobile belong to two different existing users'
  };
}

module.exports = { findMatchingUser };