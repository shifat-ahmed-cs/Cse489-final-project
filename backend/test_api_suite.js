/**
 * BodyPilot Comprehensive End-to-End API Test Suite
 * Validates all 14 feature modules and adaptive intelligence engines
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const connectDB = require('./config/db');
const Exercise = require('./models/Exercise');
const Food = require('./models/Food');
const exercisesData = require('./data/exercises.json');
const foodsData = require('./data/foods.json');

// Import routes
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

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'online' }));
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

let server;
let port = 5055;
let userToken = '';
let adminToken = '';
let userId = '';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('🧪 ===============================================');
  console.log('🚀 STARTING BODYPILOT FULL SYSTEM API TEST SUITE');
  console.log('=================================================\n');

  await connectDB();

  // Populate seed items for tests
  await Exercise.deleteMany({});
  await Food.deleteMany({});
  await Exercise.insertMany(exercisesData);
  await Food.insertMany(foodsData);
  console.log(`📦 Database initialized with ${exercisesData.length} exercises and ${foodsData.length} foods.\n`);

  server = app.listen(port);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${e.message}\n`);
      failed++;
    }
  }

  // 1. Health Check
  await test('1. Health check endpoint', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200 || res.body.status !== 'online') throw new Error('Health check failed');
  });

  // 2. Auth: Register
  await test('2. User Registration', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'Test Runner',
      email: 'testrunner@bodypilot.com',
      password: 'password123',
      phone: '123456789'
    });
    if (res.status !== 201 || !res.body.token) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
    userToken = res.body.token;
    userId = res.body._id;
  });

  // 3. Auth: Admin Register & Login
  await test('3. Admin Registration & Login', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'System Admin',
      email: 'admin_test@bodypilot.com',
      password: 'adminpassword123'
    });
    const User = require('./models/User');
    await User.findByIdAndUpdate(res.body._id, { role: 'admin' });

    const loginRes = await request('POST', '/auth/login', {
      email: 'admin_test@bodypilot.com',
      password: 'adminpassword123'
    });
    if (loginRes.status !== 200 || loginRes.body.role !== 'admin') throw new Error('Admin auth failed');
    adminToken = loginRes.body.token;
  });

  // 4. User Assessment
  await test('4. Submit Personalized Assessment', async () => {
    const res = await request('POST', '/users/assessment', {
      profile: {
        age: 26,
        gender: 'male',
        height: 178,
        weight: 76,
        fitnessLevel: 'intermediate',
        goal: 'muscle_gain',
        workoutDaysPerWeek: 4,
        preferredWorkoutDuration: 45,
        workoutLocation: 'gym',
        equipment: ['barbell', 'dumbbell', 'cable', 'bench']
      },
      injuries: [{ area: 'knee', description: 'Mild discomfort' }],
      foodPreferences: {
        likedFoods: ['chicken', 'rice', 'eggs'],
        dislikedFoods: ['fish'],
        allergies: [],
        mealsPerDay: 3
      }
    }, userToken);
    if (res.status !== 200) throw new Error(`Assessment failed: ${JSON.stringify(res.body)}`);
  });

  // 5. Workout Plan Generation
  await test('5. Generate Personalized Workout Plan', async () => {
    const res = await request('POST', '/workouts/generate', {}, userToken);
    if (res.status !== 201 || !res.body.plan) throw new Error(`Workout plan generation failed: ${JSON.stringify(res.body)}`);
    if (res.body.plan.schedule.length !== 7) throw new Error('Workout schedule should have 7 days');
  });

  // 6. Workout Adaptation: Injury
  await test('6. Adapt Plan for Knee Injury (Exercise replacement)', async () => {
    const res = await request('POST', '/workouts/adapt', {
      action: 'injury',
      injuryArea: 'knee'
    }, userToken);
    if (res.status !== 200 || !res.body.changes) throw new Error('Injury adaptation failed');
  });

  // 7. Workout Adaptation: Time Compression
  await test('7. Adapt Plan for Short Time (20-min session)', async () => {
    const res = await request('POST', '/workouts/adapt', {
      action: 'time',
      availableMinutes: 20,
      dayOfWeek: 1
    }, userToken);
    if (res.status !== 200) throw new Error('Time adaptation failed');
  });

  // 8. Workout Adaptation: Difficulty Increase
  await test('8. Adapt Plan Difficulty (Make Harder)', async () => {
    const res = await request('POST', '/workouts/adapt', {
      action: 'difficulty',
      direction: 'harder'
    }, userToken);
    if (res.status !== 200) throw new Error('Difficulty adaptation failed');
  });

  // 9. Workout Logging
  await test('9. Log Completed Workout & Update Streak', async () => {
    const res = await request('POST', '/workouts/log', {
      dayTitle: 'Upper Body Push',
      workoutType: 'strength',
      duration: 45,
      completionPercentage: 100,
      totalVolume: 3200,
      feedback: { overallDifficulty: 'moderate', notes: 'Felt strong!' }
    }, userToken);
    if (res.status !== 201 || res.body.streak !== 1) throw new Error('Workout logging failed');
  });

  // 10. Exercise Library Query & Search
  await test('10. Query Exercise Library with Category Filter', async () => {
    const res = await request('GET', '/exercises?category=chest', null, userToken);
    if (res.status !== 200 || !res.body.exercises || res.body.exercises.length === 0) throw new Error('Exercise library query failed');
  });

  // 11. Nutrition Plan Generation
  await test('11. Generate Custom Meal Plan & Targets', async () => {
    const res = await request('POST', '/nutrition/generate', {}, userToken);
    if (res.status !== 201 || !res.body.plan) throw new Error('Nutrition plan generation failed');
    if (res.body.plan.dailyTargets.calories <= 0) throw new Error('Daily caloric targets missing');
  });

  // 12. Smart Food Substitution
  await test('12. Query and Apply Food Substitutions', async () => {
    const planRes = await request('GET', '/nutrition/plan', null, userToken);
    const plan = planRes.body;
    const firstMeal = plan.meals[0];
    const firstFood = firstMeal.foods[0];

    const subOptions = await request('POST', '/nutrition/substitute-options', {
      foodId: firstFood.foodId || firstFood._id
    }, userToken);
    if (subOptions.status !== 200) throw new Error('Substitute options failed');

    // Substitute with another food
    const allFoods = await request('GET', '/foods?category=protein', null, userToken);
    const altFood = allFoods.body.foods[1];

    const subRes = await request('POST', '/nutrition/substitute', {
      mealPlanId: plan._id,
      mealType: firstMeal.mealType,
      oldFoodId: firstFood.foodId || firstFood._id,
      newFoodId: altFood._id
    }, userToken);
    if (subRes.status !== 200) throw new Error('Food substitution execution failed');
  });

  // 13. Auto-Generated Grocery Shopping List
  await test('13. Retrieve Auto-Generated Shopping List', async () => {
    const res = await request('GET', '/recipes/shopping-list', null, userToken);
    if (res.status !== 200 || !res.body.shoppingList) throw new Error('Shopping list generation failed');
  });

  // 14. Progress Logging & Dashboard Analytics
  await test('14. Log Weight and Fetch Analytical Dashboard', async () => {
    await request('POST', '/progress', { weight: 75.4, bodyFatPercentage: 14.5 }, userToken);
    const dash = await request('GET', '/progress/dashboard', null, userToken);
    if (dash.status !== 200 || !dash.body.workout) throw new Error('Dashboard analytics failed');
  });

  // 15. Goals & Milestone Evaluation
  await test('15. Create Milestone Goal', async () => {
    const res = await request('POST', '/goals', {
      title: 'Bench Press 100kg',
      type: 'strength',
      target: 100,
      current: 85,
      unit: 'kg'
    }, userToken);
    if (res.status !== 201 || res.body.target !== 100) throw new Error('Goal creation failed');
  });

  // 16. AI Assistant Conversational Engine
  await test('16. AI Fitness Coach Intent Routing', async () => {
    const chat1 = await request('POST', '/assistant/chat', { message: 'My shoulder hurts during pressing' }, userToken);
    if (chat1.status !== 200 || chat1.body.intent !== 'INJURY') throw new Error('Assistant injury intent failed');

    const chat2 = await request('POST', '/assistant/chat', { message: 'I only have 20 minutes today' }, userToken);
    if (chat2.status !== 200 || chat2.body.intent !== 'TIME_CHANGE') throw new Error('Assistant time intent failed');

    const chat3 = await request('POST', '/assistant/chat', { message: 'What is today\'s workout?' }, userToken);
    if (chat3.status !== 200) throw new Error('Assistant workout query failed');

    const suggestions = await request('GET', '/assistant/suggestions', null, userToken);
    if (suggestions.status !== 200 || suggestions.body.length === 0) throw new Error('Assistant suggestions failed');
  });

  // 17. Creator Platform
  await test('17. Creator Program Registration & 1-Tap Follow', async () => {
    const regCreator = await request('POST', '/creators/register', {
      bio: 'Master strength coach',
      expertise: ['Hypertrophy', 'Powerlifting']
    }, userToken);

    const progRes = await request('POST', '/creators/programs', {
      title: 'Power Hypertrophy 4-Week',
      description: 'Intense strength building',
      duration: 4,
      difficulty: 'intermediate',
      category: 'muscle_gain',
      schedule: [
        { dayNumber: 1, title: 'Upper Heavy', duration: 45, workoutType: 'upper', exercises: [] }
      ]
    }, userToken);

    const browse = await request('GET', '/creators/programs/browse');
    if (browse.status !== 200 || browse.body.programs.length === 0) throw new Error('Program browse failed');

    const followRes = await request('POST', `/creators/programs/${progRes.body.program._id}/follow`, {}, userToken);
    if (followRes.status !== 200 || !followRes.body.plan) throw new Error('1-Tap follow program failed');
  });

  // 18. Community Feed, Posts & Challenges
  await test('18. Community Social Feed & Post Creation', async () => {
    const postRes = await request('POST', '/community/posts', {
      content: 'Crushed my workout today with BodyPilot! +5kg on Squats!',
      type: 'achievement'
    }, userToken);
    if (postRes.status !== 201) throw new Error('Post creation failed');

    const likeRes = await request('POST', `/community/posts/${postRes.body._id}/like`, {}, userToken);
    if (likeRes.status !== 200 || likeRes.body.likeCount !== 1) throw new Error('Post like failed');

    const feed = await request('GET', '/community/feed');
    if (feed.status !== 200 || feed.body.posts.length === 0) throw new Error('Feed retrieval failed');
  });

  // 19. Admin Analytics
  await test('19. Admin Platform Analytics', async () => {
    const res = await request('GET', '/admin/analytics', null, adminToken);
    if (res.status !== 200 || !res.body.overview || res.body.overview.totalExercises === 0) throw new Error('Admin analytics failed');
  });

  console.log('\n=================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================\n');

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
