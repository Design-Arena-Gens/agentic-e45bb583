import express from 'express';
import Score from '../models/Score.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!['tictactoe', 'snake', 'quiz'].includes(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const leaderboard = await Score.aggregate([
      { $match: { gameId } },
      { $sort: { score: -1 } },
      { $group: { _id: '$userId', bestScore: { $first: '$score' }, createdAt: { $first: '$createdAt' } } },
      { $sort: { bestScore: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const userIds = leaderboard.map(entry => entry._id);
    const users = await User.find({ _id: { $in: userIds } }).select('username profilePicture');

    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: skip + index + 1,
      username: userMap[entry._id]?.username || 'Unknown',
      profilePicture: userMap[entry._id]?.profilePicture || '',
      score: entry.bestScore,
      createdAt: entry.createdAt
    }));

    const total = await Score.distinct('userId', { gameId });

    res.json({
      leaderboard: formattedLeaderboard,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total.length / limit),
        totalEntries: total.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

router.get('/:gameId/recent', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    if (!['tictactoe', 'snake', 'quiz'].includes(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const recentScores = await Score.find({ gameId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username profilePicture');

    const formatted = recentScores.map(score => ({
      username: score.userId?.username || 'Unknown',
      profilePicture: score.userId?.profilePicture || '',
      score: score.score,
      createdAt: score.createdAt
    }));

    res.json({ recentWinners: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching recent winners' });
  }
});

export default router;
