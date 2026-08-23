/**
 * BodyPilot Progress Analyzer Engine
 * 
 * Analyzes user progress and provides insights:
 * - Weight trend analysis
 * - Workout consistency analysis
 * - Strength progression tracking
 * - Goal progress evaluation
 * - Plateau detection
 */

const WorkoutLog = require('../models/WorkoutLog');
const Progress = require('../models/Progress');
const Goal = require('../models/Goal');

/**
 * Analyze weight trend over time
 */
async function analyzeWeightTrend(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await Progress.find({
    userId,
    date: { $gte: since },
    weight: { $exists: true, $gt: 0 }
  }).sort({ date: 1 });

  if (entries.length < 2) {
    return {
      trend: 'insufficient_data',
      message: 'Not enough weight entries to determine a trend',
      entries: entries.map(e => ({ date: e.date, weight: e.weight }))
    };
  }

  const first = entries[0].weight;
  const last = entries[entries.length - 1].weight;
  const change = last - first;
  const weeklyRate = change / (days / 7);

  let trend = 'stable';
  if (change > 0.5) trend = 'increasing';
  else if (change < -0.5) trend = 'decreasing';

  return {
    trend,
    totalChange: +change.toFixed(1),
    weeklyRate: +weeklyRate.toFixed(2),
    startWeight: first,
    currentWeight: last,
    entries: entries.map(e => ({ date: e.date, weight: e.weight })),
    message: `Weight ${trend}: ${change > 0 ? '+' : ''}${change.toFixed(1)} kg over ${days} days (${weeklyRate > 0 ? '+' : ''}${weeklyRate.toFixed(2)} kg/week)`
  };
}

/**
 * Analyze workout consistency
 */
async function analyzeWorkoutConsistency(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await WorkoutLog.find({
    userId,
    date: { $gte: since },
    isCompleted: true
  }).sort({ date: 1 });

  const weeks = Math.ceil(days / 7);
  const totalWorkouts = logs.length;
  const avgPerWeek = +(totalWorkouts / weeks).toFixed(1);

  // Calculate streaks
  let currentStreak = 0;
  let maxStreak = 0;
  let lastWorkoutDate = null;

  for (const log of logs) {
    if (lastWorkoutDate) {
      const dayDiff = Math.round((log.date - lastWorkoutDate) / (1000 * 60 * 60 * 24));
      if (dayDiff <= 2) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    lastWorkoutDate = log.date;
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  // Average completion
  const avgCompletion = logs.length > 0
    ? +(logs.reduce((sum, l) => sum + l.completionPercentage, 0) / logs.length).toFixed(1)
    : 0;

  // Total volume
  const totalVolume = logs.reduce((sum, l) => sum + l.totalVolume, 0);

  return {
    totalWorkouts,
    avgPerWeek,
    currentStreak,
    maxStreak,
    avgCompletion,
    totalVolume,
    workoutDates: logs.map(l => l.date),
    message: `${totalWorkouts} workouts in ${days} days (avg ${avgPerWeek}/week). Current streak: ${currentStreak}. Avg completion: ${avgCompletion}%`
  };
}

/**
 * Analyze strength progression for a specific exercise
 */
async function analyzeStrengthProgression(userId, exerciseName, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await WorkoutLog.find({
    userId,
    date: { $gte: since },
    'exercises.exerciseName': exerciseName
  }).sort({ date: 1 });

  const progressionData = [];

  for (const log of logs) {
    const exercise = log.exercises.find(e => e.exerciseName === exerciseName);
    if (exercise && exercise.sets.length > 0) {
      const maxWeight = Math.max(...exercise.sets.filter(s => s.completed).map(s => s.weight || 0));
      const maxReps = Math.max(...exercise.sets.filter(s => s.completed).map(s => s.reps || 0));
      const totalVolume = exercise.sets
        .filter(s => s.completed)
        .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);

      progressionData.push({
        date: log.date,
        maxWeight,
        maxReps,
        totalVolume
      });
    }
  }

  if (progressionData.length < 2) {
    return { trend: 'insufficient_data', data: progressionData };
  }

  const firstMax = progressionData[0].maxWeight;
  const lastMax = progressionData[progressionData.length - 1].maxWeight;

  return {
    trend: lastMax > firstMax ? 'improving' : lastMax < firstMax ? 'declining' : 'stable',
    startMax: firstMax,
    currentMax: lastMax,
    change: lastMax - firstMax,
    data: progressionData
  };
}

/**
 * Evaluate progress toward goals
 */
async function evaluateGoalProgress(userId) {
  const goals = await Goal.find({ userId, isActive: true });
  const evaluations = [];

  for (const goal of goals) {
    const progress = goal.target > 0 ? ((goal.current - goal.startValue) / (goal.target - goal.startValue)) * 100 : 0;
    const clampedProgress = Math.min(100, Math.max(0, progress));

    let status = 'on_track';
    if (goal.deadline && new Date() > goal.deadline && !goal.isCompleted) {
      status = 'overdue';
    } else if (clampedProgress >= 100) {
      status = 'completed';
    } else if (clampedProgress < 25 && goal.deadline) {
      const totalDays = (goal.deadline - goal.createdAt) / (1000 * 60 * 60 * 24);
      const daysPassed = (new Date() - goal.createdAt) / (1000 * 60 * 60 * 24);
      if (daysPassed / totalDays > 0.5) status = 'behind';
    }

    evaluations.push({
      goalId: goal._id,
      title: goal.title,
      type: goal.type,
      target: goal.target,
      current: goal.current,
      unit: goal.unit,
      progress: +clampedProgress.toFixed(1),
      status,
      deadline: goal.deadline,
      milestones: goal.milestones
    });
  }

  return evaluations;
}

/**
 * Detect fitness plateaus
 */
async function detectPlateau(userId) {
  const plateaus = [];

  // Weight plateau
  const weightTrend = await analyzeWeightTrend(userId, 21);
  if (weightTrend.trend === 'stable' && weightTrend.entries.length >= 5) {
    plateaus.push({
      type: 'weight',
      message: 'Your weight has been stable for the past 3 weeks',
      recommendation: 'Consider adjusting your calorie intake or increasing workout intensity'
    });
  }

  // Workout performance plateau
  const workoutConsistency = await analyzeWorkoutConsistency(userId, 21);
  if (workoutConsistency.avgCompletion < 70) {
    plateaus.push({
      type: 'performance',
      message: 'Your workout completion rate has dropped below 70%',
      recommendation: 'Consider reducing workout difficulty or duration, or taking a deload week'
    });
  }

  return plateaus;
}

/**
 * Generate a comprehensive progress dashboard summary
 */
async function generateDashboardSummary(userId) {
  const [weightTrend, consistency, goals, plateaus] = await Promise.all([
    analyzeWeightTrend(userId, 30),
    analyzeWorkoutConsistency(userId, 30),
    evaluateGoalProgress(userId),
    detectPlateau(userId)
  ]);

  return {
    weight: weightTrend,
    workout: consistency,
    goals,
    plateaus,
    generatedAt: new Date()
  };
}

module.exports = {
  analyzeWeightTrend,
  analyzeWorkoutConsistency,
  analyzeStrengthProgression,
  evaluateGoalProgress,
  detectPlateau,
  generateDashboardSummary
};
