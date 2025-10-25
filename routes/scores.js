import express from 'express';
import { body, validationResult } from 'express-validator';
import Score from '../models/Score.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/:gameId', authenticateToken, [
  body('score').isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { gameId } = req.params;
    const { score } = req.body;

    if (!['tictactoe', 'snake', 'quiz'].includes(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const newScore = new Score({
      userId: req.user.id,
      gameId,
      score
    });

    await newScore.save();

    if (req.app.get('wss')) {
      req.app.get('wss').clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'scoreUpdate', gameId }));
        }
      });
    }

    res.status(201).json({ message: 'Score submitted successfully', score: newScore });
  } catch (error) {
    res.status(500).json({ error: 'Server error submitting score' });
  }
});

export default router;
