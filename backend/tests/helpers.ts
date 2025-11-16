import { User } from '../src/models/user.model';
import { Competition } from '../src/models/competition.model';
import { Participation } from '../src/models/participation.model';
import { hashPassword } from '../src/utils/password';
import { loginUser } from '../src/services/auth.service';
import { createCompetition } from '../src/services/competition.service';
import mongoose from 'mongoose';

export interface TestUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  token: string;
}

export const createTestUser = async (
  name: string,
  email: string,
  password: string,
  role: 'USER' | 'ADMIN' = 'USER'
): Promise<TestUser> => {
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  const loginResult = await loginUser({ email, password });
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: loginResult.token,
  };
};

export const createTestCompetition = async (
  data: {
    name: string;
    entryFee?: number;
    prizePool?: number;
    maxParticipants?: number;
    startsAt?: Date;
    endsAt?: Date;
    createdBy?: mongoose.Types.ObjectId;
  }
) => {
  return await createCompetition({
    name: data.name,
    entryFee: data.entryFee || 10,
    prizePool: data.prizePool || 100,
    maxParticipants: data.maxParticipants,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    createdBy: data.createdBy?.toString(),
  });
};

export const createTestParticipation = async (
  userId: mongoose.Types.ObjectId,
  competitionId: mongoose.Types.ObjectId
) => {
  return await Participation.create({
    userId,
    competitionId,
  });
};

export const cleanupTestData = async () => {
  // Delete in order to avoid foreign key issues
  try {
    const { Candle } = await import('../src/models/candle.model');
    await Participation.deleteMany({});
    await Competition.deleteMany({});
    await Candle.deleteMany({});
    await User.deleteMany({});
  } catch (error) {
    // Fallback if models aren't loaded
    await Participation.deleteMany({});
    await Competition.deleteMany({});
    await User.deleteMany({});
  }
};

