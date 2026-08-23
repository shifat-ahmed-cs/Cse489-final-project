require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Exercise = require('../models/Exercise');
const Food = require('../models/Food');
const User = require('../models/User');

const exercisesData = require('./exercises.json');
const foodsData = require('./foods.json');

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Starting seed...\n');

    // Clear existing data
    await Exercise.deleteMany({});
    await Food.deleteMany({});
    console.log('Cleared existing exercises and foods.\n');

    // Seed exercises
    const exercises = await Exercise.insertMany(exercisesData);
    console.log(`✅ Seeded ${exercises.length} exercises`);

    // Seed foods
    const foods = await Food.insertMany(foodsData);
    console.log(`✅ Seeded ${foods.length} foods`);

    // Create admin account if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@bodypilot.com' });
    if (!adminExists) {
      await User.create({
        email: 'admin@bodypilot.com',
        password: 'admin123',
        name: 'BodyPilot Admin',
        role: 'admin',
        assessmentCompleted: true,
        onboardingCompleted: true,
        profile: {
          age: 30,
          gender: 'male',
          height: 180,
          weight: 80,
          fitnessLevel: 'advanced',
          goal: 'general_fitness',
          dailyActivityLevel: 'very_active',
          workoutDaysPerWeek: 5,
          preferredWorkoutDuration: 60,
          workoutLocation: 'gym'
        }
      });
      console.log('✅ Created admin account (admin@bodypilot.com / admin123)');
    }

    // Create demo user
    const demoExists = await User.findOne({ email: 'demo@bodypilot.com' });
    if (!demoExists) {
      await User.create({
        email: 'demo@bodypilot.com',
        password: 'demo123',
        name: 'Alex Demo',
        role: 'user',
        assessmentCompleted: true,
        onboardingCompleted: true,
        profile: {
          age: 25,
          gender: 'male',
          height: 175,
          weight: 75,
          fitnessLevel: 'beginner',
          goal: 'muscle_gain',
          targetWeight: 80,
          dailyActivityLevel: 'moderately_active',
          workoutDaysPerWeek: 4,
          preferredWorkoutDuration: 60,
          preferredWorkoutTime: 'morning',
          workoutLocation: 'gym',
          equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'squat_rack', 'pull_up_bar']
        },
        injuries: [{
          type: 'previous',
          area: 'knee',
          description: 'Minor knee discomfort from previous injury',
          severity: 'mild',
          restrictedExercises: [],
          restrictedMovements: []
        }],
        foodPreferences: {
          likedFoods: ['chicken', 'rice', 'eggs', 'pasta'],
          dislikedFoods: ['fish'],
          neverRecommend: [],
          allergies: [],
          dietaryRestrictions: [],
          cuisinePreferences: ['international', 'asian', 'italian'],
          mealsPerDay: 4,
          cookingAbility: 'intermediate',
          availableCookingTime: 30,
          budget: 'medium'
        }
      });
      console.log('✅ Created demo user (demo@bodypilot.com / demo123)');
    }

    // Create demo creator
    const creatorExists = await User.findOne({ email: 'creator@bodypilot.com' });
    if (!creatorExists) {
      const creatorUser = await User.create({
        email: 'creator@bodypilot.com',
        password: 'creator123',
        name: 'Fitness Pro',
        role: 'creator',
        assessmentCompleted: true,
        onboardingCompleted: true,
        profile: {
          age: 28,
          gender: 'male',
          height: 183,
          weight: 85,
          fitnessLevel: 'advanced',
          goal: 'muscle_gain',
          dailyActivityLevel: 'very_active',
          workoutDaysPerWeek: 6,
          preferredWorkoutDuration: 90,
          workoutLocation: 'gym'
        }
      });

      const Creator = require('../models/Creator');
      await Creator.create({
        userId: creatorUser._id,
        bio: 'Certified personal trainer with 5+ years of experience. Specializing in strength training and body recomposition.',
        expertise: ['strength training', 'muscle building', 'body recomposition'],
        certifications: ['NASM CPT', 'ACE Personal Trainer'],
        socialLinks: {
          instagram: 'fitnesspro',
          youtube: 'FitnessProChannel'
        },
        isVerified: true
      });
      console.log('✅ Created demo creator (creator@bodypilot.com / creator123)');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nAccounts:');
    console.log('  Admin:   admin@bodypilot.com   / admin123');
    console.log('  User:    demo@bodypilot.com    / demo123');
    console.log('  Creator: creator@bodypilot.com / creator123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
