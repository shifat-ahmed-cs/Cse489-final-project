/**
 * BodyPilot Workout Generator Engine
 * 
 * Rule-based engine that generates personalized workout plans based on:
 * - User goal, fitness level, available days
 * - Equipment availability, workout location
 * - Injuries and limitations
 * - Exercise preferences
 */

const Exercise = require('../models/Exercise');

// Workout split templates based on available days
const SPLIT_TEMPLATES = {
  2: {
    name: 'upper_lower',
    days: [
      { workoutType: 'upper_body', title: 'Upper Body', muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { workoutType: 'lower_body', title: 'Lower Body', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'core'] }
    ]
  },
  3: {
    name: 'push_pull_legs',
    days: [
      { workoutType: 'push', title: 'Push (Chest, Shoulders, Triceps)', muscleGroups: ['chest', 'shoulders', 'triceps'] },
      { workoutType: 'pull', title: 'Pull (Back, Biceps)', muscleGroups: ['back', 'biceps', 'forearms'] },
      { workoutType: 'legs', title: 'Legs & Core', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'core'] }
    ]
  },
  4: {
    name: 'upper_lower',
    days: [
      { workoutType: 'upper_body', title: 'Upper Body - Push Focus', muscleGroups: ['chest', 'shoulders', 'triceps'] },
      { workoutType: 'lower_body', title: 'Lower Body - Quad Focus', muscleGroups: ['quadriceps', 'glutes', 'calves', 'core'] },
      { workoutType: 'upper_body', title: 'Upper Body - Pull Focus', muscleGroups: ['back', 'biceps', 'forearms'] },
      { workoutType: 'lower_body', title: 'Lower Body - Hamstring Focus', muscleGroups: ['hamstrings', 'glutes', 'calves', 'core'] }
    ]
  },
  5: {
    name: 'bro_split',
    days: [
      { workoutType: 'chest_triceps', title: 'Chest & Triceps', muscleGroups: ['chest', 'triceps'] },
      { workoutType: 'back_biceps', title: 'Back & Biceps', muscleGroups: ['back', 'biceps'] },
      { workoutType: 'legs', title: 'Legs', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
      { workoutType: 'shoulders_arms', title: 'Shoulders & Arms', muscleGroups: ['shoulders', 'biceps', 'triceps'] },
      { workoutType: 'full_body', title: 'Full Body & Core', muscleGroups: ['chest', 'back', 'core', 'glutes'] }
    ]
  },
  6: {
    name: 'push_pull_legs',
    days: [
      { workoutType: 'push', title: 'Push Day 1', muscleGroups: ['chest', 'shoulders', 'triceps'] },
      { workoutType: 'pull', title: 'Pull Day 1', muscleGroups: ['back', 'biceps', 'forearms'] },
      { workoutType: 'legs', title: 'Leg Day 1', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
      { workoutType: 'push', title: 'Push Day 2', muscleGroups: ['chest', 'shoulders', 'triceps'] },
      { workoutType: 'pull', title: 'Pull Day 2', muscleGroups: ['back', 'biceps', 'forearms'] },
      { workoutType: 'legs', title: 'Leg Day 2', muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'core'] }
    ]
  }
};

// Exercise count based on fitness level and duration
const EXERCISE_COUNTS = {
  beginner: { short: 4, medium: 5, long: 6 },
  intermediate: { short: 5, medium: 6, long: 7 },
  advanced: { short: 6, medium: 7, long: 8 }
};

// Sets/reps based on goal
const GOAL_PARAMS = {
  weight_loss: { sets: 3, reps: '12-15', rest: 45, intensity: 'moderate' },
  muscle_gain: { sets: 4, reps: '8-12', rest: 90, intensity: 'high' },
  strength: { sets: 5, reps: '3-6', rest: 180, intensity: 'very_high' },
  endurance: { sets: 3, reps: '15-20', rest: 30, intensity: 'moderate' },
  general_fitness: { sets: 3, reps: '10-12', rest: 60, intensity: 'moderate' },
  body_recomposition: { sets: 4, reps: '8-12', rest: 75, intensity: 'high' },
  flexibility: { sets: 2, reps: '30 sec hold', rest: 30, intensity: 'low' }
};

// Day scheduling - which days of the week to assign workouts
const DAY_SCHEDULES = {
  2: [1, 4],           // Mon, Thu
  3: [1, 3, 5],        // Mon, Wed, Fri
  4: [1, 2, 4, 5],     // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],  // Mon-Fri
  6: [1, 2, 3, 4, 5, 6] // Mon-Sat
};

function getDurationCategory(minutes) {
  if (minutes <= 30) return 'short';
  if (minutes <= 50) return 'medium';
  return 'long';
}

/**
 * Filter exercises based on user restrictions
 */
function filterExercisesForUser(exercises, user) {
  let filtered = [...exercises];

  // Filter by equipment
  if (user.profile.equipment && user.profile.equipment.length > 0) {
    const userEquipment = [...user.profile.equipment, 'none'];
    filtered = filtered.filter(ex =>
      ex.equipment.length === 0 ||
      ex.equipment.some(eq => userEquipment.includes(eq))
    );
  }

  // Filter by workout location
  if (user.profile.workoutLocation === 'home') {
    const homeEquipment = ['none', 'dumbbell', 'resistance_band', 'pull_up_bar', 'yoga_mat', 'kettlebell', 'jump_rope', 'bench', 'box'];
    filtered = filtered.filter(ex =>
      ex.equipment.length === 0 ||
      ex.equipment.some(eq => homeEquipment.includes(eq))
    );
  }

  // Filter by difficulty
  const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
  const userLevel = difficultyOrder[user.profile.fitnessLevel] || 1;
  filtered = filtered.filter(ex => {
    const exLevel = difficultyOrder[ex.difficulty] || 1;
    return exLevel <= userLevel + 1; // Allow one level above
  });

  // Filter out exercises restricted by injuries
  if (user.injuries && user.injuries.length > 0) {
    const restrictedExercises = user.injuries.flatMap(i => i.restrictedExercises || []);
    const restrictedMovements = user.injuries.flatMap(i => i.restrictedMovements || []);

    filtered = filtered.filter(ex => {
      const nameMatch = restrictedExercises.some(re =>
        ex.name.toLowerCase().includes(re.toLowerCase())
      );
      const movementMatch = restrictedMovements.some(rm =>
        ex.tags.some(t => t.toLowerCase().includes(rm.toLowerCase())) ||
        ex.name.toLowerCase().includes(rm.toLowerCase())
      );
      return !nameMatch && !movementMatch;
    });
  }

  // Filter out disliked exercises
  if (user.profile.dislikedExercises && user.profile.dislikedExercises.length > 0) {
    filtered = filtered.filter(ex =>
      !user.profile.dislikedExercises.some(de =>
        ex.name.toLowerCase().includes(de.toLowerCase())
      )
    );
  }

  return filtered;
}

/**
 * Select exercises for a muscle group
 */
function selectExercises(availableExercises, muscleGroups, count, goal) {
  const goalParams = GOAL_PARAMS[goal] || GOAL_PARAMS.general_fitness;
  const selected = [];
  const usedIds = new Set();

  for (const muscleGroup of muscleGroups) {
    const muscleExercises = availableExercises.filter(ex =>
      ex.muscleGroups.includes(muscleGroup) && !usedIds.has(ex._id.toString())
    );

    if (muscleExercises.length > 0) {
      // Prefer compound exercises first
      const compounds = muscleExercises.filter(ex => ex.movementType === 'compound');
      const isolations = muscleExercises.filter(ex => ex.movementType !== 'compound');

      const ordered = [...compounds, ...isolations];
      const exercisesToAdd = ordered.slice(0, Math.max(1, Math.ceil(count / muscleGroups.length)));

      for (const ex of exercisesToAdd) {
        if (selected.length < count && !usedIds.has(ex._id.toString())) {
          selected.push({
            exerciseId: ex._id,
            exerciseName: ex.name,
            sets: goalParams.sets,
            reps: goalParams.reps,
            weight: 0,
            restPeriod: goalParams.rest,
            duration: 0,
            notes: '',
            order: selected.length
          });
          usedIds.add(ex._id.toString());
        }
      }
    }
  }

  // If we haven't filled the count, add more exercises from available pool
  while (selected.length < count) {
    const remaining = availableExercises.filter(ex =>
      !usedIds.has(ex._id.toString()) &&
      muscleGroups.some(mg => ex.muscleGroups.includes(mg))
    );
    if (remaining.length === 0) break;
    const ex = remaining[0];
    selected.push({
      exerciseId: ex._id,
      exerciseName: ex.name,
      sets: goalParams.sets,
      reps: goalParams.reps,
      weight: 0,
      restPeriod: goalParams.rest,
      duration: 0,
      notes: '',
      order: selected.length
    });
    usedIds.add(ex._id.toString());
  }

  return selected;
}

/**
 * Generate a personalized workout plan
 */
async function generateWorkoutPlan(user) {
  const daysPerWeek = user.profile.workoutDaysPerWeek || 3;
  const duration = user.profile.preferredWorkoutDuration || 45;
  const goal = user.profile.goal || 'general_fitness';
  const fitnessLevel = user.profile.fitnessLevel || 'intermediate';

  // Get split template
  const clampedDays = Math.min(Math.max(daysPerWeek, 2), 6);
  const template = SPLIT_TEMPLATES[clampedDays];

  // Fetch all exercises from database
  const allExercises = await Exercise.find({ isActive: true });

  // Filter exercises for this user
  const availableExercises = filterExercisesForUser(allExercises, user);

  // Determine exercise count per session
  const durationCat = getDurationCategory(duration);
  const exerciseCount = EXERCISE_COUNTS[fitnessLevel]?.[durationCat] || 5;

  // Get day schedule
  const daySchedule = DAY_SCHEDULES[clampedDays] || [1, 3, 5];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Build schedule
  const schedule = [];

  for (let d = 0; d < 7; d++) {
    const workoutIndex = daySchedule.indexOf(d);
    if (workoutIndex !== -1 && workoutIndex < template.days.length) {
      const templateDay = template.days[workoutIndex];
      const exercises = selectExercises(availableExercises, templateDay.muscleGroups, exerciseCount, goal);

      schedule.push({
        dayOfWeek: d,
        dayName: dayNames[d],
        workoutType: templateDay.workoutType,
        title: templateDay.title,
        duration: duration,
        exercises: exercises,
        isRestDay: false,
        intensity: GOAL_PARAMS[goal]?.intensity || 'moderate'
      });
    } else {
      schedule.push({
        dayOfWeek: d,
        dayName: dayNames[d],
        workoutType: 'rest',
        title: 'Rest Day',
        duration: 0,
        exercises: [],
        isRestDay: true,
        intensity: 'low'
      });
    }
  }

  return {
    name: `${goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Plan`,
    description: `Personalized ${template.name.replace(/_/g, '/')} split for ${goal.replace(/_/g, ' ')}`,
    schedule,
    goal,
    fitnessLevel,
    splitType: template.name,
    weekNumber: 1,
    isActive: true,
    generatedAt: new Date(),
    sourceType: 'generated'
  };
}

/**
 * Generate a quick/shortened workout
 */
async function generateQuickWorkout(user, availableMinutes) {
  const goal = user.profile.goal || 'general_fitness';
  const fitnessLevel = user.profile.fitnessLevel || 'intermediate';

  const allExercises = await Exercise.find({ isActive: true });
  const available = filterExercisesForUser(allExercises, user);

  // For quick workouts, prefer compound full-body exercises
  const compounds = available.filter(ex => ex.movementType === 'compound');
  const exerciseCount = Math.max(3, Math.floor(availableMinutes / 8));

  const exercises = selectExercises(
    compounds.length >= exerciseCount ? compounds : available,
    ['chest', 'back', 'quadriceps', 'shoulders', 'core'],
    exerciseCount,
    goal
  );

  // Reduce sets for time
  exercises.forEach(ex => {
    ex.sets = Math.max(2, ex.sets - 1);
    ex.restPeriod = Math.max(30, ex.restPeriod - 15);
  });

  return {
    title: `Quick ${availableMinutes}-min Workout`,
    workoutType: 'full_body',
    duration: availableMinutes,
    exercises,
    isRestDay: false,
    intensity: 'moderate'
  };
}

module.exports = {
  generateWorkoutPlan,
  generateQuickWorkout,
  filterExercisesForUser,
  GOAL_PARAMS,
  SPLIT_TEMPLATES
};
