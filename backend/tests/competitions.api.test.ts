import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { Competition } from '../src/models/competition.model';
import { Participation } from '../src/models/participation.model';
import { createTestUser, createTestCompetition, cleanupTestData } from './helpers';

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';

describe('Competitions API Endpoints', () => {
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testAdmin: any;

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
    testUser = await createTestUser('Test User', 'user@test.com', 'UserPass123');
    testAdmin = await createTestUser('Admin User', 'admin@test.com', 'AdminPass123', 'ADMIN');
    userToken = testUser.token;
    adminToken = testAdmin.token;
  });

  describe('GET /api/competitions', () => {
    beforeEach(async () => {
      await createTestCompetition({
        name: 'Competition 1',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });
      await createTestCompetition({
        name: 'Competition 2',
        entryFee: 20,
        prizePool: 200,
        createdBy: testAdmin._id,
      });
    });

    it('should return list of competitions', async () => {
      const response = await request(app)
        .get('/api/competitions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/competitions?page=1&limit=1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
      expect(response.body.meta.total).toBe(2);
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get('/api/competitions?search=Competition 1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Competition 1');
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/competitions?sort=prizePool')
        .expect(200);

      expect(response.body.data.length).toBe(2);
      // Should be sorted by prizePool descending
      expect(response.body.data[0].prizePool).toBeGreaterThanOrEqual(
        response.body.data[1].prizePool
      );
    });

    it('should filter by joined status when authenticated', async () => {
      const competition = await createTestCompetition({
        name: 'Joined Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });

      await Participation.create({
        userId: testUser._id,
        competitionId: competition._id,
      });

      const response = await request(app)
        .get('/api/competitions?joined=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((comp: any) => {
        expect(comp.joined).toBe(true);
      });
    });

    it('should include joined status for authenticated users', async () => {
      const competition = await createTestCompetition({
        name: 'Test Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });

      await Participation.create({
        userId: testUser._id,
        competitionId: competition._id,
      });

      const response = await request(app)
        .get('/api/competitions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const joinedComp = response.body.data.find(
        (c: any) => c._id === competition._id.toString()
      );
      expect(joinedComp.joined).toBe(true);
    });
  });

  describe('GET /api/competitions/:id', () => {
    let competition: any;

    beforeEach(async () => {
      competition = await createTestCompetition({
        name: 'Test Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });
    });

    it('should return competition by ID', async () => {
      const response = await request(app)
        .get(`/api/competitions/${competition._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(competition._id.toString());
      expect(response.body.data.name).toBe('Test Competition');
      expect(response.body.data.entryFee).toBe(10);
      expect(response.body.data.prizePool).toBe(100);
    });

    it('should return 404 for non-existent competition', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/competitions/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/competitions/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/competitions/:id/chart', () => {
    let competition: any;

    beforeEach(async () => {
      competition = await createTestCompetition({
        name: 'Test Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });
      
      // Generate chart data for the competition
      const { generateAndSaveCandles } = await import('../src/utils/chartGenerator');
      await generateAndSaveCandles({
        competitionId: competition._id.toString(),
        count: 30,
      });
    });

    it('should return chart data for competition', async () => {
      const response = await request(app)
        .get(`/api/competitions/${competition._id}/chart`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.candles).toBeInstanceOf(Array);
      expect(response.body.data.candles.length).toBeGreaterThan(0);

      const candle = response.body.data.candles[0];
      expect(candle).toHaveProperty('time');
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
    });

    it('should support time range filtering', async () => {
      const from = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const to = Math.floor(Date.now() / 1000);

      const response = await request(app)
        .get(`/api/competitions/${competition._id}/chart?from=${from}&to=${to}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candles).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent competition', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/competitions/${fakeId}/chart`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/competitions', () => {
    it('should create competition when authenticated', async () => {
      const competitionData = {
        name: 'New Competition',
        description: 'Test description',
        entryFee: 50,
        prizePool: 1000,
        maxParticipants: 100,
      };

      const response = await request(app)
        .post('/api/competitions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(competitionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(competitionData.name);
      expect(response.body.data.entryFee).toBe(competitionData.entryFee);
      expect(response.body.data.prizePool).toBe(competitionData.prizePool);
      expect(response.body.data.slug).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const competitionData = {
        name: 'New Competition',
        entryFee: 50,
        prizePool: 1000,
      };

      const response = await request(app)
        .post('/api/competitions')
        .send(competitionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/competitions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test',
          // Missing entryFee and prizePool
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate entryFee is non-negative', async () => {
      const response = await request(app)
        .post('/api/competitions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test',
          entryFee: -10,
          prizePool: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/competitions/:id/join', () => {
    let competition: any;

    beforeEach(async () => {
      competition = await createTestCompetition({
        name: 'Joinable Competition',
        entryFee: 10,
        prizePool: 100,
        maxParticipants: 10,
        createdBy: testAdmin._id,
      });
    });

    it('should allow user to join competition', async () => {
      const response = await request(app)
        .post(`/api/competitions/${competition._id}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participationId).toBeDefined();

      // Verify participation was created
      const participation = await Participation.findOne({
        userId: testUser._id,
        competitionId: competition._id,
      });
      expect(participation).toBeDefined();
    });

    it('should return 400 if already joined', async () => {
      await Participation.create({
        userId: testUser._id,
        competitionId: competition._id,
      });

      const response = await request(app)
        .post(`/api/competitions/${competition._id}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(409); // Conflict status for already joined

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_JOINED');
    });

    it('should return 400 if competition is full', async () => {
      const fullCompetition = await createTestCompetition({
        name: 'Full Competition',
        entryFee: 10,
        prizePool: 100,
        maxParticipants: 1,
        createdBy: testAdmin._id,
      });

      // Join with another user
      const otherUser = await createTestUser('Other User', 'other@test.com', 'Pass123');
      await Participation.create({
        userId: otherUser._id,
        competitionId: fullCompetition._id,
      });

      const response = await request(app)
        .post(`/api/competitions/${fullCompetition._id}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMPETITION_FULL');
    });

    it('should return 400 if competition has ended', async () => {
      const endedCompetition = await createTestCompetition({
        name: 'Ended Competition',
        entryFee: 10,
        prizePool: 100,
        endsAt: new Date(Date.now() - 86400000), // 1 day ago
        createdBy: testAdmin._id,
      });

      const response = await request(app)
        .post(`/api/competitions/${endedCompetition._id}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMPETITION_ENDED');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/competitions/${competition._id}/join`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent competition', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/competitions/${fakeId}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

