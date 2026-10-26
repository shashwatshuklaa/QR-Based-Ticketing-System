const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Event = require('../models/Event');
const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/qr-ticketing';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);

    // 1. Seed Sample Event
    let event = await Event.findOne();
    if (!event) {
      event = await Event.create({
        name: 'TechCon 2026',
        description: 'The premier annual developer conference featuring AI, web systems, and cloud architecture.',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        venue: 'Grand Convention Hall, Bangalore',
        ticketPrice: 0, // Free event
        maxCapacity: 500,
        isActive: true,
      });
      console.log('✓ Sample event created: TechCon 2026');
    } else {
      console.log(`✓ Active event exists: ${event.name}`);
    }

    // 2. Check administrator accounts status
    const superAdminCount = await SuperAdmin.countDocuments();
    const adminCount = await Admin.countDocuments();

    if (superAdminCount === 0 && adminCount === 0) {
      console.log('\nℹ No administrator accounts currently exist in the database.');
      console.log('  To create an administrator account securely, run:');
      console.log('    npm run create-admin\n');
    } else {
      console.log(`✓ Administrator accounts present (${superAdminCount} super admin, ${adminCount} staff admin).`);
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
}

seed();
