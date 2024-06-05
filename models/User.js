const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  is2FAEnabled: { type: Boolean, default: false },
  twoFASecret: { type: String },
});

module.exports = mongoose.model('User', UserSchema);
