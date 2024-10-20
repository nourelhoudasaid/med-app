const crypto = require('crypto');

function generateCredentials() {
  // Generate a random username
  const username = 'user_' + crypto.randomBytes(4).toString('hex');

  // Generate a random password
  const password = generatePassword();

  return { username, password };
}

function generatePassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
}

module.exports = generateCredentials;
