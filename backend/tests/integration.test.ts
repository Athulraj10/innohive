import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { Competition } from '../src/models/competition.model';
import { Participation } from '../src/models/participation.model';
import { createTestUser, createTestCompetition, cleanupTestData } from './helpers';

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';

describe('Integration Tests - Complete User Flows', () => {
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
    await cleanupTestData();
  });

  describe('Complete User Registration and Competition Flow', () => {
    it('should complete full flow: register -> login -> get competitions -> join -> view chart', async () => {
      // 1. Register a new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'SecurePass123',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const token = registerResponse.body.data.token;
      expect(token).toBeDefined();

      // 2. Get current user info
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.data.email).toBe('newuser@test.com');

      // 3. Create a competition (as admin)
      const admin = await createTestUser('Admin', 'admin@test.com', 'AdminPass123', 'ADMIN');
      const competitionResponse = await request(app)
        .post('/api/admin/competitions')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Integration Test Competition',
          description: 'Test competition for integration test',
          entryFee: 25,
          prizePool: 500,
          maxParticipants: 50,
        })
        .expect(201);

      const competitionId = competitionResponse.body.data._id;

      // Generate chart data for the competition
      const { generateAndSaveCandles } = await import('../src/utils/chartGenerator');
      await generateAndSaveCandles({
        competitionId: competitionId,
        count: 30,
      });

      // 4. Get list of competitions
      const competitionsResponse = await request(app)
        .get('/api/competitions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(competitionsResponse.body.data.length).toBeGreaterThan(0);
      const competition = competitionsResponse.body.data.find(
        (c: any) => c._id === competitionId
      );
      expect(competition).toBeDefined();
      expect(competition.joined).toBe(false);

      // 5. Get specific competition
      const competitionDetailResponse = await request(app)
        .get(`/api/competitions/${competitionId}`)
        .expect(200);

      expect(competitionDetailResponse.body.data._id).toBe(competitionId);

      // 6. Join the competition
      const joinResponse = await request(app)
        .post(`/api/competitions/${competitionId}/join`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(joinResponse.body.success).toBe(true);
      expect(joinResponse.body.data.participationId).toBeDefined();

      // 7. Verify joined status in competitions list
      const updatedCompetitionsResponse = await request(app)
        .get('/api/competitions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updatedCompetition = updatedCompetitionsResponse.body.data.find(
        (c: any) => c._id === competitionId
      );
      expect(updatedCompetition.joined).toBe(true);

      // 8. Get chart data
      const chartResponse = await request(app)
        .get(`/api/competitions/${competitionId}/chart`)
        .expect(200);

      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.data.candles).toBeInstanceOf(Array);
      expect(chartResponse.body.data.candles.length).toBeGreaterThan(0);
    });

    it('should handle search and filter flow', async () => {
      const admin = await createTestUser('Admin', 'admin@test.com', 'AdminPass123', 'ADMIN');

      // Create multiple competitions
      await request(app)
        .post('/api/admin/competitions')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Summer Competition',
          entryFee: 10,
          prizePool: 100,
        })
        .expect(201);

      await request(app)
        .post('/api/admin/competitions')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Winter Competition',
          entryFee: 20,
          prizePool: 200,
        })
        .expect(201);

      // Search for summer competition
      const searchResponse = await request(app)
        .get('/api/competitions?search=summer')
        .expect(200);

      expect(searchResponse.body.data.length).toBe(1);
      expect(searchResponse.body.data[0].name).toContain('Summer');

      // Sort by prize pool
      const sortedResponse = await request(app)
        .get('/api/competitions?sort=prizePool')
        .expect(200);

      expect(sortedResponse.body.data.length).toBe(2);
      // Should be sorted descending
      expect(sortedResponse.body.data[0].prizePool).toBeGreaterThanOrEqual(
        sortedResponse.body.data[1].prizePool
      );
    });

    it('should handle admin CRUD flow', async () => {
      const admin = await createTestUser('Admin', 'admin@test.com', 'AdminPass123', 'ADMIN');

      // Create
      const createResponse = await request(app)
        .post('/api/admin/competitions')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'CRUD Test Competition',
          entryFee: 15,
          prizePool: 150,
          maxParticipants: 30,
        })
        .expect(201);

      const competitionId = createResponse.body.data._id;

      // Read
      const readResponse = await request(app)
        .get(`/api/competitions/${competitionId}`)
        .expect(200);

      expect(readResponse.body.data.name).toBe('CRUD Test Competition');

      // Update
      const updateResponse = await request(app)
        .put(`/api/admin/competitions/${competitionId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Updated Competition Name',
          prizePool: 300,
        })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('Updated Competition Name');
      expect(updateResponse.body.data.prizePool).toBe(300);

      // Delete
      await request(app)
        .delete(`/api/admin/competitions/${competitionId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(204);

      // Verify deletion
      const deletedResponse = await request(app)
        .get(`/api/competitions/${competitionId}`)
        .expect(404);

      expect(deletedResponse.body.success).toBe(false);
    });

    it('should handle competition full scenario', async () => {
      const admin = await createTestUser('Admin', 'admin@test.com', 'AdminPass123', 'ADMIN');
      const user1 = await createTestUser('User 1', 'user1@test.com', 'Pass123');
      const user2 = await createTestUser('User 2', 'user2@test.com', 'Pass123');

      // Create competition with max 1 participant
      const createResponse = await request(app)
        .post('/api/admin/competitions')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Limited Competition',
          entryFee: 10,
          prizePool: 100,
          maxParticipants: 1,
        })
        .expect(201);

      const competitionId = createResponse.body.data._id;

      // First user joins successfully
      await request(app)
        .post(`/api/competitions/${competitionId}/join`)
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      // Second user should fail
      const joinResponse = await request(app)
        .post(`/api/competitions/${competitionId}/join`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400);

      expect(joinResponse.body.error.code).toBe('COMPETITION_FULL');
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle authentication errors gracefully', async () => {
      // Try to access protected route without token
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle validation errors with field details', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'T', // Too short
          email: 'invalid-email',
          password: 'short', // Too short and no number
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.fields).toBeDefined();
      expect(Object.keys(response.body.error.fields).length).toBeGreaterThan(0);
    });

    it('should handle not found errors', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/competitions/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMPETITION_NOT_FOUND');
    });
  });
});

