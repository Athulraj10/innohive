export interface User {
  _id: string;
  name: string;
  email: string;
  walletBalance?: number;
  exposure?: number;
}

export interface Competition {
  _id: string;
  name: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  maxParticipants?: number;
  participantCount: number;
  joined: boolean;
  createdAt: string;
  startsAt?: string;
  endsAt?: string;
}

export interface Participant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  rank?: number;
  portfolioValue?: number;
  profitLoss?: number;
  joinedAt: string;
}

export interface CompetitionListResponse {
  data: Competition[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface JoinResponse {
  success: boolean;
  participationId: string;
}

export interface ApiError {
  error: string;
  code?: string;
  fields?: Record<string, string[]>;
  errors?: Array<{ msg: string; param: string }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    fields?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

