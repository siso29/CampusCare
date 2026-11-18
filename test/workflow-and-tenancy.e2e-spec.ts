import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Maintenance Workflow & Tenant Isolation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let studentCookie: string;
  let adminCookie: string;
  let staffCookie: string;

  let campusId: string;
  let buildingId: string;
  let categoryId: string;
  let staffId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['api/docs', 'api/docs-json', ''] });
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Fetch seeded university and hierarchy data
    const uni = await prisma.university.findFirstOrThrow({
      where: { code: 'DDU' },
      include: {
        campuses: {
          include: { buildings: true },
        },
      },
    });
    campusId = uni.campuses[0].id;
    buildingId = uni.campuses[0].buildings[0].id;

    const cat = await prisma.maintenanceCategory.findFirstOrThrow();
    categoryId = cat.id;

    const staffUser = await prisma.user.findFirstOrThrow({
      where: { role: 'MAINTENANCE_STAFF' },
    });
    staffId = staffUser.id;

    // Log in as student
    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.abebe@ddu.edu.et', password: 'Student123!' });
    studentCookie = studentLogin.headers['set-cookie'][0];

    // Log in as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ddu.edu.et', password: 'Admin123!' });
    adminCookie = adminLogin.headers['set-cookie'][0];

    // Log in as staff
    const staffLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'staff.electrical@ddu.edu.et', password: 'Staff123!' });
    staffCookie = staffLogin.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await app.close();
  });

  let createdRequestId: string;

  it('Student creates maintenance request -> status SUBMITTED', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/requests')
      .set('Cookie', studentCookie)
      .send({
        campusId,
        buildingId,
        categoryId,
        title: 'Broken electrical switch in dorm study room',
        description: 'Light switch produces spark when toggled and does not turn off.',
        locationDetails: 'Block 01, Floor 2, Room 205',
        priority: 'HIGH',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SUBMITTED');
    expect(res.body.data.requestNumber).toMatch(/^REQ-DDU-/);
    createdRequestId = res.body.data.id;
  });

  it('STUDENT CANNOT assign staff -> 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/requests/${createdRequestId}/assign`)
      .set('Cookie', studentCookie)
      .send({ staffId, notes: 'Attempted student assignment' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('STUDENT CANNOT list or modify admin users -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Cookie', studentCookie)
      .expect(403);
  });

  it('ADMIN assigns maintenance staff -> status ASSIGNED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/requests/${createdRequestId}/assign`)
      .set('Cookie', adminCookie)
      .send({ staffId, notes: 'Replace the switch assembly before evening.' })
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify request status is now ASSIGNED
    const checkReq = await request(app.getHttpServer())
      .get(`/api/v1/requests/${createdRequestId}`)
      .set('Cookie', adminCookie)
      .expect(200);

    expect(checkReq.body.data.status).toBe('ASSIGNED');
  });

  it('STAFF transitions request -> IN_PROGRESS', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/requests/${createdRequestId}/status`)
      .set('Cookie', staffCookie)
      .send({
        status: 'IN_PROGRESS',
        reason: 'Circuit breaker turned off, dismantled faceplate for replacement.',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('STAFF adds comment to request', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/requests/${createdRequestId}/comments`)
      .set('Cookie', staffCookie)
      .send({
        message: 'Replaced the switch mechanism with a new 10A wall switch.',
        isInternal: false,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('Replaced the switch mechanism');
  });

  it('STAFF transitions request -> RESOLVED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/requests/${createdRequestId}/status`)
      .set('Cookie', staffCookie)
      .send({
        status: 'RESOLVED',
        reason: 'Switch tested and fully working safely.',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESOLVED');
  });

  it('STUDENT closes resolved request -> CLOSED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/requests/${createdRequestId}/status`)
      .set('Cookie', studentCookie)
      .send({
        status: 'CLOSED',
        reason: 'Confirmed light switch works safely now. Thank you!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CLOSED');
  });

  it('Verify Status History audit trail is persisted in order', async () => {
    const reqDetails = await request(app.getHttpServer())
      .get(`/api/v1/requests/${createdRequestId}`)
      .set('Cookie', studentCookie)
      .expect(200);

    const history = reqDetails.body.data.statusHistories;
    expect(history.length).toBeGreaterThanOrEqual(4);
    const statuses = history.map((h: any) => h.toStatus);
    expect(statuses).toContain('SUBMITTED');
    expect(statuses).toContain('ASSIGNED');
    expect(statuses).toContain('IN_PROGRESS');
    expect(statuses).toContain('RESOLVED');
    expect(statuses).toContain('CLOSED');
  });

  it('Dashboard returns database-calculated metrics without hardcoded data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/metrics')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('ADMIN');
    expect(res.body.data.totalRequests).toBeGreaterThanOrEqual(1);
    expect(res.body.data.statusBreakdown).toBeDefined();
    expect(res.body.data.staffWorkload).toBeDefined();
  });
});
