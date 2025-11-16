import mongoose from 'mongoose';
import {
  getCompetitions,
  getCompetitionById,
  createCompetition,
  joinCompetition,
  getChartData,
} from '../src/services/competition.service';
import { Competition } from '../src/models/competition.model';
import { Participation } from '../src/models/participation.model';
import { User } from '../src/models/user.model';
import { NotFoundError, ConflictError, BadRequestError } from '../src/utils/errors';
import { createTestUser, createTestCompetition, cleanupTestData } from './helpers';

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';

describe('Competition Service', () => {
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
  });

  describe('getCompetitions', () => {
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

    it('should return paginated competitions', async () => {
      const result = await getCompetitions({ page: 1, limit: 10 });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should support pagination', async () => {
      const result = await getCompetitions({ page: 1, limit: 1 });

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by search term', async () => {
      const result = await getCompetitions({ search: 'Competition 1' });

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Competition 1');
    });

    it('should sort by prizePool', async () => {
      const result = await getCompetitions({ sort: 'prizePool' });

      expect(result.data.length).toBe(2);
      expect(result.data[0].prizePool).toBeGreaterThanOrEqual(result.data[1].prizePool);
    });

    it('should include joined status when userId provided', async () => {
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

      const result = await getCompetitions({ userId: testUser._id.toString() });

      const joinedComp = result.data.find((c) => c._id.toString() === competition._id.toString());
      expect(joinedComp?.joined).toBe(true);
    });

    it('should filter by joined status', async () => {
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

      const result = await getCompetitions({
        joined: true,
        userId: testUser._id.toString(),
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((comp) => {
        expect(comp.joined).toBe(true);
      });
    });
  });

  describe('getCompetitionById', () => {
    it('should return competition by ID', async () => {
      const competition = await createTestCompetition({
        name: 'Test Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });

      const result = await getCompetitionById(competition._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(competition._id.toString());
      expect(result.name).toBe('Test Competition');
    });

    it('should return competition without joined status (joined is only in list)', async () => {
      const competition = await createTestCompetition({
        name: 'Test Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });

      const result = await getCompetitionById(competition._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(competition._id.toString());
      // Note: joined status is only available in getCompetitions, not getCompetitionById
    });

    it('should throw NotFoundError for non-existent competition', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(getCompetitionById(fakeId.toString())).rejects.toThrow(NotFoundError);
    });
  });

  describe('createCompetition', () => {
    it('should create a new competition', async () => {
      const competitionData = {
        name: 'New Competition',
        description: 'Test description',
        entryFee: 50,
        prizePool: 1000,
        maxParticipants: 100,
        createdBy: testAdmin._id,
      };

      const competition = await createCompetition(competitionData);

      expect(competition).toBeDefined();
      expect(competition.name).toBe(competitionData.name);
      expect(competition.entryFee).toBe(competitionData.entryFee);
      expect(competition.prizePool).toBe(competitionData.prizePool);
      expect(competition.slug).toBeDefined();
      expect(competition.createdBy?.toString()).toBe(testAdmin._id.toString());
    });

    it('should generate slug from name', async () => {
      const competition = await createCompetition({
        name: 'Test Competition Name',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });

      expect(competition.slug).toBe('test-competition-name');
    });

    it('should handle optional fields', async () => {
      const competition = await createCompetition({
        name: 'Minimal Competition',
        entryFee: 10,
        prizePool: 100,
        createdBy: testAdmin._id,
      });

      expect(competition).toBeDefined();
      expect(competition.maxParticipants).toBeUndefined();
      expect(competition.startsAt).toBeUndefined();
      expect(competition.endsAt).toBeUndefined();
    });
  });

  describe('joinCompetition', () => {
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
      const participationId = await joinCompetition(
        testUser._id.toString(),
        competition._id.toString()
      );

      expect(participationId).toBeDefined();

      const participation = await Participation.findById(participationId);
      expect(participation).toBeDefined();
      expect(participation?.userId.toString()).toBe(testUser._id.toString());
      expect(participation?.competitionId.toString()).toBe(competition._id.toString());
    });

    it('should throw ConflictError if already joined', async () => {
      await Participation.create({
        userId: testUser._id,
        competitionId: competition._id,
      });

      await expect(
        joinCompetition(testUser._id.toString(), competition._id.toString())
      ).rejects.toThrow(ConflictError);
    });

    it('should throw BadRequestError if competition is full', async () => {
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

      await expect(
        joinCompetition(testUser._id.toString(), fullCompetition._id.toString())
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if competition has ended', async () => {
      const endedCompetition = await createTestCompetition({
        name: 'Ended Competition',
        entryFee: 10,
        prizePool: 100,
        endsAt: new Date(Date.now() - 86400000), // 1 day ago
        createdBy: testAdmin._id,
      });

      await expect(
        joinCompetition(testUser._id.toString(), endedCompetition._id.toString())
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError for non-existent competition', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(joinCompetition(testUser._id.toString(), fakeId.toString())).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getChartData', () => {
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
      const result = await getChartData(competition._id.toString());

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      const candle = result[0];
      expect(candle).toHaveProperty('time');
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
      expect(candle.high).toBeGreaterThanOrEqual(candle.low);
      expect(candle.high).toBeGreaterThanOrEqual(candle.open);
      expect(candle.high).toBeGreaterThanOrEqual(candle.close);
      expect(candle.low).toBeLessThanOrEqual(candle.open);
      expect(candle.low).toBeLessThanOrEqual(candle.close);
    });

    it('should support time range filtering', async () => {
      const from = Math.floor(Date.now() / 1000) - 86400;
      const to = Math.floor(Date.now() / 1000);

      const result = await getChartData(competition._id.toString(), { from, to });

      expect(result).toBeInstanceOf(Array);
    });

    it('should throw NotFoundError for non-existent competition', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(getChartData(fakeId.toString())).rejects.toThrow(NotFoundError);
    });
  });
});

