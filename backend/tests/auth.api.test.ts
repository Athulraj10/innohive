import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { createTestUser, cleanupTestData } from './helpers';

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_TEST_URI);
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Cleanup is handled by global setup.ts beforeEach
    // Just ensure collections are clean
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for password too short', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Short1',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for password without numbers', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'NoNumbers',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for name too short', async () => {
      const userData = {
        name: 'J',
        email: 'john@example.com',
        password: 'SecurePass123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
      };

      await request(app).post('/api/auth/register').send(userData).expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already registered');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser('John Doe', 'john@example.com', 'SecurePass123');
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.role).toBe('USER');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken: string;

    beforeEach(async () => {
      const user = await createTestUser('John Doe', 'john@example.com', 'SecurePass123');
      userToken = user.token;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.role).toBe('USER');
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

