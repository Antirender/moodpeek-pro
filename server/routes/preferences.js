const express = require('express');
const authRequired = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const ALLOWED_THEMES = ['system', 'light', 'dark'];

router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = user.preferences || {};
    return res.json({
      defaultCity: preferences.defaultCity || '',
      theme: preferences.theme || 'system',
    });
  } catch (err) {
    console.error('Preferences fetch error', err);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { defaultCity, theme } = req.body || {};
    const update = {};

    if (defaultCity !== undefined) {
      update['preferences.defaultCity'] = (defaultCity || '').trim();
    }

    if (theme !== undefined) {
      if (!ALLOWED_THEMES.includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme preference' });
      }
      update['preferences.theme'] = theme;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'No valid preference fields provided' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
      },
    });
  } catch (err) {
    console.error('Preferences update error', err);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
