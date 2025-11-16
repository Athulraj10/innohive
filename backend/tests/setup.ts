import mongoose from 'mongoose';

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';

// Setup before all tests
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_TEST_URI);
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Clean database before each test
beforeEach(async () => {
  try {
    // Delete in order to avoid foreign key issues
    const { Participation } = await import('../src/models/participation.model');
    const { Competition } = await import('../src/models/competition.model');
    const { User } = await import('../src/models/user.model');
    const { Candle } = await import('../src/models/candle.model');
    
    await Participation.deleteMany({});
    await Competition.deleteMany({});
    await Candle.deleteMany({});
    await User.deleteMany({});
  } catch (error) {
    // If models aren't loaded yet, use direct collection access
    const collections = mongoose.connection.collections;
    const order = ['participations', 'competitions', 'candles', 'users'];
    
    for (const collectionName of order) {
      const collection = collections[collectionName];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
});

