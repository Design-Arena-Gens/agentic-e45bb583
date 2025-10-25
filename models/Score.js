import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: String,
    required: true,
    enum: ['tictactoe', 'snake', 'quiz']
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

scoreSchema.index({ gameId: 1, score: -1 });
scoreSchema.index({ userId: 1, gameId: 1 });

export default mongoose.model('Score', scoreSchema);
