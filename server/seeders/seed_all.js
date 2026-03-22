/**
 * ================================================================
 * seeders/seed_all.js — MongoDB Database Seeder
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 *
 * HOW TO RUN:
 *   node seeders/seed_all.js
 *
 * WHAT IT DOES:
 *   - Clears all existing collections
 *   - Seeds Categories, Admin User, sample Workers & Employers
 *
 * CHANGED FROM POSTGRESQL VERSION:
 *   - No sequelize-cli bulkInsert
 *   - Uses Mongoose Model.insertMany() + Model.create()
 *   - ObjectIds instead of auto-increment integers
 *   - GeoJSON location fields added to Worker/Employer
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User         = require('../models/User');
const Worker       = require('../models/Worker');
const Employer     = require('../models/Employer');
const Category     = require('../models/Category');
const WorkerSkill  = require('../models/WorkerSkill');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamnaka_db';

// ── SEED DATA ─────────────────────────────────────────────────

const categories = [
  { nameEn: 'Construction',      nameMr: 'बांधकाम',         nameHi: 'निर्माण',       nameGu: 'બાંધકામ',       iconEmoji: '🏗️', sortOrder: 1 },
  { nameEn: 'Farming',           nameMr: 'शेती',             nameHi: 'खेती',          nameGu: 'ખેતી',          iconEmoji: '🌾', sortOrder: 2 },
  { nameEn: 'Plumbing',          nameMr: 'प्लंबिंग',          nameHi: 'प्लंबिंग',      nameGu: 'પ્લમ્બિંગ',      iconEmoji: '🔧', sortOrder: 3 },
  { nameEn: 'Electrical',        nameMr: 'विद्युत',           nameHi: 'बिजली',         nameGu: 'વિદ્યુત',        iconEmoji: '⚡', sortOrder: 4 },
  { nameEn: 'Painting',          nameMr: 'रंगकाम',           nameHi: 'पेंटिंग',        nameGu: 'પેઇન્ટિંગ',      iconEmoji: '🎨', sortOrder: 5 },
  { nameEn: 'Carpentry',         nameMr: 'सुतारकाम',         nameHi: 'बढ़ईगिरी',       nameGu: 'સુથારકામ',       iconEmoji: '🪚', sortOrder: 6 },
  { nameEn: 'Loading/Unloading', nameMr: 'माल वाहतूक',        nameHi: 'लोडिंग/अनलोडिंग', nameGu: 'લોડિંગ',       iconEmoji: '📦', sortOrder: 7 },
  { nameEn: 'Cleaning',          nameMr: 'साफसफाई',           nameHi: 'सफाई',          nameGu: 'સફાઈ',          iconEmoji: '🧹', sortOrder: 8 },
  { nameEn: 'Gardening',         nameMr: 'बागकाम',           nameHi: 'बागवानी',        nameGu: 'બાગકામ',        iconEmoji: '🌱', sortOrder: 9 },
  { nameEn: 'Security',          nameMr: 'सुरक्षा',           nameHi: 'सुरक्षा',        nameGu: 'સુરક્ષા',        iconEmoji: '🔒', sortOrder: 10 },
  { nameEn: 'Driving',           nameMr: 'वाहन चालवणे',        nameHi: 'ड्राइविंग',      nameGu: 'ડ્રાઇવિંગ',      iconEmoji: '🚗', sortOrder: 11 },
  { nameEn: 'Cooking/Catering',  nameMr: 'स्वयंपाक',          nameHi: 'खाना पकाना',    nameGu: 'રસોઈ',          iconEmoji: '🍳', sortOrder: 12 },
];

// ── MAIN SEED FUNCTION ────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected for seeding');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Worker.deleteMany({}),
    Employer.deleteMany({}),
    Category.deleteMany({}),
    WorkerSkill.deleteMany({}),
  ]);
  console.log('🗑️  All collections cleared');

  // ── Seed Categories ──────────────────────────────────────────
  // CHANGED: bulkInsert → insertMany
  const insertedCategories = await Category.insertMany(categories);
  console.log(`✅ ${insertedCategories.length} categories seeded`);

  const catMap = {};
  insertedCategories.forEach((c) => { catMap[c.nameEn] = c._id; });

  // ── Seed Admin User ───────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Admin',
    phone: '9999999999',
    email: 'admin@digitalkamnaka.in',
    password: await bcrypt.hash('Admin@1234', 12),
    role: 'admin',
    language: 'mr',
    isVerified: true,
    isActive: true,
  });
  console.log('✅ Admin user seeded (phone: 9999999999, pass: Admin@1234)');

  // ── Seed Sample Workers ───────────────────────────────────────
  const workerUsersData = [
    { name: 'Ramesh Patil', phone: '9876543210', language: 'mr' },
    { name: 'Suresh Jadhav', phone: '9876543211', language: 'hi' },
    { name: 'Vijay Shinde', phone: '9876543212', language: 'mr' },
  ];

  for (const userData of workerUsersData) {
    const user = await User.create({
      ...userData,
      password: await bcrypt.hash('Worker@123', 12),
      role: 'worker',
      isVerified: true,
      isActive: true,
    });

    const worker = await Worker.create({
      userId: user._id,
      dailyRate: 600 + Math.floor(Math.random() * 400),
      experienceYrs: Math.floor(Math.random() * 10),
      bio: 'Experienced worker from Maharashtra',
      isAvailable: true,
      isVerified: true,
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      latitude: 18.5204 + (Math.random() - 0.5) * 0.1,
      longitude: 73.8567 + (Math.random() - 0.5) * 0.1,
      // GeoJSON location field (ADDED — required for $near queries)
      location: {
        type: 'Point',
        coordinates: [73.8567 + (Math.random() - 0.5) * 0.1, 18.5204 + (Math.random() - 0.5) * 0.1],
      },
    });

    // Add a skill
    await WorkerSkill.create({
      workerId: worker._id,
      categoryId: catMap['Construction'],
      level: 'experienced',
      yearsInSkill: 3,
    });
  }
  console.log('✅ 3 sample workers seeded');

  // ── Seed Sample Employers ─────────────────────────────────────
  const employerUsersData = [
    { name: 'Sunil Builders', phone: '9765432100', language: 'mr' },
    { name: 'Ravi Farms', phone: '9765432101', language: 'hi' },
  ];

  for (const userData of employerUsersData) {
    const user = await User.create({
      ...userData,
      password: await bcrypt.hash('Employer@123', 12),
      role: 'employer',
      isVerified: true,
      isActive: true,
    });

    await Employer.create({
      userId: user._id,
      companyName: userData.name,
      employerType: 'contractor',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      latitude: 18.52,
      longitude: 73.85,
      location: { type: 'Point', coordinates: [73.85, 18.52] },
    });
  }
  console.log('✅ 2 sample employers seeded');

  console.log('\n🎉 Database seeding complete!');
  console.log('   Admin login — phone: 9999999999 | pass: Admin@1234');
  console.log('   Worker login — phone: 9876543210 | pass: Worker@123');
  console.log('   Employer login — phone: 9765432100 | pass: Employer@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
