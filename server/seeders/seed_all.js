/**
 * seeders/seed_all.js — Complete Seed Data for All Tables
 * Run: node seeders/seed_all.js
 * Creates 10 entries per table with realistic Maharashtra data
 * Author: Digital Kaam Naka Dev Team
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const {
  User, Worker, Employer, Category, WorkerSkill,
  Availability, JobPost, Booking, Payment, Rating, Notification
} = require('../models');

const seed = async () => {
  try {
    console.log('🌱 Seeding started...\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // ================================================================
    // STEP 1: USERS (5 Workers + 5 Employers)
    // ================================================================
    console.log('👤 Creating Users...');
    const hashedPass = await bcrypt.hash('Test@1234', 12);

    const usersData = [
      // Workers
      { name: 'रमेश कांबळे',   phone: '9876543201', role: 'worker',   language: 'mr' },
      { name: 'सुनील पवार',    phone: '9876543202', role: 'worker',   language: 'mr' },
      { name: 'अनिता जाधव',   phone: '9876543203', role: 'worker',   language: 'mr' },
      { name: 'महेश शिंदे',   phone: '9876543204', role: 'worker',   language: 'hi' },
      { name: 'प्रिया मोरे',   phone: '9876543205', role: 'worker',   language: 'mr' },
      // Employers
      { name: 'किरण शेट्टी',   phone: '9876543206', role: 'employer', language: 'mr' },
      { name: 'सुषमा देशमुख', phone: '9876543207', role: 'employer', language: 'mr' },
      { name: 'राजेश गायकवाड', phone: '9876543208', role: 'employer', language: 'hi' },
      { name: 'मीना कुलकर्णी', phone: '9876543209', role: 'employer', language: 'mr' },
      { name: 'अजय नाईक',     phone: '9876543210', role: 'employer', language: 'en' },
    ];

    const users = [];
    for (const u of usersData) {
      const [user] = await User.upsert({
        ...u,
        password: hashedPass,
        isVerified: true,
        isActive: true,
        lastLogin: new Date(),
      }, { returning: true });
      users.push(user);
      process.stdout.write(`  ✅ ${u.name} (${u.role})\n`);
    }

    const workerUsers   = users.filter(u => u.role === 'worker');
    const employerUsers = users.filter(u => u.role === 'employer');

    // ================================================================
    // STEP 2: WORKERS
    // ================================================================
    console.log('\n👷 Creating Worker Profiles...');
    const workerData = [
      { dailyRate: 550, city: 'पुणे',     district: 'Pune',       experienceYrs: 5,  bio: 'बांधकाम आणि रंगकाम मध्ये अनुभवी', lat: 18.5204, lng: 73.8567, isAvailable: true  },
      { dailyRate: 480, city: 'नाशिक',    district: 'Nashik',     experienceYrs: 3,  bio: 'शेतीकाम आणि loading/unloading मध्ये तज्ञ', lat: 19.9975, lng: 73.7898, isAvailable: true  },
      { dailyRate: 400, city: 'पुणे',     district: 'Pune',       experienceYrs: 2,  bio: 'घरकाम आणि सफाई मध्ये अनुभव आहे', lat: 18.5300, lng: 73.8600, isAvailable: false },
      { dailyRate: 620, city: 'मुंबई',    district: 'Mumbai',     experienceYrs: 8,  bio: 'विद्युत काम आणि plumbing मध्ये तज्ञ', lat: 19.0760, lng: 72.8777, isAvailable: true  },
      { dailyRate: 500, city: 'औरंगाबाद', district: 'Aurangabad', experienceYrs: 4,  bio: 'सर्व प्रकारचे घरकाम करते', lat: 19.8762, lng: 75.3433, isAvailable: true  },
    ];

    const workers = [];
    for (let i = 0; i < workerUsers.length; i++) {
      const d = workerData[i];
      const [w] = await Worker.upsert({
        userId:       workerUsers[i].id,
        dailyRate:    d.dailyRate,
        city:         d.city,
        district:     d.district,
        state:        'Maharashtra',
        experienceYrs: d.experienceYrs,
        bio:          d.bio,
        latitude:     d.lat,
        longitude:    d.lng,
        isAvailable:  d.isAvailable,
        isVerified:   true,
        totalJobs:    Math.floor(Math.random() * 50) + 5,
        avgRating:    (Math.random() * 1.5 + 3.5).toFixed(2),
        totalEarnings: Math.floor(Math.random() * 50000) + 10000,
      }, { returning: true });
      workers.push(w);
      console.log(`  ✅ ${workerUsers[i].name} — ₹${d.dailyRate}/दिवस — ${d.city}`);
    }

    // ================================================================
    // STEP 3: EMPLOYERS
    // ================================================================
    console.log('\n🏢 Creating Employer Profiles...');
    const employerData = [
      { companyName: 'शेट्टी Construction',  type: 'contractor', city: 'पुणे',      district: 'Pune'       },
      { companyName: '',                      type: 'individual', city: 'नाशिक',     district: 'Nashik'     },
      { companyName: 'गायकवाड Farms',         type: 'farmer',     city: 'सोलापूर',   district: 'Solapur'    },
      { companyName: 'कुलकर्णी Enterprises',  type: 'business',   city: 'पुणे',      district: 'Pune'       },
      { companyName: 'नाईक Events',           type: 'business',   city: 'मुंबई',     district: 'Mumbai'     },
    ];

    const employers = [];
    for (let i = 0; i < employerUsers.length; i++) {
      const d = employerData[i];
      const [e] = await Employer.upsert({
        userId:       employerUsers[i].id,
        companyName:  d.companyName,
        employerType: d.type,
        city:         d.city,
        district:     d.district,
        state:        'Maharashtra',
        avgRating:    (Math.random() * 1 + 4).toFixed(2),
        totalPosts:   Math.floor(Math.random() * 20) + 2,
        totalHires:   Math.floor(Math.random() * 15) + 1,
      }, { returning: true });
      employers.push(e);
      console.log(`  ✅ ${employerUsers[i].name} — ${d.type} — ${d.city}`);
    }

    // ================================================================
    // STEP 4: WORKER SKILLS (2 skills per worker)
    // ================================================================
    console.log('\n💼 Assigning Worker Skills...');
    const categories = await Category.findAll({ limit: 12 });

    const skillMap = [
      [0, 4],  // Worker 0: Construction + Painting
      [1, 3],  // Worker 1: Farming + Loading
      [2, 9],  // Worker 2: Household + Cleaning
      [6, 5],  // Worker 3: Electrical + Plumbing
      [2, 8],  // Worker 4: Household + Events
    ];

    const levels = ['beginner', 'experienced', 'expert'];
    for (let i = 0; i < workers.length; i++) {
      for (const catIdx of skillMap[i]) {
        if (categories[catIdx]) {
          await WorkerSkill.upsert({
            workerId:    workers[i].id,
            categoryId:  categories[catIdx].id,
            level:       levels[Math.min(Math.floor(workers[i].experienceYrs / 3), 2)],
            yearsInSkill: workers[i].experienceYrs,
          });
          console.log(`  ✅ ${workerUsers[i].name} → ${categories[catIdx].nameMr}`);
        }
      }
    }

    // ================================================================
    // STEP 5: AVAILABILITY (Today for available workers)
    // ================================================================
    console.log('\n📅 Setting Availability...');
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < workers.length; i++) {
      if (workers[i].isAvailable) {
        await Availability.upsert({
          workerId:    workers[i].id,
          date:        today,
          isAvailable: true,
          radiusKm:    25,
          latitude:    workerData[i].lat,
          longitude:   workerData[i].lng,
        });
        console.log(`  ✅ ${workerUsers[i].name} — आज उपलब्ध`);
      }
    }

    // ================================================================
    // STEP 6: JOB POSTS (2 per employer = 10 total)
    // ================================================================
    console.log('\n📋 Creating Job Posts...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const jobData = [
      { title: '3 बांधकाम कामगार हवेत',          catIdx: 0,  rate: 600, workers: 3, city: 'पुणे',      district: 'Pune',       urgent: true  },
      { title: 'शेत नांगरणीसाठी 5 कामगार',        catIdx: 1,  rate: 450, workers: 5, city: 'नाशिक',     district: 'Nashik',     urgent: false },
      { title: 'घर साफसफाईसाठी 2 कामगार',         catIdx: 2,  rate: 400, workers: 2, city: 'पुणे',      district: 'Pune',       urgent: false },
      { title: 'माल loading साठी 4 कामगार',        catIdx: 3,  rate: 500, workers: 4, city: 'मुंबई',     district: 'Mumbai',     urgent: true  },
      { title: 'घर रंगकामासाठी 2 painter हवेत',   catIdx: 4,  rate: 650, workers: 2, city: 'सोलापूर',   district: 'Solapur',    urgent: false },
      { title: 'Plumbing कामासाठी 1 तज्ञ हवा',    catIdx: 5,  rate: 700, workers: 1, city: 'पुणे',      district: 'Pune',       urgent: true  },
      { title: 'Electrical fitting साठी 2 कामगार', catIdx: 6,  rate: 750, workers: 2, city: 'नाशिक',     district: 'Nashik',     urgent: false },
      { title: 'Security guard हवा - 1 महिना',     catIdx: 7,  rate: 550, workers: 2, city: 'मुंबई',     district: 'Mumbai',     urgent: false },
      { title: 'लग्न समारंभासाठी 10 कामगार',       catIdx: 8,  rate: 500, workers: 10, city: 'औरंगाबाद', district: 'Aurangabad', urgent: true  },
      { title: 'Office cleaning साठी 3 कामगार',    catIdx: 9,  rate: 380, workers: 3, city: 'पुणे',      district: 'Pune',       urgent: false },
    ];

    const jobPosts = [];
    for (let i = 0; i < jobData.length; i++) {
      const d = jobData[i];
      const employerIdx = Math.floor(i / 2);
      const cat = categories[d.catIdx];

      const job = await JobPost.create({
        employerId:    employers[employerIdx].id,
        categoryId:    cat ? cat.id : categories[0].id,
        title:         d.title,
        description:   `${d.title} — अनुभवी व्यक्तींना प्राधान्य. वेळेवर काम करणारे हवेत.`,
        workersNeeded: d.workers,
        workersBooked: 0,
        dailyRate:     d.rate,
        jobDate:       tomorrowStr,
        endDate:       tomorrowStr,
        durationDays:  1,
        jobType:       'daily',
        city:          d.city,
        district:      d.district,
        state:         'Maharashtra',
        isUrgent:      d.urgent,
        status:        'open',
        viewsCount:    Math.floor(Math.random() * 50),
      });
      jobPosts.push(job);
      console.log(`  ✅ ${d.title} — ₹${d.rate} — ${d.city} ${d.urgent ? '🚨' : ''}`);
    }

    // ================================================================
    // STEP 7: BOOKINGS (10 bookings - different statuses)
    // ================================================================
    console.log('\n📋 Creating Bookings...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const bookingStatuses = [
      'completed', 'completed', 'completed',  // 3 completed (for rating/payment)
      'accepted',  'accepted',               // 2 accepted
      'pending',   'pending',                // 2 pending
      'started',                             // 1 started
      'cancelled',                           // 1 cancelled
      'rejected',                            // 1 rejected
    ];

    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const workerIdx   = i % workers.length;
      const employerIdx = i % employers.length;
      const status      = bookingStatuses[i];
      const rate        = workers[workerIdx].dailyRate;
      const totalAmount = parseFloat(rate) * 1;

      const isOld = ['completed', 'cancelled', 'rejected'].includes(status);
      const bookDate = isOld ? yesterdayStr : tomorrowStr;

      const booking = await Booking.create({
        jobPostId:   jobPosts[i].id,
        workerId:    workers[workerIdx].id,
        employerId:  employers[employerIdx].id,
        status,
        startDate:   bookDate,
        endDate:     bookDate,
        totalDays:   1,
        agreedRate:  rate,
        totalAmount,
        bookingNote: 'Seed data booking',
        workStartedAt:  status === 'started' || status === 'completed' ? new Date() : null,
        workEndedAt:    status === 'completed' ? new Date() : null,
        cancelReason:   status === 'cancelled' ? 'Worker unavailable' : null,
        cancelledBy:    status === 'cancelled' ? employerUsers[employerIdx].id : null,
        ratingGivenToWorker:   status === 'completed' ? true : false,
        ratingGivenToEmployer: status === 'completed' ? true : false,
      });
      bookings.push(booking);
      console.log(`  ✅ Booking #${booking.id} — ${workerUsers[workerIdx].name} ↔ ${employerUsers[employerIdx].name} — [${status}]`);
    }

    // ================================================================
    // STEP 8: PAYMENTS (for completed bookings)
    // ================================================================
    console.log('\n💰 Creating Payments...');
    const completedBookings = bookings.filter(b => b.status === 'completed');

    for (const booking of completedBookings) {
      const platformFee  = parseFloat((booking.totalAmount * 0.05).toFixed(2));
      const workerAmount = booking.totalAmount - platformFee;

      await Payment.create({
        bookingId:   booking.id,
        employerId:  booking.employerId,
        workerId:    booking.workerId,
        amount:      booking.totalAmount,
        platformFee,
        workerAmount,
        method:      'cash',
        status:      'completed',
        paidAt:      new Date(),
      });
      console.log(`  ✅ Payment for Booking #${booking.id} — ₹${booking.totalAmount} (Worker gets ₹${workerAmount})`);
    }

    // Also create pending payments for accepted bookings
    const acceptedBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'started');
    for (const booking of acceptedBookings) {
      const platformFee  = parseFloat((booking.totalAmount * 0.05).toFixed(2));
      await Payment.create({
        bookingId:   booking.id,
        employerId:  booking.employerId,
        workerId:    booking.workerId,
        amount:      booking.totalAmount,
        platformFee,
        workerAmount: booking.totalAmount - platformFee,
        method:      'cash',
        status:      'pending',
      });
      console.log(`  ✅ Pending Payment for Booking #${booking.id}`);
    }

    // ================================================================
    // STEP 9: RATINGS (for completed bookings)
    // ================================================================
    console.log('\n⭐ Creating Ratings...');
    const starScores = [5, 4, 5];

    for (let i = 0; i < completedBookings.length; i++) {
      const booking = completedBookings[i];
      const worker  = workers.find(w => w.id === booking.workerId);
      const wUser   = workerUsers.find(u => u.id === worker?.userId);
      const eIdx    = employers.findIndex(e => e.id === booking.employerId);
      const eUser   = employerUsers[eIdx];

      const reviews = [
        'खूप चांगले काम केले! वेळेवर आले आणि काम नीट केले.',
        'उत्कृष्ट काम! पुन्हा hire करणार.',
        'खूप मेहनती आहेत. शिफारस करतो.',
      ];

      // Employer rates Worker
      await Rating.create({
        bookingId:  booking.id,
        ratedBy:    eUser.id,
        ratedTo:    wUser.id,
        roleRatedTo: 'worker',
        score:      starScores[i],
        review:     reviews[i],
        isVisible:  true,
      });

      // Worker rates Employer
      await Rating.create({
        bookingId:  booking.id,
        ratedBy:    wUser.id,
        ratedTo:    eUser.id,
        roleRatedTo: 'employer',
        score:      starScores[i],
        review:     'मालक चांगले आहेत. वेळेवर पैसे दिले.',
        isVisible:  true,
      });

      // Update worker avgRating
      await worker.update({ avgRating: starScores[i] });

      console.log(`  ✅ ${eUser.name} → ${wUser.name}: ${'★'.repeat(starScores[i])}`);
    }

    // ================================================================
    // STEP 10: NOTIFICATIONS
    // ================================================================
    console.log('\n🔔 Creating Notifications...');
    const notifData = [
      { userId: workerUsers[0].id, type: 'booking_request',   titleMr: 'नवीन Booking Request!', messageMr: 'किरण शेट्टी यांनी booking request पाठवली — ₹550/दिवस' },
      { userId: workerUsers[1].id, type: 'booking_accepted',  titleMr: 'Booking Accept झाली!',  messageMr: 'तुमची booking accept झाली. उद्या काम सुरू करा.' },
      { userId: employerUsers[0].id, type: 'booking_accepted', titleMr: 'Worker ने Accept केले!', messageMr: 'रमेश कांबळे यांनी तुमची booking accept केली.' },
      { userId: workerUsers[2].id, type: 'payment_received',  titleMr: 'Payment मिळाले! 💰',    messageMr: '₹380 तुमच्या खात्यात जमा झाले.' },
      { userId: employerUsers[1].id, type: 'new_rating',      titleMr: 'नवीन Rating!',          messageMr: 'सुनील पवार यांनी तुम्हाला ⭐⭐⭐⭐⭐ दिले.' },
      { userId: workerUsers[3].id, type: 'urgent_job_nearby', titleMr: '🚨 तातडीचे काम!',        messageMr: 'जवळ तातडीचे काम उपलब्ध आहे — ₹750/दिवस' },
      { userId: workerUsers[0].id, type: 'booking_completed', titleMr: 'काम पूर्ण झाले! 🎉',    messageMr: 'तुमचे काम पूर्ण झाले. Rating द्या.' },
      { userId: employerUsers[2].id, type: 'system',          titleMr: 'Digital Kaam Naka',      messageMr: 'तुमचे profile verified झाले! आता काम टाका.' },
      { userId: workerUsers[4].id, type: 'verification_done', titleMr: 'Profile Verified! ✅',   messageMr: 'तुमचा Aadhar verified झाला. Badge मिळाला!' },
      { userId: employerUsers[3].id, type: 'booking_request', titleMr: 'Worker Available!',       messageMr: 'तुम्ही शोधलेला worker आता उपलब्ध आहे.' },
    ];

    for (const n of notifData) {
      await Notification.create({
        userId:    n.userId,
        type:      n.type,
        titleMr:   n.titleMr,
        titleHi:   n.titleMr,
        titleEn:   n.titleMr,
        messageMr: n.messageMr,
        messageHi: n.messageMr,
        messageEn: n.messageMr,
        channel:   'app',
        isRead:    Math.random() > 0.5,
      });
      console.log(`  ✅ ${n.titleMr}`);
    }

    // ================================================================
    // DONE — Summary
    // ================================================================
    console.log('\n');
    console.log('='.repeat(60));
    console.log('🎉 SEED DATA COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📱 LOGIN CREDENTIALS (OTP नाही लागणार — DB मध्ये आहेत):');
    console.log('\n👷 WORKERS:');
    workerUsers.forEach((u, i) => {
      console.log(`  📞 ${u.phone} — ${u.name} — ₹${workerData[i].dailyRate}/दिवस — ${workerData[i].city}`);
    });
    console.log('\n🏢 EMPLOYERS:');
    employerUsers.forEach((u, i) => {
      console.log(`  📞 ${u.phone} — ${u.name} — ${employerData[i].city}`);
    });
    console.log('\n💡 TIP: Login → Phone टाका → OTP server terminal मध्ये दिसेल');
    console.log('='.repeat(60));
    console.log('\n📊 Data Summary:');
    console.log(`  Users:         ${users.length}`);
    console.log(`  Workers:       ${workers.length}`);
    console.log(`  Employers:     ${employers.length}`);
    console.log(`  Job Posts:     ${jobPosts.length}`);
    console.log(`  Bookings:      ${bookings.length}`);
    console.log(`  Payments:      ${completedBookings.length + acceptedBookings.length}`);
    console.log(`  Ratings:       ${completedBookings.length * 2}`);
    console.log(`  Notifications: ${notifData.length}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seed();
