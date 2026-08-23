/**
 * BodyPilot AI Assistant Engine
 * 
 * Rule-based conversational assistant that:
 * - Parses user messages using keyword/intent classification
 * - Routes to appropriate engine functions
 * - Returns contextual responses based on user's plans and profile
 */

const WorkoutPlan = require('../models/WorkoutPlan');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const { generateQuickWorkout } = require('./workoutGenerator');
const { findFoodSubstitute } = require('./nutritionAdapter');
const { adaptForInjury, adaptForTime, adaptDifficulty, smartReschedule } = require('./workoutAdapter');
const { generateDashboardSummary } = require('./progressAnalyzer');

// Intent patterns
const INTENTS = {
  INJURY: {
    patterns: ['hurt', 'injury', 'injured', 'pain', 'sore', 'can\'t do', 'cannot do', 'ache', 'strain', 'sprain'],
    bodyParts: ['knee', 'shoulder', 'back', 'lower back', 'wrist', 'ankle', 'hip', 'elbow', 'neck', 'arm', 'leg']
  },
  TIME_CHANGE: {
    patterns: ['only have', 'minutes today', 'short on time', 'quick workout', 'less time', 'more time', 'no time']
  },
  FOOD_REPLACE: {
    patterns: ['don\'t want', 'replace', 'substitute', 'swap', 'tired of eating', 'bored of', 'instead of', 'change meal', 'different food']
  },
  DIFFICULTY: {
    patterns: ['too easy', 'too hard', 'harder', 'easier', 'more challenging', 'less intense', 'more intense', 'increase difficulty', 'decrease difficulty']
  },
  MISSED_WORKOUT: {
    patterns: ['missed', 'skipped', 'couldn\'t make it', 'didn\'t work out', 'missed workout', 'skip today']
  },
  MEAL_QUESTION: {
    patterns: ['what should i eat', 'meal suggestion', 'dinner', 'lunch', 'breakfast', 'snack', 'hungry', 'food recommendation']
  },
  WORKOUT_QUESTION: {
    patterns: ['what workout', 'today\'s workout', 'exercise for', 'work out', 'what should i train', 'next workout']
  },
  PROGRESS: {
    patterns: ['progress', 'how am i doing', 'results', 'improvement', 'stats', 'streak']
  },
  EQUIPMENT: {
    patterns: ['no gym', 'home workout', 'no equipment', 'don\'t have', 'traveling', 'hotel']
  },
  GOAL_CHANGE: {
    patterns: ['change goal', 'new goal', 'want to lose', 'want to gain', 'change my goal', 'different goal']
  },
  TIRED: {
    patterns: ['tired', 'exhausted', 'fatigue', 'no energy', 'low energy', 'rest day', 'need rest']
  },
  GREETING: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'what\'s up']
  },
  HELP: {
    patterns: ['help', 'what can you do', 'features', 'how to', 'guide']
  }
};

/**
 * Classify intent from user message
 */
function classifyIntent(message) {
  const lower = message.toLowerCase();

  for (const [intent, config] of Object.entries(INTENTS)) {
    for (const pattern of config.patterns) {
      if (lower.includes(pattern)) {
        return intent;
      }
    }
  }

  return 'UNKNOWN';
}

/**
 * Extract time value from message
 */
function extractTime(message) {
  const match = message.match(/(\d+)\s*min/i);
  if (match) return parseInt(match[1]);

  const hourMatch = message.match(/(\d+)\s*hour/i);
  if (hourMatch) return parseInt(hourMatch[1]) * 60;

  // Try just a number
  const numMatch = message.match(/only\s+have\s+(\d+)/i) || message.match(/(\d+)\s*minutes/i);
  if (numMatch) return parseInt(numMatch[1]);

  return null;
}

/**
 * Extract body part from message
 */
function extractBodyPart(message) {
  const lower = message.toLowerCase();
  for (const part of INTENTS.INJURY.bodyParts) {
    if (lower.includes(part)) return part;
  }
  return null;
}

/**
 * Extract food name from message
 */
function extractFoodName(message) {
  const lower = message.toLowerCase();
  // Common food keywords
  const foods = ['chicken', 'rice', 'fish', 'beef', 'eggs', 'oats', 'milk', 'bread',
    'pasta', 'potato', 'broccoli', 'salad', 'yogurt', 'cheese', 'tofu', 'lentils',
    'salmon', 'tuna', 'turkey', 'pork', 'shrimp'];

  for (const food of foods) {
    if (lower.includes(food)) return food;
  }
  return null;
}

/**
 * Process a message and generate response
 */
async function processMessage(userId, message) {
  const intent = classifyIntent(message);
  const user = await User.findById(userId);

  if (!user) {
    return { response: "I couldn't find your profile. Please make sure you're logged in.", intent };
  }

  switch (intent) {
    case 'GREETING':
      return {
        response: `Hey ${user.name}! 👋 I'm your BodyPilot assistant. I can help you with your workouts, meals, injuries, progress, and more. What would you like to do today?`,
        intent
      };

    case 'HELP':
      return {
        response: `Here's what I can help you with:\n\n` +
          `🏋️ **Workouts**: "What's today's workout?", "I only have 20 minutes"\n` +
          `🍽️ **Meals**: "What should I eat for dinner?", "Replace the chicken"\n` +
          `🤕 **Injuries**: "My knee hurts", "I can't do squats"\n` +
          `💪 **Difficulty**: "Make it harder", "Workouts are too easy"\n` +
          `📊 **Progress**: "How am I doing?", "Show my stats"\n` +
          `😴 **Recovery**: "I'm tired today", "Need a rest day"\n` +
          `🔄 **Changes**: "I missed yesterday", "Change my goal"\n\n` +
          `Just tell me what you need!`,
        intent
      };

    case 'INJURY': {
      const bodyPart = extractBodyPart(message);
      if (bodyPart) {
        const plan = await WorkoutPlan.findOne({ userId, isActive: true });
        if (plan) {
          const result = await adaptForInjury(plan, user, bodyPart);
          await plan.save();
          return {
            response: `I've adapted your workout plan for your ${bodyPart} injury:\n\n` +
              result.changes.map(c => `• ${c}`).join('\n') +
              `\n\nYour plan has been updated. Take care of yourself! 💪`,
            intent,
            action: 'plan_updated',
            changes: result.changes
          };
        }
        return {
          response: `I understand your ${bodyPart} is bothering you. Let me generate a new workout plan that avoids ${bodyPart}-related exercises. Would you like me to do that?`,
          intent
        };
      }
      return {
        response: `I'm sorry to hear you're in pain. Which body part is affected? (e.g., knee, shoulder, back, wrist, etc.)`,
        intent
      };
    }

    case 'TIME_CHANGE': {
      const minutes = extractTime(message);
      if (minutes) {
        const quickWorkout = await generateQuickWorkout(user, minutes);
        return {
          response: `Here's your ${minutes}-minute quick workout:\n\n` +
            `**${quickWorkout.title}**\n` +
            quickWorkout.exercises.map((ex, i) =>
              `${i + 1}. ${ex.exerciseName} - ${ex.sets} sets × ${ex.reps}`
            ).join('\n') +
            `\n\nLet's make every minute count! 🔥`,
          intent,
          workout: quickWorkout
        };
      }
      return {
        response: `How many minutes do you have? I'll create a quick workout that fits your schedule.`,
        intent
      };
    }

    case 'FOOD_REPLACE': {
      const foodName = extractFoodName(message);
      if (foodName) {
        return {
          response: `I'll find alternatives for ${foodName}. Go to your meal plan and tap on "${foodName}" to see substitution options that match your nutritional targets. The system will automatically recalculate your macros!`,
          intent,
          action: 'food_substitute',
          foodName
        };
      }
      return {
        response: `Which food would you like to replace? Just tell me the name (e.g., "replace the chicken" or "I don't want rice today").`,
        intent
      };
    }

    case 'DIFFICULTY': {
      const plan = await WorkoutPlan.findOne({ userId, isActive: true });
      if (plan) {
        const direction = message.toLowerCase().includes('easier') || message.toLowerCase().includes('too hard')
          ? 'easier' : 'harder';
        const result = adaptDifficulty(plan, direction);
        await plan.save();
        return {
          response: `Done! I've made your workouts ${direction}:\n\n` +
            result.changes.map(c => `• ${c}`).join('\n') +
            `\n\n${direction === 'harder' ? 'Let\'s push harder! 💪' : 'Remember, progress takes time. Keep going! 🌟'}`,
          intent,
          action: 'difficulty_adjusted'
        };
      }
      return {
        response: `You don't have an active workout plan yet. Would you like me to generate one?`,
        intent
      };
    }

    case 'MISSED_WORKOUT': {
      const plan = await WorkoutPlan.findOne({ userId, isActive: true });
      if (plan) {
        const today = new Date().getDay();
        const yesterday = today === 0 ? 6 : today - 1;
        const result = smartReschedule(plan, yesterday);
        await plan.save();
        return {
          response: `No worries! I've rearranged your schedule:\n\n` +
            result.changes.map(c => `• ${c}`).join('\n') +
            `\n\nMissing one day isn't the end of the world. Let's get back on track! 🔄`,
          intent,
          action: 'rescheduled'
        };
      }
      return {
        response: `Don't worry about missing a workout! Would you like me to help you plan the rest of your week?`,
        intent
      };
    }

    case 'MEAL_QUESTION': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const mealPlan = await MealPlan.findOne({ userId, date: today });

      if (mealPlan) {
        const hour = new Date().getHours();
        let mealType = 'dinner';
        if (hour < 10) mealType = 'breakfast';
        else if (hour < 14) mealType = 'lunch';
        else if (hour < 17) mealType = 'afternoon_snack';

        const meal = mealPlan.meals.find(m => m.mealType === mealType) || mealPlan.meals[0];
        if (meal) {
          return {
            response: `For ${mealType.replace('_', ' ')}, here's your plan:\n\n` +
              meal.foods.map(f => `• ${f.foodName} (${f.servingSize}${f.servingUnit}) - ${f.calories} cal, ${f.protein}g protein`).join('\n') +
              `\n\n**Total**: ${meal.totalCalories} cal | ${meal.totalProtein}g protein | ${meal.totalCarbs}g carbs | ${meal.totalFat}g fat\n\n` +
              `Don't like something? Just ask me to replace it! 🍽️`,
            intent
          };
        }
      }
      return {
        response: `You don't have a meal plan for today yet. Go to the Nutrition tab to generate one based on your preferences!`,
        intent
      };
    }

    case 'WORKOUT_QUESTION': {
      const plan = await WorkoutPlan.findOne({ userId, isActive: true });
      if (plan) {
        const today = new Date().getDay();
        const todayWorkout = plan.schedule.find(d => d.dayOfWeek === today);
        if (todayWorkout && !todayWorkout.isRestDay) {
          return {
            response: `Today's workout: **${todayWorkout.title}** (${todayWorkout.duration} min)\n\n` +
              todayWorkout.exercises.map((ex, i) =>
                `${i + 1}. ${ex.exerciseName} - ${ex.sets} sets × ${ex.reps} (${ex.restPeriod}s rest)`
              ).join('\n') +
              `\n\nReady to crush it? 💪 Head to the Workout tab to start tracking!`,
            intent
          };
        } else {
          return {
            response: `Today is a rest day! 😴 Your body needs time to recover and grow. Enjoy your day off, or do some light stretching/mobility work.`,
            intent
          };
        }
      }
      return {
        response: `You don't have a workout plan yet. Would you like me to generate a personalized one? Head to the Workout tab!`,
        intent
      };
    }

    case 'PROGRESS': {
      try {
        const summary = await generateDashboardSummary(userId);
        let response = `Here's your progress summary:\n\n`;

        if (summary.weight.trend !== 'insufficient_data') {
          response += `⚖️ **Weight**: ${summary.weight.message}\n\n`;
        }

        response += `🏋️ **Workouts**: ${summary.workout.message}\n\n`;

        if (summary.goals.length > 0) {
          response += `🎯 **Goals**:\n` +
            summary.goals.map(g => `• ${g.title}: ${g.progress}% (${g.status})`).join('\n');
        }

        if (summary.plateaus.length > 0) {
          response += `\n\n⚠️ **Attention**:\n` +
            summary.plateaus.map(p => `• ${p.message}`).join('\n');
        }

        return { response, intent };
      } catch (err) {
        return {
          response: `Keep logging your workouts and weight to see detailed progress analytics! Every entry helps me understand your journey better. 📊`,
          intent
        };
      }
    }

    case 'EQUIPMENT':
      return {
        response: `No problem! I can adjust your workouts for your current situation:\n\n` +
          `• **No equipment**: Bodyweight exercises (push-ups, squats, lunges, planks)\n` +
          `• **Hotel/Travel**: Quick bodyweight circuits\n` +
          `• **Home gym**: Dumbbell and resistance band workouts\n\n` +
          `Go to Settings → Equipment to update what you have access to, and I'll regenerate your plan!`,
        intent
      };

    case 'GOAL_CHANGE':
      return {
        response: `You can update your fitness goal anytime! Go to Settings → Fitness Profile → Goal and choose from:\n\n` +
          `• Weight Loss\n• Muscle Gain\n• Strength\n• Endurance\n• General Fitness\n• Body Recomposition\n• Flexibility/Mobility\n\n` +
          `Once you update it, your workout and meal plans will be recalculated automatically! 🎯`,
        intent
      };

    case 'TIRED':
      return {
        response: `It sounds like your body needs some recovery! Here are your options:\n\n` +
          `😴 **Take a rest day** — Recovery is when your muscles actually grow!\n` +
          `🧘 **Light mobility work** — 15-20 min of stretching and foam rolling\n` +
          `🚶 **Active recovery** — A gentle walk or easy yoga session\n\n` +
          `Listen to your body. Overtraining is counterproductive. You can use the "Adapt My Plan" feature to reschedule today's workout.`,
        intent
      };

    default:
      return {
        response: `I'm not sure I understood that. Here are some things I can help with:\n\n` +
          `• "What's today's workout?"\n` +
          `• "I only have 20 minutes today"\n` +
          `• "My knee hurts"\n` +
          `• "Replace the chicken in my meal"\n` +
          `• "How am I doing?"\n` +
          `• "I'm too tired today"\n` +
          `• "Make my workouts harder"\n\n` +
          `Try asking me something specific! 😊`,
        intent: 'UNKNOWN'
      };
  }
}

/**
 * Get contextual suggestions based on current time and user state
 */
async function getContextualSuggestions(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const suggestions = [];
  const hour = new Date().getHours();

  // Time-based suggestions
  if (hour >= 6 && hour < 10) {
    suggestions.push({ text: "What's for breakfast?", icon: "🍳" });
    suggestions.push({ text: "Start today's workout", icon: "🏋️" });
  } else if (hour >= 11 && hour < 14) {
    suggestions.push({ text: "What's for lunch?", icon: "🥗" });
    suggestions.push({ text: "Log my water intake", icon: "💧" });
  } else if (hour >= 17 && hour < 20) {
    suggestions.push({ text: "What's for dinner?", icon: "🍽️" });
    if (!user.lastWorkoutDate || new Date() - user.lastWorkoutDate > 86400000) {
      suggestions.push({ text: "Start today's workout", icon: "🏋️" });
    }
  } else if (hour >= 20) {
    suggestions.push({ text: "How did today go?", icon: "📊" });
    suggestions.push({ text: "Log my weight", icon: "⚖️" });
  }

  // Always available
  suggestions.push({ text: "Show my progress", icon: "📈" });
  suggestions.push({ text: "Adapt my plan", icon: "🔄" });

  return suggestions;
}

module.exports = {
  processMessage,
  getContextualSuggestions,
  classifyIntent
};
