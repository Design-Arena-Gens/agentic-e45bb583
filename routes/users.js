import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Score from '../models/Score.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const scores = await Score.aggregate([
      { $match: { userId: user._id } },
      { $sort: { score: -1 } },
      { $group: { _id: '$gameId', bestScore: { $first: '$score' } } }
    ]);

    const bestScores = {};
    scores.forEach(s => {
      bestScores[s._id] = s.bestScore;
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      },
      bestScores
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

router.put('/profile', authenticateToken, [
  body('username').optional().trim().isLength({ min: 3, max: 30 }).escape(),
  body('profilePicture').optional().isURL()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.profilePicture !== undefined) updates.profilePicture = req.body.profilePicture;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    const isValidPassword = await user.comparePassword(req.body.currentPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error changing password' });
  }
});

export default router;
