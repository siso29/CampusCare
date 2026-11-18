import 'dotenv/config';
import { hash } from '@node-rs/argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/campuscare';

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding CampusCare Database ---');

  // 1. Seed University
  const university = await prisma.university.upsert({
    where: { code: 'DDU' },
    update: {},
    create: {
      name: 'Dire Dawa University',
      code: 'DDU',
      slug: 'dire-dawa-university',
      domain: 'ddu.edu.et',
      isActive: true,
    },
  });
  console.log(`University seeded: ${university.name} (${university.code})`);

  // 2. Seed Campuses
  const mainCampus = await prisma.campus.upsert({
    where: {
      universityId_code: {
        universityId: university.id,
        code: 'MAIN',
      },
    },
    update: {},
    create: {
      universityId: university.id,
      name: 'Main Campus',
      code: 'MAIN',
      location: 'Dire Dawa, Eastern Ethiopia',
      isActive: true,
    },
  });

  const iotCampus = await prisma.campus.upsert({
    where: {
      universityId_code: {
        universityId: university.id,
        code: 'IOT',
      },
    },
    update: {},
    create: {
      universityId: university.id,
      name: 'Institute of Technology (IoT) Campus',
      code: 'IOT',
      location: 'Dire Dawa, Gende Kore',
      isActive: true,
    },
  });
  console.log('Campuses seeded: Main Campus, IoT Campus');

  // 3. Seed Buildings
  const buildingsData = [
    {
      campusId: mainCampus.id,
      name: 'Block 01 Men Dormitory',
      code: 'DORM-B01',
      floors: 4,
      type: 'DORMITORY',
    },
    {
      campusId: mainCampus.id,
      name: 'Block 02 Women Dormitory',
      code: 'DORM-B02',
      floors: 4,
      type: 'DORMITORY',
    },
    {
      campusId: mainCampus.id,
      name: 'Central University Library',
      code: 'LIB-01',
      floors: 3,
      type: 'LIBRARY',
    },
    {
      campusId: mainCampus.id,
      name: 'Administration Building',
      code: 'ADMIN-01',
      floors: 2,
      type: 'ADMINISTRATIVE',
    },
    {
      campusId: iotCampus.id,
      name: 'Technology Complex Block A',
      code: 'TECH-A',
      floors: 4,
      type: 'CLASSROOM',
    },
    {
      campusId: iotCampus.id,
      name: 'ICT Data Center & Computing Labs',
      code: 'ICT-01',
      floors: 2,
      type: 'LABORATORY',
    },
  ];

  const buildings: Record<string, string> = {};
  for (const b of buildingsData) {
    const building = await prisma.building.upsert({
      where: {
        campusId_code: {
          campusId: b.campusId,
          code: b.code,
        },
      },
      update: {},
      create: b,
    });
    buildings[b.code] = building.id;
  }
  console.log(`Buildings seeded: ${Object.keys(buildings).length} buildings`);

  // 4. Seed Departments
  const departmentsData = [
    {
      universityId: university.id,
      name: 'Facilities & Campus Maintenance',
      code: 'FACILITIES',
      type: 'GENERAL',
    },
    {
      universityId: university.id,
      name: 'Electrical Engineering & Power Services',
      code: 'ELECTRICAL',
      type: 'ELECTRICAL',
    },
    {
      universityId: university.id,
      name: 'Plumbing & Water Sanitation',
      code: 'PLUMBING',
      type: 'PLUMBING',
    },
    {
      universityId: university.id,
      name: 'Carpentry, Furniture & Metal Works',
      code: 'CARPENTRY',
      type: 'CARPENTRY',
    },
  ];

  const departments: Record<string, string> = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: {
        universityId_code: {
          universityId: d.universityId,
          code: d.code,
        },
      },
      update: {},
      create: d,
    });
    departments[d.code] = dept.id;
  }
  console.log(`Departments seeded: ${Object.keys(departments).length} departments`);

  // 5. Seed Maintenance Categories
  const categoriesData = [
    {
      name: 'Water Supply',
      code: 'WATER_SUPPLY',
      description: 'Clean drinking water, borehole pumps, water tanks and distribution',
    },
    {
      name: 'Electricity',
      code: 'ELECTRICITY',
      description: 'Power outages, circuit breakers, lighting fixtures, generators and wiring',
    },
    {
      name: 'Plumbing',
      code: 'PLUMBING',
      description: 'Pipes, drainage, blockages, leaks, and sanitary fittings',
    },
    {
      name: 'Toilets / Showers',
      code: 'TOILETS_SHOWERS',
      description: 'Dormitory and classroom bathroom fixtures, flushes, and shower heads',
    },
    {
      name: 'Cleaning & Sanitation',
      code: 'CLEANING',
      description: 'Waste management, janitorial supplies, deep cleaning and fumigation',
    },
    {
      name: 'Classroom Equipment',
      code: 'CLASSROOM_EQUIPMENT',
      description: 'Projectors, whiteboards, podiums, and AV systems',
    },
    {
      name: 'Doors & Windows',
      code: 'DOORS_WINDOWS',
      description: 'Door locks, handles, hinges, broken glass panes, and window frames',
    },
    {
      name: 'Furniture',
      code: 'FURNITURE',
      description: 'Student desks, lecture hall chairs, dormitory beds, and study tables',
    },
    {
      name: 'Dormitory Infrastructure',
      code: 'DORMITORY_INFRASTRUCTURE',
      description: 'Hostel corridors, balconies, roof leaks, stairs, and common rooms',
    },
    {
      name: 'Campus Infrastructure',
      code: 'CAMPUS_INFRASTRUCTURE',
      description: 'Streetlights, walkways, security fences, sports fields, and drainage canals',
    },
    {
      name: 'Other',
      code: 'OTHER',
      description: 'General maintenance issues not categorized above',
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const category = await prisma.maintenanceCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    categories[c.code] = category.id;
  }
  console.log(`Categories seeded: ${Object.keys(categories).length} categories`);

  // 6. Seed Users
  const argon2Options = {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  };

  const adminPasswordHash = await hash('Admin123!', argon2Options);
  const staffPasswordHash = await hash('Staff123!', argon2Options);
  const studentPasswordHash = await hash('Student123!', argon2Options);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ddu.edu.et' },
    update: {},
    create: {
      universityId: university.id,
      departmentId: departments['FACILITIES'],
      email: 'admin@ddu.edu.et',
      passwordHash: adminPasswordHash,
      firstName: 'Alemayehu',
      lastName: 'Kebede',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+251911000001',
      notificationPreference: {
        create: {
          emailNotifications: true,
          inAppNotifications: true,
          statusChangeAlerts: true,
          assignmentAlerts: true,
          commentAlerts: true,
        },
      },
    },
  });

  const staffElectrical = await prisma.user.upsert({
    where: { email: 'staff.electrical@ddu.edu.et' },
    update: {},
    create: {
      universityId: university.id,
      departmentId: departments['ELECTRICAL'],
      email: 'staff.electrical@ddu.edu.et',
      passwordHash: staffPasswordHash,
      firstName: 'Tewodros',
      lastName: 'Bekele',
      role: 'MAINTENANCE_STAFF',
      status: 'ACTIVE',
      phone: '+251911000002',
      notificationPreference: {
        create: {
          emailNotifications: true,
          inAppNotifications: true,
          statusChangeAlerts: true,
          assignmentAlerts: true,
          commentAlerts: true,
        },
      },
    },
  });

  const staffPlumbing = await prisma.user.upsert({
    where: { email: 'staff.plumbing@ddu.edu.et' },
    update: {},
    create: {
      universityId: university.id,
      departmentId: departments['PLUMBING'],
      email: 'staff.plumbing@ddu.edu.et',
      passwordHash: staffPasswordHash,
      firstName: 'Dawit',
      lastName: 'Haile',
      role: 'MAINTENANCE_STAFF',
      status: 'ACTIVE',
      phone: '+251911000003',
      notificationPreference: {
        create: {
          emailNotifications: true,
          inAppNotifications: true,
          statusChangeAlerts: true,
          assignmentAlerts: true,
          commentAlerts: true,
        },
      },
    },
  });

  const studentAbebe = await prisma.user.upsert({
    where: { email: 'student.abebe@ddu.edu.et' },
    update: {},
    create: {
      universityId: university.id,
      email: 'student.abebe@ddu.edu.et',
      passwordHash: studentPasswordHash,
      firstName: 'Abebe',
      lastName: 'Tadesse',
      role: 'STUDENT',
      status: 'ACTIVE',
      studentId: 'DDU/1234/14',
      phone: '+251922000001',
      notificationPreference: {
        create: {
          emailNotifications: true,
          inAppNotifications: true,
          statusChangeAlerts: true,
          assignmentAlerts: true,
          commentAlerts: true,
        },
      },
    },
  });

  const studentChala = await prisma.user.upsert({
    where: { email: 'student.chala@ddu.edu.et' },
    update: {},
    create: {
      universityId: university.id,
      email: 'student.chala@ddu.edu.et',
      passwordHash: studentPasswordHash,
      firstName: 'Chala',
      lastName: 'Girma',
      role: 'STUDENT',
      status: 'ACTIVE',
      studentId: 'DDU/5678/14',
      phone: '+251922000002',
      notificationPreference: {
        create: {
          emailNotifications: true,
          inAppNotifications: true,
          statusChangeAlerts: true,
          assignmentAlerts: true,
          commentAlerts: true,
        },
      },
    },
  });
  console.log('Users seeded: 1 Admin, 2 Staff, 2 Students');

  // 7. Seed Initial Maintenance Requests
  const request1 = await prisma.maintenanceRequest.upsert({
    where: { requestNumber: 'REQ-DDU-2026-0001' },
    update: {},
    create: {
      requestNumber: 'REQ-DDU-2026-0001',
      universityId: university.id,
      campusId: mainCampus.id,
      buildingId: buildings['DORM-B01'],
      departmentId: departments['PLUMBING'],
      categoryId: categories['WATER_SUPPLY'],
      reporterId: studentAbebe.id,
      title: 'Water Pipe Leak on 2nd Floor Corridor',
      description: 'Major leak leaking through the ceiling into room 204. Water is pooling on the floor.',
      locationDetails: 'Block 01, 2nd Floor, between rooms 203 and 204',
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignments: {
        create: {
          staffId: staffPlumbing.id,
          assignedById: adminUser.id,
          status: 'ASSIGNED',
          notes: 'Please inspect the main riser valve and replace damaged pipe joint.',
        },
      },
      statusHistories: {
        createMany: {
          data: [
            {
              actorId: studentAbebe.id,
              fromStatus: null,
              toStatus: 'SUBMITTED',
              reason: 'Initial submission by student',
            },
            {
              actorId: adminUser.id,
              fromStatus: 'SUBMITTED',
              toStatus: 'APPROVED',
              reason: 'Reviewed and confirmed critical plumbing issue',
            },
            {
              actorId: adminUser.id,
              fromStatus: 'APPROVED',
              toStatus: 'ASSIGNED',
              reason: 'Assigned to plumbing maintenance team',
            },
          ],
        },
      },
      comments: {
        create: {
          authorId: adminUser.id,
          message: 'Plumbing team dispatched. Main valve shutoff pending.',
          isInternal: false,
        },
      },
    },
  });

  const request2 = await prisma.maintenanceRequest.upsert({
    where: { requestNumber: 'REQ-DDU-2026-0002' },
    update: {},
    create: {
      requestNumber: 'REQ-DDU-2026-0002',
      universityId: university.id,
      campusId: iotCampus.id,
      buildingId: buildings['TECH-A'],
      departmentId: departments['ELECTRICAL'],
      categoryId: categories['ELECTRICITY'],
      reporterId: studentChala.id,
      title: 'Projector Power Socket Sparking in Room 102',
      description: 'The wall socket connected to the ceiling projector sparked and emitted smoke during lecture.',
      locationDetails: 'Technology Complex Block A, Ground Floor, Lecture Hall 102',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      assignments: {
        create: {
          staffId: staffElectrical.id,
          assignedById: adminUser.id,
          status: 'IN_PROGRESS',
          notes: 'Immediate breaker isolation required before rewiring.',
          acknowledgedAt: new Date(),
        },
      },
      statusHistories: {
        createMany: {
          data: [
            {
              actorId: studentChala.id,
              fromStatus: null,
              toStatus: 'SUBMITTED',
              reason: 'Electrical hazard reported',
            },
            {
              actorId: adminUser.id,
              fromStatus: 'SUBMITTED',
              toStatus: 'ASSIGNED',
              reason: 'Fast-tracked emergency electrical dispatch',
            },
            {
              actorId: staffElectrical.id,
              fromStatus: 'ASSIGNED',
              toStatus: 'IN_PROGRESS',
              reason: 'On-site isolation initiated',
            },
          ],
        },
      },
    },
  });
  console.log(`Requests seeded: ${request1.requestNumber}, ${request2.requestNumber}`);

  // 8. Seed Initial System Settings
  await prisma.systemSetting.upsert({
    where: {
      universityId_key: {
        universityId: university.id,
        key: 'ALLOW_STUDENT_EMERGENCY_REPORTS',
      },
    },
    update: {},
    create: {
      universityId: university.id,
      key: 'ALLOW_STUDENT_EMERGENCY_REPORTS',
      value: 'true',
      description: 'Allows students to tag requests with URGENT priority',
    },
  });

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
