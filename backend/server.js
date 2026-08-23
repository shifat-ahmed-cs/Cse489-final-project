require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const exerciseRoutes = require('./routes/exercises');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const foodRoutes = require('./routes/foods');
const recipeRoutes = require('./routes/recipes');
const progressRoutes = require('./routes/progress');
const goalRoutes = require('./routes/goals');
const assistantRoutes = require('./routes/assistant');
const creatorRoutes = require('./routes/creators');
const communityRoutes = require('./routes/community');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'BodyPilot API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 BodyPilot API server running on port ${PORT}`);
});

module.exports = app;
