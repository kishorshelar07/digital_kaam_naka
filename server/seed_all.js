/**
 * seeders/seed_all.js — Full MongoDB Database Seeder
 * 20+ entries per collection
 * HOW TO RUN: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User         = require('../models/User');
const Worker       = require('../models/Worker');
const Employer     = require('../models/Employer');
const Category     = require('../models/Category');
const WorkerSkill  = require('../models/WorkerSkill');
const Availability = require('../models/Availability');
const JobPost      = require('../models/JobPost');
const Booking      = require('../models/Booking');
const Payment      = require('../models/Payment');
const Rating       = require('../models/Rating');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const { Location, Dispute } = require('../models/locationDisputeAdmin');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamnaka_db';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const hashPass = async (p) => bcrypt.hash(p, 10);
const puneGPS = (r = 0.15) => ({
  lat: parseFloat((18.5204 + (Math.random() - 0.5) * r).toFixed(6)),
  lng: parseFloat((73.8567 + (Math.random() - 0.5) * r).toFixed(6)),
});
const geoPoint = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });

const categoriesData = [
  { nameEn: 'Construction',      nameMr: 'बांधकाम',     nameHi: 'निर्माण',         iconEmoji: '🏗️', sortOrder: 1 },
  { nameEn: 'Farming',           nameMr: 'शेती',         nameHi: 'खेती',            iconEmoji: '🌾', sortOrder: 2 },
  { nameEn: 'Plumbing',          nameMr: 'प्लंबिंग',      nameHi: 'प्लंबिंग',        iconEmoji: '🔧', sortOrder: 3 },
  { nameEn: 'Electrical',        nameMr: 'विद्युत',       nameHi: 'बिजली',           iconEmoji: '⚡', sortOrder: 4 },
  { nameEn: 'Painting',          nameMr: 'रंगकाम',       nameHi: 'पेंटिंग',          iconEmoji: '🎨', sortOrder: 5 },
  { nameEn: 'Carpentry',         nameMr: 'सुतारकाम',     nameHi: 'बढ़ईगिरी',         iconEmoji: '🪚', sortOrder: 6 },
  { nameEn: 'Loading/Unloading', nameMr: 'माल वाहतूक',   nameHi: 'लोडिंग/अनलोडिंग', iconEmoji: '📦', sortOrder: 7 },
  { nameEn: 'Cleaning',          nameMr: 'साफसफाई',       nameHi: 'सफाई',            iconEmoji: '🧹', sortOrder: 8 },
  { nameEn: 'Gardening',         nameMr: 'बागकाम',       nameHi: 'बागवानी',          iconEmoji: '🌱', sortOrder: 9 },
  { nameEn: 'Security',          nameMr: 'सुरक्षा',       nameHi: 'सुरक्षा',          iconEmoji: '🔒', sortOrder: 10 },
  { nameEn: 'Driving',           nameMr: 'वाहन चालवणे',  nameHi: 'ड्राइविंग',        iconEmoji: '🚗', sortOrder: 11 },
  { nameEn: 'Cooking/Catering',  nameMr: 'स्वयंपाक',      nameHi: 'खाना पकाना',      iconEmoji: '🍳', sortOrder: 12 },
];

const workerNames = [
  'Ramesh Patil','Suresh Jadhav','Vijay Shinde','Mahesh Kale','Sanjay Mane',
  'Raju Pawar','Ganesh Bhosale','Dinesh Salve','Santosh Yadav','Prakash Gaikwad',
  'Anil Kadam','Vilas Chavan','Nitin Waghmare','Sachin Kamble','Rahul Navale',
  'Sunil More','Deepak Thakare','Amol Deshpande','Rohit Jagtap','Prashant Shirke',
  'Kiran Satpute','Balaji Tupe',
];
const workerPhones = [
  '9876543210','9876543211','9876543212','9876543213','9876543214',
  '9876543215','9876543216','9876543217','9876543218','9876543219',
  '9765432100','9765432101','9765432102','9765432103','9765432104',
  '9765432105','9765432106','9765432107','9765432108','9765432109',
  '9654321000','9654321001',
];
const employerNames = [
  'Sunil Builders Pvt Ltd','Ravi Farms & Agriculture','Pune Construction Co',
  'Maharashtra Infra Works','Deshpande Contractors','Sai Krupa Builders',
  'Green Valley Farms','City Maintenance Services','Omkar Developers',
  'Shri Ganesh Construction','Balaji Agro Farms','Urban Clean Services',
  'Reliable Cargo Movers','Techno Electricals','Modern Plumbers',
  'Sunrise Security Agency','Royal Catering Services','Pune Garden Works',
  'Shivaji Carpentry Works','Laxmi Painting House',
];
const employerPhones = [
  '8888800001','8888800002','8888800003','8888800004','8888800005',
  '8888800006','8888800007','8888800008','8888800009','8888800010',
  '8888800011','8888800012','8888800013','8888800014','8888800015',
  '8888800016','8888800017','8888800018','8888800019','8888800020',
];
const districts = ['Pune','Mumbai','Nashik','Aurangabad','Nagpur','Thane','Solapur','Kolhapur'];
const cities    = ['Pune','Mumbai','Nashik','Aurangabad','Nagpur','Thane','Solapur','Kolhapur'];
const pincodes  = ['411001','411002','411005','411014','411028','411033','400001','422001'];
const levels    = ['beginner','experienced','expert'];
const langs     = ['mr','hi','en'];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected\n');

  console.log('🗑️  Clearing all collections...');
  await Promise.all([
    User.deleteMany({}), Worker.deleteMany({}), Employer.deleteMany({}),
    Category.deleteMany({}), WorkerSkill.deleteMany({}), Availability.deleteMany({}),
    JobPost.deleteMany({}), Booking.deleteMany({}), Payment.deleteMany({}),
    Rating.deleteMany({}), Notification.deleteMany({}), Subscription.deleteMany({}),
    Location.deleteMany({}), Dispute.deleteMany({}),
  ]);
  console.log('✅ Cleared\n');

  // 1. CATEGORIES (12)
  const categories = await Category.insertMany(categoriesData.map(c => ({ ...c, nameGu: c.nameEn, isActive: true })));
  console.log(`✅ ${categories.length} Categories`);
  const catIds = categories.map(c => c._id);

  // 2. LOCATIONS (20)
  const locRaw = [
    { district:'Pune',       taluka:'Haveli',     city:'Pune',        pincode:'411001' },
    { district:'Pune',       taluka:'Khed',       city:'Chakan',      pincode:'410501' },
    { district:'Pune',       taluka:'Maval',      city:'Talegaon',    pincode:'410507' },
    { district:'Pune',       taluka:'Baramati',   city:'Baramati',    pincode:'413102' },
    { district:'Pune',       taluka:'Shirur',     city:'Shirur',      pincode:'412210' },
    { district:'Mumbai',     taluka:'Andheri',    city:'Andheri',     pincode:'400053' },
    { district:'Mumbai',     taluka:'Borivali',   city:'Borivali',    pincode:'400066' },
    { district:'Nashik',     taluka:'Nashik',     city:'Nashik',      pincode:'422001' },
    { district:'Nashik',     taluka:'Igatpuri',   city:'Igatpuri',    pincode:'422403' },
    { district:'Aurangabad', taluka:'Aurangabad', city:'Aurangabad',  pincode:'431001' },
    { district:'Nagpur',     taluka:'Nagpur',     city:'Nagpur',      pincode:'440001' },
    { district:'Nagpur',     taluka:'Kamptee',    city:'Kamptee',     pincode:'441001' },
    { district:'Thane',      taluka:'Thane',      city:'Thane',       pincode:'400601' },
    { district:'Thane',      taluka:'Kalyan',     city:'Kalyan',      pincode:'421301' },
    { district:'Solapur',    taluka:'Solapur',    city:'Solapur',     pincode:'413001' },
    { district:'Kolhapur',   taluka:'Kolhapur',   city:'Kolhapur',    pincode:'416001' },
    { district:'Satara',     taluka:'Satara',     city:'Satara',      pincode:'415001' },
    { district:'Sangli',     taluka:'Miraj',      city:'Miraj',       pincode:'416410' },
    { district:'Ahmednagar', taluka:'Ahmednagar', city:'Ahmednagar',  pincode:'414001' },
    { district:'Jalgaon',    taluka:'Jalgaon',    city:'Jalgaon',     pincode:'425001' },
  ];
  const locations = await Location.insertMany(locRaw.map(l => {
    const { lat, lng } = puneGPS(0.5);
    return { ...l, state:'Maharashtra', latitude:lat, longitude:lng, location:geoPoint(lat,lng), isActive:true };
  }));
  console.log(`✅ ${locations.length} Locations`);

  // 3. ADMIN (1)
  await User.create({
    name:'Super Admin', phone:'9999999999', email:'admin@digitalkamnaka.in',
    password: await hashPass('Admin@1234'),
    role:'admin', language:'mr', isVerified:true, isActive:true,
  });
  console.log('✅ 1 Admin');

  // 4. WORKERS (22)
  const workerUsers = [];
  const workers = [];
  for (let i = 0; i < workerNames.length; i++) {
    const { lat, lng } = puneGPS();
    const u = await User.create({
      name:workerNames[i], phone:workerPhones[i],
      password: await hashPass('Worker@123'),
      role:'worker', language:pick(langs), isVerified:i<15, isActive:true,
    });
    workerUsers.push(u);
    const w = await Worker.create({
      userId:u._id, dailyRate:rand(400,1200), experienceYrs:rand(0,15),
      bio:`${workerNames[i]} - अनुभवी कामगार`, totalJobs:rand(0,80),
      avgRating:parseFloat((rand(30,50)/10).toFixed(1)),
      isAvailable:i%3!==0, isVerified:i<15,
      city:pick(cities), district:pick(districts), state:'Maharashtra',
      pincode:pick(pincodes), address:`${rand(1,999)} Main Naka`,
      totalEarnings:rand(5000,150000),
      latitude:lat, longitude:lng, location:geoPoint(lat,lng),
    });
    workers.push(w);
  }
  console.log(`✅ ${workers.length} Workers`);

  // 5. WORKER SKILLS (40+)
  const skillDocs = [];
  for (let i = 0; i < workers.length; i++) {
    const used = new Set();
    for (let j = 0; j < rand(1,3); j++) {
      const cId = pick(catIds).toString();
      if (used.has(cId)) continue;
      used.add(cId);
      skillDocs.push({ workerId:workers[i]._id, categoryId:cId, level:pick(levels), yearsInSkill:rand(0,10) });
    }
  }
  await WorkerSkill.insertMany(skillDocs);
  console.log(`✅ ${skillDocs.length} WorkerSkills`);

  // 6. AVAILABILITY (22)
  const today = new Date();
  const availDocs = workers.map((w, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i % 7));
    return {
      workerId:w._id, date:d, isAvailable:i%4!==0,
      startTime:pick(['06:00:00','07:00:00','08:00:00']),
      endTime:pick(['18:00:00','19:00:00','20:00:00']),
      latitude:w.latitude, longitude:w.longitude, location:w.location,
      radiusKm:pick([10,15,20,25,30]),
    };
  });
  await Availability.insertMany(availDocs);
  console.log(`✅ ${availDocs.length} Availabilities`);

  // 7. EMPLOYERS (20)
  const employerUsers = [];
  const employers = [];
  const empTypes = ['individual','contractor','farmer','business'];
  for (let i = 0; i < employerNames.length; i++) {
    const { lat, lng } = puneGPS();
    const u = await User.create({
      name:employerNames[i], phone:employerPhones[i],
      password: await hashPass('Employer@123'),
      role:'employer', language:pick(langs), isVerified:i<12, isActive:true,
    });
    employerUsers.push(u);
    const e = await Employer.create({
      userId:u._id, companyName:employerNames[i], employerType:pick(empTypes),
      avgRating:parseFloat((rand(30,50)/10).toFixed(1)),
      totalPosts:rand(1,30), totalHires:rand(0,25),
      city:pick(cities), district:pick(districts), state:'Maharashtra',
      pincode:pick(pincodes), address:`${rand(1,999)} Industrial Area`,
      totalSpent:rand(10000,500000),
      latitude:lat, longitude:lng, location:geoPoint(lat,lng),
    });
    employers.push(e);
  }
  console.log(`✅ ${employers.length} Employers`);

  // 8. SUBSCRIPTIONS (20)
  const planDefs = [
    {plan:'free',price:0,postsAllowed:3},
    {plan:'basic',price:299,postsAllowed:15},
    {plan:'pro',price:799,postsAllowed:-1},
    {plan:'premium',price:1999,postsAllowed:-1},
  ];
  const subDocs = employers.map((e, i) => {
    const p = planDefs[i % planDefs.length];
    const start = new Date();
    const end = new Date(); end.setMonth(end.getMonth()+1);
    return { employerId:e._id, plan:p.plan, price:p.price,
      postsAllowed:p.postsAllowed, postsUsed:rand(0, p.postsAllowed===-1?10:p.postsAllowed),
      startDate:start, endDate:end, isActive:true };
  });
  await Subscription.insertMany(subDocs);
  console.log(`✅ ${subDocs.length} Subscriptions`);

  // 9. JOB POSTS (20)
  const jobTitles = [
    'बांधकामासाठी मजूर हवे','शेत कापणीसाठी कामगार','घर रंगवण्यासाठी',
    'विद्युत काम करणारे हवेत','नळकाम दुरुस्तीसाठी','सुतारकाम करणारे हवेत',
    'माल उतरवण्यासाठी मजूर','घर साफसफाईसाठी','बाग कामासाठी माळी हवा',
    'सुरक्षा रक्षक हवे','गाडी चालवण्यासाठी ड्रायव्हर','स्वयंपाकासाठी मदतनीस',
    'छत बांधणीसाठी कामगार','विहीर खोदण्यासाठी','पाईपलाईन टाकण्यासाठी',
    'दुकान सजावटीसाठी','गोदाम व्यवस्थापनासाठी','फार्म हाऊस साफसफाई',
    'Solar Panel Installation','AC दुरुस्तीसाठी',
  ];
  const jobPosts = [];
  for (let i = 0; i < 20; i++) {
    const emp = employers[i % employers.length];
    const { lat, lng } = puneGPS();
    const jobDate = new Date(); jobDate.setDate(jobDate.getDate() + rand(1,30));
    const wNeeded = rand(1,10);
    const wBooked = rand(0,wNeeded);
    const status = wBooked===0?'open':wBooked<wNeeded?'partially_filled':'filled';
    const jp = await JobPost.create({
      employerId:emp._id, categoryId:pick(catIds), title:jobTitles[i],
      description:`${jobTitles[i]} - अनुभव असलेले कामगार हवेत`,
      workersNeeded:wNeeded, workersBooked:wBooked,
      dailyRate:rand(300,1500), jobDate, durationDays:rand(1,10),
      jobType:pick(['daily','weekly','monthly']),
      latitude:lat, longitude:lng, location:geoPoint(lat,lng),
      city:pick(cities), district:pick(districts), state:'Maharashtra',
      pincode:pick(pincodes), isUrgent:i%5===0, status, viewsCount:rand(5,200),
    });
    jobPosts.push(jp);
  }
  console.log(`✅ ${jobPosts.length} JobPosts`);

  // 10. BOOKINGS (20)...
  const bkStatuses = ['pending','accepted','started','completed','completed','completed','cancelled','rejected'];
  const bookings = [];
  for (let i = 0; i < 20; i++) {
    const w = workers[i % workers.length];
    const e = employers[i % employers.length];
    const jp = jobPosts[i % jobPosts.length];
    const status = pick(bkStatuses);
    const agreedRate = rand(300,1200);
    const totalDays = rand(1,5);
    const totalAmount = agreedRate * totalDays;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - rand(1,30));
    const b = await Booking.create({
      jobPostId: i%3===0 ? jp._id : null,
      workerId:w._id, employerId:e._id, status,
      startDate, endDate:new Date(startDate.getTime()+totalDays*86400000),
      totalDays, agreedRate, totalAmount,
      bookingNote:pick(['वेळेत या','साहित्य घेऊन या','काम चांगले करा','']),
      workStartedAt:['started','completed'].includes(status)?new Date(startDate.getTime()+3600000):null,
      workEndedAt:status==='completed'?new Date(startDate.getTime()+totalDays*86400000):null,
      cancelReason:status==='cancelled'?'काम रद्द केले':null,
      cancelledBy:status==='cancelled'?workerUsers[i%workerUsers.length]._id:null,
      cancelledAt:status==='cancelled'?new Date():null,
      ratingGivenToWorker:status==='completed'&&i%2===0,
      ratingGivenToEmployer:status==='completed'&&i%3===0,
    });
    bookings.push(b);
  }
  console.log(`✅ ${bookings.length} Bookings`);

  // 11. PAYMENTS (20)
  const payMethods = ['cash','upi','card','netbanking'];
  const payments = [];
  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    const done = b.status === 'completed';
    const fee = parseFloat((b.totalAmount * 0.05).toFixed(2));
    const p = await Payment.create({
      bookingId:b._id, employerId:b.employerId, workerId:b.workerId,
      amount:b.totalAmount, platformFee:fee, workerAmount:b.totalAmount-fee,
      method:done?pick(payMethods):'cash',
      status:done?'completed':b.status==='cancelled'?'failed':'pending',
      razorpayOrderId:done&&i%2===0?`order_${Math.random().toString(36).substr(2,14)}`:null,
      razorpayPaymentId:done&&i%2===0?`pay_${Math.random().toString(36).substr(2,14)}`:null,
      paidAt:done?b.workEndedAt:null,
    });
    payments.push(p);
  }
  console.log(`✅ ${payments.length} Payments`);

  // 12. RATINGS (20+)
  const completedB = bookings.filter(b => b.status === 'completed');
  const ratings = [];
  for (let i = 0; i < completedB.length; i++) {
    const b = completedB[i];
    const wUser = workerUsers[i % workerUsers.length];
    const eUser = employerUsers[i % employerUsers.length];
    ratings.push(await Rating.create({
      bookingId:b._id, ratedBy:eUser._id, ratedTo:wUser._id,
      roleRatedTo:'worker', score:rand(3,5),
      review:pick(['खूप चांगले काम केले','वेळेत आले','मेहनती कामगार','पुन्हा बोलावणार',null]),
      isVisible:true,
    }));
    if (i%2===0) {
      ratings.push(await Rating.create({
        bookingId:b._id, ratedBy:wUser._id, ratedTo:eUser._id,
        roleRatedTo:'employer', score:rand(3,5),
        review:pick(['चांगले मालक','वेळेवर पैसे दिले','चांगले वागणूक',null]),
        isVisible:true,
      }));
    }
  }
  console.log(`✅ ${ratings.length} Ratings`);

  // 13. NOTIFICATIONS (20)
  const notifTypes = ['booking_request','booking_accepted','booking_completed','payment_received','new_rating','urgent_job_nearby','system'];
  const notifDocs = [];
  for (let i = 0; i < 20; i++) {
    const u = i%2===0 ? workerUsers[i%workerUsers.length] : employerUsers[i%employerUsers.length];
    const type = pick(notifTypes);
    notifDocs.push({
      userId:u._id, type,
      titleMr:`नवीन सूचना`, titleHi:`नई सूचना`, titleEn:`New Notification`,
      messageMr:'तुमच्यासाठी एक नवीन संदेश आहे',
      messageHi:'आपके लिए एक नया संदेश है',
      messageEn:'You have a new message',
      channel:pick(['app','push','sms']),
      isRead:i%3===0, readAt:i%3===0?new Date():null, isDelivered:true,
      referenceType:'booking',
    });
  }
  await Notification.insertMany(notifDocs);
  console.log(`✅ ${notifDocs.length} Notifications`);

  // 14. DISPUTES (5)
  const dispDocs = completedB.slice(0,5).map((b, i) => ({
    bookingId:b._id, raisedBy:workerUsers[i]._id, against:employerUsers[i]._id,
    reason:pick(['पैसे वेळेत मिळाले नाहीत','agreed rate पेक्षा कमी पैसे दिले','payment नाकारली']),
    status:pick(['open','under_review','resolved','closed']),
    resolution:i%2===0?'Admin ने तपासणी केली, पैसे दिले':null,
    resolvedAt:i%2===0?new Date():null,
  }));
  await Dispute.insertMany(dispDocs);
  console.log(`✅ ${dispDocs.length} Disputes`);

  console.log('\n════════════════════════════════════════');
  console.log('🎉 DATABASE SEEDING COMPLETE!');
  console.log('════════════════════════════════════════');
  console.log(`📦 Categories:    ${categories.length}`);
  console.log(`📍 Locations:     ${locations.length}`);
  console.log(`👷 Workers:       ${workers.length}`);
  console.log(`🏢 Employers:     ${employers.length}`);
  console.log(`🛠️  WorkerSkills:  ${skillDocs.length}`);
  console.log(`📅 Availability:  ${availDocs.length}`);
  console.log(`💼 JobPosts:      ${jobPosts.length}`);
  console.log(`📋 Bookings:      ${bookings.length}`);
  console.log(`💰 Payments:      ${payments.length}`);
  console.log(`⭐ Ratings:       ${ratings.length}`);
  console.log(`🔔 Notifications: ${notifDocs.length}`);
  console.log(`📝 Subscriptions: ${subDocs.length}`);
  console.log(`⚖️  Disputes:      ${dispDocs.length}`);
  console.log('════════════════════════════════════════');
  console.log('🔑 LOGIN:');
  console.log('   Admin    → 9999999999 | Admin@1234');
  console.log('   Worker   → 9876543210 | Worker@123');
  console.log('   Employer → 8888800001 | Employer@123');
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seeding failed:', err.message);
  console.error(err.stack);
  mongoose.disconnect();
  process.exit(1);
});
