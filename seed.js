const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/User');
const Unit = require('./models/Unit');
const MaintenanceRequest = require('./models/MaintenanceRequest');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/property_management');
    console.log('Database connected for seeding...');

    // 1. Clear existing collection data
    await User.deleteMany({});
    await Unit.deleteMany({});
    await MaintenanceRequest.deleteMany({});

    // 2. Hash passwords
    const managerPassword = await bcrypt.hash('manager123', 10);
    const contractorPassword = await bcrypt.hash('contractor123', 10);

    // 3. Create Demo Users
    const manager = await User.create({
      name: 'Property Manager',
      email: 'manager@example.com',
      passwordHash: managerPassword,
      role: 'PROPERTY_MANAGER'
    });

    const contractor = await User.create({
      name: 'Bob Contractor',
      email: 'contractor@example.com',
      passwordHash: contractorPassword,
      role: 'CONTRACTOR'
    });

    // 4. Create Demo Rental Units
    const units = await Unit.insertMany([
      { unitNumber: '101', address: '100 Main St, Apt 101', monthlyRent: 1500, tenantName: 'Alice Johnson', isArchived: false },
      { unitNumber: '102', address: '100 Main St, Apt 102', monthlyRent: 1650, tenantName: 'Bob Williams', isArchived: false },
      { unitNumber: '201', address: '100 Main St, Apt 201', monthlyRent: 1800, tenantName: 'Carol Davis', isArchived: false },
      { unitNumber: '202', address: '100 Main St, Apt 202', monthlyRent: 1750, tenantName: 'David Miller', isArchived: false }
    ]);

    // 5. Create Demo Maintenance Requests linked to Units & Users
// 5. Create Demo Maintenance Requests linked to Units & Users
    await MaintenanceRequest.insertMany([
      {
        unitId: units[0]._id, // <-- Updated from "unit" to "unitId"
        title: 'Leaking Sink',
        description: 'Kitchen sink pipe is leaking underneath cabinet.',
        status: 'Reported',
        priority: 'High',
        createdBy: manager._id
      },
      {
        unitId: units[1]._id, // <-- Updated from "unit" to "unitId"
        title: 'AC Unit Noise',
        description: 'Loud rattling noise when AC compressor turns on.',
        status: 'Scheduled',
        priority: 'Medium',
        assignedContractor: contractor._id,
        createdBy: manager._id
      },
      {
        unitId: units[2]._id, // <-- Updated from "unit" to "unitId"
        title: 'Broken Door Lock',
        description: 'Front deadbolt gets stuck occasionally.',
        status: 'Resolved',
        priority: 'Low',
        resolvedAt: new Date(),
        createdBy: manager._id
      }
    ]);

    console.log('\n SUCCESS! Database seeded with Users, Units, and Requests.');
    console.log('----------------------------------------------------');
    console.log('PROPERTY MANAGER:');
    console.log('  Email:    manager@example.com');
    console.log('  Password: manager123\n');
    console.log('CONTRACTOR:');
    console.log('  Email:    contractor@example.com');
    console.log('  Password: contractor123');
    console.log('----------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error(' Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();