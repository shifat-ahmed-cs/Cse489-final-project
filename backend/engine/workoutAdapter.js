/**
 * BodyPilot Workout Adaptation Engine
 * 
 * Handles dynamic workout plan modifications:
 * - Injury-based adaptation (remove/replace affected exercises)
 * - Time-based adaptation (shorten/lengthen workouts)
 * - Equipment change adaptation
 * - Difficulty adjustment
 * - Smart rescheduling for missed workouts
 * - Progressive overload based on performance
 */

const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const { filterExercisesForUser, GOAL_PARAMS } = require('./workoutGenerator');

/**
 * Adapt workout plan for a new injury
 */
async function adaptForInjury(plan, user, injuryArea) {
  const allExercises = await Exercise.find({ isActive: true });
  const availableExercises = filterExercisesForUser(allExercises, user);
  const changes = [];

  // Map injury areas to affected muscle groups
  const injuryMuscleMap = {
    knee: ['quadriceps', 'hamstrings', 'calves'],
    shoulder: ['shoulders', 'chest'],
    back: ['back', 'lower_back', 'lats'],
    lower_back: ['lower_back', 'core'],
    wrist: ['forearms', 'biceps', 'triceps'],
    ankle: ['calves', 'quadriceps'],
    hip: ['hip_flexors', 'glutes', 'quadriceps'],
    elbow: ['biceps', 'triceps', 'forearms'],
    neck: ['traps', 'shoulders']
  };

  const affectedMuscles = injuryMuscleMap[injuryArea.toLowerCase()] || [];

  for (const day of plan.schedule) {
    if (day.isRestDay) continue;

    const originalExercises = [...day.exercises];
    const newExercises = [];

    for (const exercise of day.exercises) {
      // Check if exercise targets affected muscle group
      const fullExercise = allExercises.find(e => e._id.toString() === exercise.exerciseId?.toString());
      const isAffected = fullExercise && fullExercise.muscleGroups.some(mg => affectedMuscles.includes(mg));

      if (isAffected) {
        // Try to find a replacement that doesn't use the injured area
        const replacement = availableExercises.find(ex =>
          !ex.muscleGroups.some(mg => affectedMuscles.includes(mg)) &&
          ex.bodyArea === fullExercise.bodyArea &&
          !day.exercises.some(de => de.exerciseId?.toString() === ex._id.toString())
        );

        if (replacement) {
          newExercises.push({
            exerciseId: replacement._id,
            exerciseName: replacement.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: 0,
            restPeriod: exercise.restPeriod,
            duration: exercise.duration,
            notes: `Replaced ${exercise.exerciseName} due to ${injuryArea} injury`,
            order: exercise.order
          });
          changes.push(`Replaced "${exercise.exerciseName}" with "${replacement.name}" (${injuryArea} injury)`);
        } else {
          changes.push(`Removed "${exercise.exerciseName}" (${injuryArea} injury, no suitable replacement)`);
        }
      } else {
        newExercises.push(exercise);
      }
    }

    day.exercises = newExercises;
  }

  plan.lastAdaptedAt = new Date();
  plan.adaptationHistory.push({
    reason: `Injury adaptation: ${injuryArea}`,
    changes: changes.join('; '),
    date: new Date()
  });

  return { plan, changes };
}

/**
 * Adapt workout for different available time
 */
async function adaptForTime(plan, dayOfWeek, availableMinutes) {
  const day = plan.schedule.find(d => d.dayOfWeek === dayOfWeek);
  if (!day || day.isRestDay) return { plan, changes: ['No workout scheduled for this day'] };

  const changes = [];
  const originalDuration = day.duration;

  if (availableMinutes < originalDuration) {
    // Shorten: reduce exercises and sets
    const ratio = availableMinutes / originalDuration;
    const targetExercises = Math.max(3, Math.round(day.exercises.length * ratio));

    // Keep compound exercises, remove isolations first
    day.exercises.sort((a, b) => a.order - b.order);
    const removed = day.exercises.splice(targetExercises);
    removed.forEach(ex => {
      changes.push(`Removed "${ex.exerciseName}" to fit ${availableMinutes} min`);
    });

    // Reduce rest periods
    day.exercises.forEach(ex => {
      ex.restPeriod = Math.max(30, Math.round(ex.restPeriod * 0.75));
    });

    day.duration = availableMinutes;
    changes.push(`Shortened workout from ${originalDuration} to ${availableMinutes} minutes`);
  } else if (availableMinutes > originalDuration + 15) {
    // Lengthen: add sets or exercises
    day.exercises.forEach(ex => {
      ex.sets += 1;
    });
    day.duration = availableMinutes;
    changes.push(`Extended workout from ${originalDuration} to ${availableMinutes} minutes (added sets)`);
  }

  plan.lastAdaptedAt = new Date();
  plan.adaptationHistory.push({
    reason: `Time adjustment: ${availableMinutes} minutes`,
    changes: changes.join('; '),
    date: new Date()
  });

  return { plan, changes };
}

/**
 * Adapt for equipment change
 */
async function adaptForEquipment(plan, user, newEquipment) {
  const allExercises = await Exercise.find({ isActive: true });
  const equipmentSet = [...newEquipment, 'none'];
  const changes = [];

  for (const day of plan.schedule) {
    if (day.isRestDay) continue;

    for (let i = 0; i < day.exercises.length; i++) {
      const exercise = day.exercises[i];
      const fullExercise = allExercises.find(e => e._id.toString() === exercise.exerciseId?.toString());

      if (fullExercise && !fullExercise.equipment.some(eq => equipmentSet.includes(eq))) {
        // Find replacement with available equipment
        const replacement = allExercises.find(ex =>
          ex.muscleGroups.some(mg => fullExercise.muscleGroups.includes(mg)) &&
          ex.equipment.some(eq => equipmentSet.includes(eq)) &&
          ex._id.toString() !== fullExercise._id.toString()
        );

        if (replacement) {
          day.exercises[i] = {
            exerciseId: replacement._id,
            exerciseName: replacement.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: 0,
            restPeriod: exercise.restPeriod,
            duration: exercise.duration,
            notes: `Replaced due to equipment change`,
            order: exercise.order
          };
          changes.push(`Replaced "${exercise.exerciseName}" with "${replacement.name}"`);
        }
      }
    }
  }

  plan.lastAdaptedAt = new Date();
  plan.adaptationHistory.push({
    reason: 'Equipment change',
    changes: changes.join('; '),
    date: new Date()
  });

  return { plan, changes };
}

/**
 * Adjust workout difficulty
 */
function adaptDifficulty(plan, direction) {
  const changes = [];

  for (const day of plan.schedule) {
    if (day.isRestDay) continue;

    for (const exercise of day.exercises) {
      if (direction === 'easier') {
        exercise.sets = Math.max(2, exercise.sets - 1);
        exercise.restPeriod = Math.min(180, exercise.restPeriod + 15);
        // Reduce reps if it's a range like "8-12"
        const repsMatch = exercise.reps.match(/(\d+)-(\d+)/);
        if (repsMatch) {
          const low = Math.max(1, parseInt(repsMatch[1]) - 2);
          const high = Math.max(low + 2, parseInt(repsMatch[2]) - 2);
          exercise.reps = `${low}-${high}`;
        }
      } else if (direction === 'harder') {
        exercise.sets += 1;
        exercise.restPeriod = Math.max(30, exercise.restPeriod - 15);
        const repsMatch = exercise.reps.match(/(\d+)-(\d+)/);
        if (repsMatch) {
          const low = parseInt(repsMatch[1]) + 2;
          const high = parseInt(repsMatch[2]) + 2;
          exercise.reps = `${low}-${high}`;
        }
      }
    }

    if (direction === 'easier') {
      day.intensity = day.intensity === 'very_high' ? 'high' : day.intensity === 'high' ? 'moderate' : 'low';
    } else {
      day.intensity = day.intensity === 'low' ? 'moderate' : day.intensity === 'moderate' ? 'high' : 'very_high';
    }
  }

  changes.push(`Adjusted all workouts to be ${direction}`);

  plan.lastAdaptedAt = new Date();
  plan.adaptationHistory.push({
    reason: `Difficulty adjustment: ${direction}`,
    changes: changes.join('; '),
    date: new Date()
  });

  return { plan, changes };
}

/**
 * Smart rescheduling for missed workouts
 */
function smartReschedule(plan, missedDayOfWeek) {
  const missedDay = plan.schedule.find(d => d.dayOfWeek === missedDayOfWeek);
  if (!missedDay || missedDay.isRestDay) {
    return { plan, changes: ['No workout was scheduled for that day'] };
  }

  const changes = [];
  const missedWorkout = { ...missedDay };

  // Strategy 1: Find the next rest day and move the workout there
  const futureDays = plan.schedule.filter(d => d.dayOfWeek > missedDayOfWeek);
  const nextRestDay = futureDays.find(d => d.isRestDay);

  if (nextRestDay) {
    nextRestDay.workoutType = missedWorkout.workoutType;
    nextRestDay.title = missedWorkout.title + ' (Rescheduled)';
    nextRestDay.duration = missedWorkout.duration;
    nextRestDay.exercises = missedWorkout.exercises;
    nextRestDay.isRestDay = false;
    nextRestDay.intensity = missedWorkout.intensity;

    // Make the missed day a rest day
    missedDay.workoutType = 'rest';
    missedDay.title = 'Rest Day';
    missedDay.duration = 0;
    missedDay.exercises = [];
    missedDay.isRestDay = true;
    missedDay.intensity = 'low';

    changes.push(`Moved "${missedWorkout.title}" from ${missedDay.dayName} to ${nextRestDay.dayName}`);
  } else {
    // Strategy 2: Combine with the next workout day (add key exercises)
    const nextWorkoutDay = futureDays.find(d => !d.isRestDay);
    if (nextWorkoutDay) {
      const keyExercises = missedWorkout.exercises.slice(0, 2); // Add top 2 exercises
      keyExercises.forEach(ex => {
        ex.sets = Math.max(2, ex.sets - 1); // Reduce volume
        ex.notes = `Added from missed ${missedDay.dayName} workout`;
      });
      nextWorkoutDay.exercises.push(...keyExercises);
      nextWorkoutDay.duration += 15;
      nextWorkoutDay.title += ` + ${missedWorkout.title} (Partial)`;
      changes.push(`Added key exercises from missed "${missedWorkout.title}" to ${nextWorkoutDay.dayName}`);
    } else {
      changes.push(`Could not reschedule "${missedWorkout.title}" - no available days this week`);
    }
  }

  plan.lastAdaptedAt = new Date();
  plan.adaptationHistory.push({
    reason: `Missed workout rescheduling: ${missedDay.dayName}`,
    changes: changes.join('; '),
    date: new Date()
  });

  return { plan, changes };
}

/**
 * Progressive overload - increase intensity based on workout logs
 */
async function applyProgressiveOverload(plan, userId) {
  const recentLogs = await WorkoutLog.find({ userId })
    .sort({ date: -1 })
    .limit(14);

  if (recentLogs.length < 3) return { plan, changes: ['Not enough workout data for progressive overload'] };

  const changes = [];

  // Check average difficulty feedback
  const avgDifficulty = recentLogs
    .filter(log => log.feedback.overallDifficulty)
    .map(log => {
      const map = { very_easy: 1, easy: 2, moderate: 3, hard: 4, very_hard: 5 };
      return map[log.feedback.overallDifficulty] || 3;
    });

  const avgDiff = avgDifficulty.reduce((a, b) => a + b, 0) / avgDifficulty.length;

  if (avgDiff < 2.5) {
    // Workouts are too easy - increase volume
    for (const day of plan.schedule) {
      if (day.isRestDay) continue;
      day.exercises.forEach(ex => {
        ex.sets = Math.min(6, ex.sets + 1);
      });
    }
    changes.push('Increased sets across all workouts (workouts reported as too easy)');
  } else if (avgDiff > 4) {
    // Workouts are too hard - decrease volume
    for (const day of plan.schedule) {
      if (day.isRestDay) continue;
      day.exercises.forEach(ex => {
        ex.sets = Math.max(2, ex.sets - 1);
        ex.restPeriod = Math.min(180, ex.restPeriod + 15);
      });
    }
    changes.push('Reduced sets and increased rest (workouts reported as too hard)');
  }

  // Check completion rates
  const avgCompletion = recentLogs.reduce((sum, log) => sum + log.completionPercentage, 0) / recentLogs.length;
  if (avgCompletion > 95) {
    plan.weekNumber += 1;
    changes.push(`Advanced to week ${plan.weekNumber} (high completion rate)`);
  }

  if (changes.length > 0) {
    plan.lastAdaptedAt = new Date();
    plan.adaptationHistory.push({
      reason: 'Progressive overload analysis',
      changes: changes.join('; '),
      date: new Date()
    });
  }

  return { plan, changes };
}

module.exports = {
  adaptForInjury,
  adaptForTime,
  adaptForEquipment,
  adaptDifficulty,
  smartReschedule,
  applyProgressiveOverload
};
