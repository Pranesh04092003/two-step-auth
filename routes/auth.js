const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();


// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({ token, is2FAEnabled: user.is2FAEnabled });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Generate 2FA Secret and QR Code
// Generate 2FA Secret and QR Code
router.get('/2fa/setup', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const secret = speakeasy.generateSecret({ name: "Auth-developed by `Pranesh`" });

  user.twoFASecret = secret.base32;
  await user.save();

  const otpauth_url = secret.otpauth_url;
  const qrCodeDataUrl = await new Promise((resolve, reject) => {
    qrcode.toDataURL(otpauth_url, (err, data_url) => {
      if (err) reject(err);
      else resolve(data_url);
    });
  });

  res.json({ secret: secret.base32, qrCodeDataUrl });
});

// Verify 2FA Token
router.post('/2fa/verify', auth, async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user.id);

  const verified = speakeasy.totp.verify({
    secret: user.twoFASecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    user.is2FAEnabled = true;
    await user.save();
    res.json({ msg: '2FA enabled' });
  } else {
    res.status(400).json({ msg: 'Invalid token' });
  }
});

// 2FA Login
router.post('/2fa/login', async (req, res) => {
  const { email, password, token } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      return res.status(400).json({ msg: 'Invalid 2FA token' });
    }

    const jwtToken = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({ token: jwtToken });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
  

