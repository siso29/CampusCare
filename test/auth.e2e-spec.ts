import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['api/docs', 'api/docs-json', ''] });
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testEmail = `student.test.${Date.now()}@ddu.edu.et`;
  let sessionCookie: string;

  it('POST /api/v1/auth/register -> should register new student', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Student',
        universityCode: 'DDU',
        studentId: 'DDU/9999/14',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.role).toBe('STUDENT');
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('POST /api/v1/auth/register -> should reject duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        firstName: 'Duplicate',
        lastName: 'Student',
        universityCode: 'DDU',
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login -> should reject wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login -> should authenticate and return session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.sessionToken).toBeDefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieString = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
    expect(cookieString).toContain('campuscare_session');
    sessionCookie = cookieString;
  });

  it('GET /api/v1/auth/me -> should reject unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('GET /api/v1/auth/me -> should succeed with session cookie', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('POST /api/v1/auth/logout -> should revoke session', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200);

    // After logout, accessing /me with that cookie should fail
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie)
      .expect(401);
  });
});
