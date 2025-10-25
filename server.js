import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import scoreRoutes from './routes/scores.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamehub';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.log('MongoDB connection error:', err.message);
    console.log('Using in-memory mock database for demo purposes');
  });

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/scores', scoreRoutes);
app.use('/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

app.set('wss', wss);

export default app;
