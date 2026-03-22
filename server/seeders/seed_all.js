/**
 * seeders/seed_all.js — Full MongoDB Database Seeder
 * FIXED: 5 unique workers per category (60 total)
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
  { nameEn: 'Construction',      nameMr: 'बांधकाम',     nameHi: 'निर्माण',          iconEmoji: '🏗️', sortOrder: 1 },
  { nameEn: 'Farming',           nameMr: 'शेती',         nameHi: 'खेती',             iconEmoji: '🌾', sortOrder: 2 },
  { nameEn: 'Plumbing',          nameMr: 'प्लंबिंग',      nameHi: 'प्लंबिंग',         iconEmoji: '🔧', sortOrder: 3 },
  { nameEn: 'Electrical',        nameMr: 'विद्युत',       nameHi: 'बिजली',            iconEmoji: '⚡', sortOrder: 4 },
  { nameEn: 'Painting',          nameMr: 'रंगकाम',       nameHi: 'पेंटिंग',           iconEmoji: '🎨', sortOrder: 5 },
  { nameEn: 'Carpentry',         nameMr: 'सुतारकाम',     nameHi: 'बढ़ईगिरी',          iconEmoji: '🪚', sortOrder: 6 },
  { nameEn: 'Loading/Unloading', nameMr: 'माल वाहतूक',   nameHi: 'लोडिंग/अनलोडिंग',  iconEmoji: '📦', sortOrder: 7 },
  { nameEn: 'Cleaning',          nameMr: 'साफसफाई',       nameHi: 'सफाई',             iconEmoji: '🧹', sortOrder: 8 },
  { nameEn: 'Gardening',         nameMr: 'बागकाम',       nameHi: 'बागवानी',           iconEmoji: '🌱', sortOrder: 9 },
  { nameEn: 'Security',          nameMr: 'सुरक्षा',       nameHi: 'सुरक्षा',           iconEmoji: '🔒', sortOrder: 10 },
  { nameEn: 'Driving',           nameMr: 'वाहन चालवणे',  nameHi: 'ड्राइविंग',         iconEmoji: '🚗', sortOrder: 11 },
  { nameEn: 'Cooking/Catering',  nameMr: 'स्वयंपाक',      nameHi: 'खाना पकाना',       iconEmoji: '🍳', sortOrder: 12 },
];

// ── 5 Workers per Category (60 total, all unique) ─────────────
const workersByCat = {
  'Construction': [
    { name:'Ramesh Patil',    phone:'8800000001', city:'Pune',       district:'Pune',       rate:750,  exp:8,  bio:'बांधकामात 8 वर्षे, सिमेंट-विटांचे काम',   level:'expert',      rating:4.8, jobs:120 },
    { name:'Suresh Nale',     phone:'8800000002', city:'Nashik',     district:'Nashik',     rate:650,  exp:5,  bio:'घर बांधणी आणि छत काम मध्ये तज्ञ',         level:'experienced', rating:4.3, jobs:75  },
    { name:'Ganesh Kendre',   phone:'8800000003', city:'Aurangabad', district:'Aurangabad', rate:700,  exp:6,  bio:'RCC काम आणि प्लास्टर मध्ये अनुभवी',       level:'experienced', rating:4.5, jobs:90  },
    { name:'Manoj Thakur',    phone:'8800000004', city:'Nagpur',     district:'Nagpur',     rate:800,  exp:10, bio:'10 वर्षे बांधकाम क्षेत्रात काम केले',     level:'expert',      rating:4.9, jobs:200 },
    { name:'Pravin Gaikwad',  phone:'8800000005', city:'Solapur',    district:'Solapur',    rate:550,  exp:2,  bio:'नवीन बांधकाम कामगार, मेहनती',             level:'beginner',    rating:3.8, jobs:20  },
  ],
  'Farming': [
    { name:'Vitthal Shinde',  phone:'8800000006', city:'Sangli',     district:'Sangli',     rate:450,  exp:15, bio:'ऊस आणि द्राक्ष शेतीत 15 वर्षांचा अनुभव', level:'expert',      rating:4.9, jobs:300 },
    { name:'Bhimrao Jadhav',  phone:'8800000007', city:'Kolhapur',   district:'Kolhapur',   rate:400,  exp:10, bio:'भात आणि भाजीपाला शेती मध्ये तज्ञ',        level:'expert',      rating:4.6, jobs:180 },
    { name:'Dagadu More',     phone:'8800000008', city:'Satara',     district:'Satara',     rate:380,  exp:7,  bio:'नांगरणी आणि पेरणी काम करतो',              level:'experienced', rating:4.2, jobs:100 },
    { name:'Keshav Pawar',    phone:'8800000009', city:'Ahmednagar', district:'Ahmednagar', rate:420,  exp:8,  bio:'कापूस आणि सोयाबीन शेती मध्ये अनुभव',     level:'experienced', rating:4.4, jobs:130 },
    { name:'Namdev Salve',    phone:'8800000010', city:'Latur',      district:'Latur',      rate:350,  exp:3,  bio:'शेती कामात नवीन पण कष्टाळू',              level:'beginner',    rating:3.9, jobs:25  },
  ],
  'Plumbing': [
    { name:'Anil Kulkarni',   phone:'8800000011', city:'Pune',       district:'Pune',       rate:700,  exp:9,  bio:'पाणी पुरवठा आणि सांडपाणी व्यवस्था तज्ञ', level:'expert',      rating:4.7, jobs:150 },
    { name:'Ravi Kamble',     phone:'8800000012', city:'Mumbai',     district:'Mumbai',     rate:900,  exp:12, bio:'Bathroom fitting आणि pipe laying तज्ञ',    level:'expert',      rating:4.9, jobs:250 },
    { name:'Santosh Mane',    phone:'8800000013', city:'Nashik',     district:'Nashik',     rate:600,  exp:6,  bio:'नळ दुरुस्ती आणि नवीन pipe टाकणे',         level:'experienced', rating:4.3, jobs:80  },
    { name:'Deepak Wagh',     phone:'8800000014', city:'Nagpur',     district:'Nagpur',     rate:650,  exp:7,  bio:'Overhead tank आणि motor fitting',           level:'experienced', rating:4.5, jobs:110 },
    { name:'Yogesh Bhoite',   phone:'8800000015', city:'Kolhapur',   district:'Kolhapur',   rate:500,  exp:3,  bio:'Basic plumbing काम, वेळेवर येतो',          level:'beginner',    rating:4.0, jobs:30  },
  ],
  'Electrical': [
    { name:'Vijay Deshpande', phone:'8800000016', city:'Pune',       district:'Pune',       rate:850,  exp:11, bio:'Domestic आणि industrial wiring तज्ञ',      level:'expert',      rating:4.8, jobs:200 },
    { name:'Sanjay Lokhande', phone:'8800000017', city:'Mumbai',     district:'Mumbai',     rate:1000, exp:14, bio:'High tension wiring आणि panel board expert', level:'expert',     rating:4.9, jobs:320 },
    { name:'Nitin Gaikwad',   phone:'8800000018', city:'Aurangabad', district:'Aurangabad', rate:700,  exp:6,  bio:'Fan, switch, socket fitting अनुभव',         level:'experienced', rating:4.4, jobs:90  },
    { name:'Rakesh Bhosle',   phone:'8800000019', city:'Solapur',    district:'Solapur',    rate:750,  exp:8,  bio:'Solar panel आणि inverter installation',      level:'experienced', rating:4.6, jobs:120 },
    { name:'Rohit Waghmare',  phone:'8800000020', city:'Nagpur',     district:'Nagpur',     rate:550,  exp:2,  bio:'ITI electrical पदविका, नवीन electrician',    level:'beginner',    rating:3.7, jobs:18  },
  ],
  'Painting': [
    { name:'Sunil Rathod',    phone:'8800000021', city:'Pune',       district:'Pune',       rate:650,  exp:10, bio:'Interior आणि exterior painting तज्ञ',       level:'expert',      rating:4.7, jobs:180 },
    { name:'Ajay Kadam',      phone:'8800000022', city:'Mumbai',     district:'Mumbai',     rate:800,  exp:8,  bio:'Texture painting आणि waterproofing expert',  level:'expert',      rating:4.8, jobs:160 },
    { name:'Mohan Bhagat',    phone:'8800000023', city:'Nashik',     district:'Nashik',     rate:550,  exp:5,  bio:'Distemper आणि emulsion painting',            level:'experienced', rating:4.2, jobs:70  },
    { name:'Vikas Chavan',    phone:'8800000024', city:'Satara',     district:'Satara',     rate:500,  exp:4,  bio:'घराचे रंगकाम स्वच्छ आणि नीटनेटके',         level:'experienced', rating:4.3, jobs:55  },
    { name:'Hemant Sonawane', phone:'8800000025', city:'Kolhapur',   district:'Kolhapur',   rate:420,  exp:1,  bio:'नवीन painter, कामात नीटनेटकेपणा',          level:'beginner',    rating:3.9, jobs:12  },
  ],
  'Carpentry': [
    { name:'Prakash Sawant',  phone:'8800000026', city:'Pune',       district:'Pune',       rate:900,  exp:15, bio:'Furniture making आणि wood work तज्ञ',       level:'expert',      rating:4.9, jobs:280 },
    { name:'Umesh Tilekar',   phone:'8800000027', city:'Kolhapur',   district:'Kolhapur',   rate:800,  exp:10, bio:'Doors, windows आणि cupboard तयार करतो',     level:'expert',      rating:4.7, jobs:200 },
    { name:'Rajesh Yadav',    phone:'8800000028', city:'Nagpur',     district:'Nagpur',     rate:700,  exp:7,  bio:'Wooden flooring आणि ceiling work',           level:'experienced', rating:4.4, jobs:110 },
    { name:'Kishor Jagtap',   phone:'8800000029', city:'Nashik',     district:'Nashik',     rate:650,  exp:6,  bio:'Chair, table आणि almira दुरुस्ती',          level:'experienced', rating:4.3, jobs:85  },
    { name:'Amol Kumbhar',    phone:'8800000030', city:'Solapur',    district:'Solapur',    rate:500,  exp:2,  bio:'नवीन सुतारकाम शिकलेलो, उत्साही',          level:'beginner',    rating:3.8, jobs:15  },
  ],
  'Loading/Unloading': [
    { name:'Balu Kamble',     phone:'8800000031', city:'Pune',       district:'Pune',       rate:450,  exp:8,  bio:'जड माल उचलण्यात तज्ञ, team सकट काम',       level:'expert',      rating:4.6, jobs:400 },
    { name:'Tukaram Shinde',  phone:'8800000032', city:'Mumbai',     district:'Mumbai',     rate:500,  exp:10, bio:'Warehouse आणि transport loading अनुभव',      level:'expert',      rating:4.7, jobs:500 },
    { name:'Dattu Pawar',     phone:'8800000033', city:'Aurangabad', district:'Aurangabad', rate:380,  exp:5,  bio:'धान्य आणि सामान चढवणे-उतरवणे',             level:'experienced', rating:4.2, jobs:200 },
    { name:'Ramu Waghmare',   phone:'8800000034', city:'Nagpur',     district:'Nagpur',     rate:420,  exp:6,  bio:'Market yard मध्ये loading काम',              level:'experienced', rating:4.3, jobs:250 },
    { name:'Sham Gaikwad',    phone:'8800000035', city:'Solapur',    district:'Solapur',    rate:350,  exp:1,  bio:'नवीन कामगार, शक्तिशाली आणि मेहनती',        level:'beginner',    rating:3.7, jobs:30  },
  ],
  'Cleaning': [
    { name:'Savita Tambe',    phone:'8800000036', city:'Pune',       district:'Pune',       rate:400,  exp:6,  bio:'घर आणि office साफसफाई तज्ञ',               level:'expert',      rating:4.8, jobs:350 },
    { name:'Rekha Bhosale',   phone:'8800000037', city:'Mumbai',     district:'Mumbai',     rate:500,  exp:8,  bio:'Deep cleaning आणि sanitization expert',      level:'expert',      rating:4.9, jobs:420 },
    { name:'Sunita Jadhav',   phone:'8800000038', city:'Nashik',     district:'Nashik',     rate:350,  exp:4,  bio:'स्वयंपाकघर आणि बाथरूम cleaning',            level:'experienced', rating:4.4, jobs:150 },
    { name:'Laxmi Mane',      phone:'8800000039', city:'Kolhapur',   district:'Kolhapur',   rate:320,  exp:3,  bio:'नीटनेटकी आणि वेळेवर काम करणारी',           level:'experienced', rating:4.3, jobs:100 },
    { name:'Anita Shinde',    phone:'8800000040', city:'Satara',     district:'Satara',     rate:280,  exp:1,  bio:'नवीन cleaning कामगार, स्वच्छतेवर भर',      level:'beginner',    rating:4.0, jobs:20  },
  ],
  'Gardening': [
    { name:'Ashok Pote',      phone:'8800000041', city:'Pune',       district:'Pune',       rate:500,  exp:12, bio:'Landscape gardening आणि lawn maintenance',   level:'expert',      rating:4.8, jobs:220 },
    { name:'Dilip Naik',      phone:'8800000042', city:'Mumbai',     district:'Mumbai',     rate:600,  exp:10, bio:'Terrace garden आणि indoor plants तज्ञ',      level:'expert',      rating:4.7, jobs:180 },
    { name:'Pandurang Gore',  phone:'8800000043', city:'Nashik',     district:'Nashik',     rate:420,  exp:6,  bio:'फुलझाडे, भाजीपाला बाग तयार करतो',          level:'experienced', rating:4.4, jobs:90  },
    { name:'Shankar Kale',    phone:'8800000044', city:'Nagpur',     district:'Nagpur',     rate:450,  exp:7,  bio:'झाडे छाटणी आणि lawn mowing करतो',           level:'experienced', rating:4.3, jobs:110 },
    { name:'Sandip Pujari',   phone:'8800000045', city:'Kolhapur',   district:'Kolhapur',   rate:350,  exp:2,  bio:'बागकाम शिकतो, झाडे लावण्यात आवड',         level:'beginner',    rating:3.9, jobs:22  },
  ],
  'Security': [
    { name:'Subhash Mule',    phone:'8800000046', city:'Pune',       district:'Pune',       rate:600,  exp:10, bio:'Ex-army, security guard मध्ये 10 वर्षे',     level:'expert',      rating:4.9, jobs:500 },
    { name:'Maruti Chougule', phone:'8800000047', city:'Mumbai',     district:'Mumbai',     rate:700,  exp:8,  bio:'Mall आणि corporate security अनुभव',          level:'expert',      rating:4.7, jobs:380 },
    { name:'Balasaheb Pol',   phone:'8800000048', city:'Aurangabad', district:'Aurangabad', rate:500,  exp:5,  bio:'Bank आणि hospital security guard',            level:'experienced', rating:4.3, jobs:200 },
    { name:'Dilip Kawade',    phone:'8800000049', city:'Nagpur',     district:'Nagpur',     rate:550,  exp:6,  bio:'Night shift security मध्ये अनुभवी',          level:'experienced', rating:4.4, jobs:250 },
    { name:'Sudam Raut',      phone:'8800000050', city:'Solapur',    district:'Solapur',    rate:420,  exp:1,  bio:'नवीन security guard, जबाबदार आणि सतर्क',    level:'beginner',    rating:3.8, jobs:15  },
  ],
  'Driving': [
    { name:'Raju Deshmukh',   phone:'8800000051', city:'Pune',       district:'Pune',       rate:800,  exp:12, bio:'Heavy vehicle आणि passenger vehicle driver',  level:'expert',      rating:4.8, jobs:300 },
    { name:'Kiran Bobade',    phone:'8800000052', city:'Mumbai',     district:'Mumbai',     rate:1000, exp:15, bio:'Truck, bus, car सर्व vehicles चालवतो',        level:'expert',      rating:4.9, jobs:450 },
    { name:'Santosh Nikam',   phone:'8800000053', city:'Nashik',     district:'Nashik',     rate:650,  exp:7,  bio:'School bus आणि tempo driver',                 level:'experienced', rating:4.5, jobs:150 },
    { name:'Arun Salunkhe',   phone:'8800000054', city:'Kolhapur',   district:'Kolhapur',   rate:700,  exp:8,  bio:'LMV license, office cab driver',               level:'experienced', rating:4.4, jobs:180 },
    { name:'Nilesh Sawant',   phone:'8800000055', city:'Satara',     district:'Satara',     rate:500,  exp:2,  bio:'नवीन driver, LMV license आहे',                level:'beginner',    rating:4.0, jobs:25  },
  ],
  'Cooking/Catering': [
    { name:'Mangal Kulkarni', phone:'8800000056', city:'Pune',       district:'Pune',       rate:700,  exp:10, bio:'Maharashtrian आणि North Indian जेवण तज्ञ',   level:'expert',      rating:4.9, jobs:300 },
    { name:'Shobha Pawar',    phone:'8800000057', city:'Mumbai',     district:'Mumbai',     rate:800,  exp:12, bio:'Wedding catering आणि party cooking expert',   level:'expert',      rating:4.8, jobs:250 },
    { name:'Vimal Gaikwad',   phone:'8800000058', city:'Nashik',     district:'Nashik',     rate:550,  exp:6,  bio:'Tiffin service आणि home cooking',             level:'experienced', rating:4.5, jobs:120 },
    { name:'Pushpa Jadhav',   phone:'8800000059', city:'Nagpur',     district:'Nagpur',     rate:500,  exp:5,  bio:'Puran poli, modak आणि traditional recipes',   level:'experienced', rating:4.6, jobs:100 },
    { name:'Meena Shinde',    phone:'8800000060', city:'Aurangabad', district:'Aurangabad', rate:400,  exp:1,  bio:'घरचे जेवण बनवते, आवडीने काम',               level:'beginner',    rating:4.1, jobs:10  },
  ],
};

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

const cityCoords = {
  'Pune':       { lat:18.5204, lng:73.8567 },
  'Mumbai':     { lat:19.0760, lng:72.8777 },
  'Nashik':     { lat:19.9975, lng:73.7898 },
  'Nagpur':     { lat:21.1458, lng:79.0882 },
  'Aurangabad': { lat:19.8762, lng:75.3433 },
  'Solapur':    { lat:17.6599, lng:75.9064 },
  'Kolhapur':   { lat:16.7050, lng:74.2433 },
  'Satara':     { lat:17.6805, lng:74.0183 },
  'Sangli':     { lat:16.8524, lng:74.5815 },
  'Latur':      { lat:18.4088, lng:76.5604 },
  'Ahmednagar': { lat:19.0948, lng:74.7480 },
};

const districts = ['Pune','Mumbai','Nashik','Aurangabad','Nagpur','Thane','Solapur','Kolhapur'];
const cities    = ['Pune','Mumbai','Nashik','Aurangabad','Nagpur','Thane','Solapur','Kolhapur'];
const pincodes  = ['411001','411002','411005','411014','411028','411033','400001','422001'];
const empTypes  = ['individual','contractor','farmer','business'];
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
  const categories = await Category.insertMany(
    categoriesData.map(c => ({ ...c, nameGu: c.nameEn, isActive: true }))
  );
  console.log(`✅ ${categories.length} Categories`);

  // catMap: nameEn → _id
  const catMap = {};
  categories.forEach(c => { catMap[c.nameEn] = c._id; });
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

  // 3. ADMIN
  await User.create({
    name:'Super Admin', phone:'9999999999', email:'admin@digitalkamnaka.in',
    password: await hashPass('Admin@1234'),
    role:'admin', language:'mr', isVerified:true, isActive:true,
  });
  console.log('✅ 1 Admin');

  // 4. WORKERS — 5 per category (60 total)
  const workerPassword = await hashPass('Worker@123');
  const workerUsers = [];
  const workers     = [];

  for (const [catName, wList] of Object.entries(workersByCat)) {
    const catId = catMap[catName];
    if (!catId) { console.warn(`⚠️  Category not found: ${catName}`); continue; }

    for (const wd of wList) {
      const coords = cityCoords[wd.city] || cityCoords['Pune'];
      const lat = parseFloat((coords.lat + (Math.random()-0.5)*0.15).toFixed(6));
      const lng = parseFloat((coords.lng + (Math.random()-0.5)*0.15).toFixed(6));

      const u = await User.create({
        name:wd.name, phone:wd.phone, language:pick(langs),
        password:workerPassword, role:'worker',
        isVerified:true, isActive:true,
      });
      workerUsers.push(u);

      const w = await Worker.create({
        userId:u._id, dailyRate:wd.rate, experienceYrs:wd.exp, bio:wd.bio,
        totalJobs:wd.jobs, avgRating:wd.rating,
        isAvailable:Math.random()>0.3, isVerified:true,
        city:wd.city, district:wd.district, state:'Maharashtra',
        pincode:pick(pincodes), address:`${rand(1,999)} Main Naka`,
        totalEarnings:wd.rate*wd.jobs*0.9,
        latitude:lat, longitude:lng, location:geoPoint(lat,lng),
      });
      workers.push(w);

      // FIXED: skill linked to correct category
      await WorkerSkill.create({
        workerId:w._id, categoryId:catId,
        level:wd.level, yearsInSkill:wd.exp,
      });
    }
    console.log(`  ✅ ${catName} — 5 workers`);
  }
  console.log(`✅ ${workers.length} Workers total`);

  // 5. AVAILABILITY (one per worker)
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

  // 6. EMPLOYERS (20)
  const employerPassword = await hashPass('Employer@123');
  const employerUsers = [];
  const employers     = [];
  for (let i = 0; i < employerNames.length; i++) {
    const { lat, lng } = puneGPS();
    const u = await User.create({
      name:employerNames[i], phone:employerPhones[i],
      password:employerPassword,
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

  // 7. SUBSCRIPTIONS (20)
  const planDefs = [
    {plan:'free',   price:0,    postsAllowed:3},
    {plan:'basic',  price:299,  postsAllowed:15},
    {plan:'pro',    price:799,  postsAllowed:-1},
    {plan:'premium',price:1999, postsAllowed:-1},
  ];
  const subDocs = employers.map((e, i) => {
    const p = planDefs[i % planDefs.length];
    const start = new Date();
    const end = new Date(); end.setMonth(end.getMonth()+1);
    return { employerId:e._id, plan:p.plan, price:p.price,
      postsAllowed:p.postsAllowed,
      postsUsed:rand(0, p.postsAllowed===-1?10:p.postsAllowed),
      startDate:start, endDate:end, isActive:true };
  });
  await Subscription.insertMany(subDocs);
  console.log(`✅ ${subDocs.length} Subscriptions`);

  // 8. JOB POSTS (20)
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
    const jobDate = new Date(); jobDate.setDate(jobDate.getDate()+rand(1,30));
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

  // 9. BOOKINGS (20)
  const bkStatuses = ['pending','accepted','started','completed','completed','completed','cancelled','rejected'];
  const bookings = [];
  for (let i = 0; i < 20; i++) {
    const w = workers[i % workers.length];
    const e = employers[i % employers.length];
    const jp = jobPosts[i % jobPosts.length];
    const status = pick(bkStatuses);
    const agreedRate = rand(300,1200);
    const totalDays  = rand(1,5);
    const totalAmount = agreedRate * totalDays;
    const startDate = new Date(); startDate.setDate(startDate.getDate()-rand(1,30));
    const b = await Booking.create({
      jobPostId:i%3===0?jp._id:null,
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

  // 10. PAYMENTS (20)
  const payMethods = ['cash','upi','card','netbanking'];
  const payments = [];
  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    const done = b.status==='completed';
    const fee  = parseFloat((b.totalAmount*0.05).toFixed(2));
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

  // 11. RATINGS
  const completedB = bookings.filter(b => b.status==='completed');
  const ratings = [];
  for (let i = 0; i < completedB.length; i++) {
    const b = completedB[i];
    const wUser = workerUsers[i%workerUsers.length];
    const eUser = employerUsers[i%employerUsers.length];
    ratings.push(await Rating.create({
      bookingId:b._id, ratedBy:eUser._id, ratedTo:wUser._id,
      roleRatedTo:'worker', score:rand(3,5),
      review:pick(['खूप चांगले काम केले','वेळेत आले','मेहनती कामगार','पुन्हा बोलावणार',null]),
      isVisible:true,
    }));
    if (i%2===0) ratings.push(await Rating.create({
      bookingId:b._id, ratedBy:wUser._id, ratedTo:eUser._id,
      roleRatedTo:'employer', score:rand(3,5),
      review:pick(['चांगले मालक','वेळेवर पैसे दिले','चांगले वागणूक',null]),
      isVisible:true,
    }));
  }
  console.log(`✅ ${ratings.length} Ratings`);

  // 12. NOTIFICATIONS (20)
  const notifTypes = ['booking_request','booking_accepted','booking_completed','payment_received','new_rating','urgent_job_nearby','system'];
  const notifDocs = [];
  for (let i = 0; i < 20; i++) {
    const u = i%2===0?workerUsers[i%workerUsers.length]:employerUsers[i%employerUsers.length];
    notifDocs.push({
      userId:u._id, type:pick(notifTypes),
      titleMr:'नवीन सूचना', titleHi:'नई सूचना', titleEn:'New Notification',
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

  // 13. DISPUTES (5)
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
  console.log(`👷 Workers:       ${workers.length} (5 per category)`);
  console.log(`🏢 Employers:     ${employers.length}`);
  console.log(`📅 Availability:  ${availDocs.length}`);
  console.log(`💼 JobPosts:      ${jobPosts.length}`);
  console.log(`📋 Bookings:      ${bookings.length}`);
  console.log(`💰 Payments:      ${payments.length}`);
  console.log(`⭐ Ratings:       ${ratings.length}`);
  console.log(`🔔 Notifications: ${notifDocs.length}`);
  console.log(`📝 Subscriptions: ${subDocs.length}`);
  console.log(`⚖️  Disputes:      ${dispDocs.length}`);
  console.log('════════════════════════════════════════');
  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('   Admin    → 9999999999 | Admin@1234');
  console.log('   Worker   → 8800000001 | Worker@123');
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