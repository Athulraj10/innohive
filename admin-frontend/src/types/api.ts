export interface User {
  _id: string;
  name: string;
  email: string;
  role?: 'USER' | 'ADMIN';
  createdAt?: string;
}

export interface Competition {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  maxParticipants?: number;
  participantCount: number;
  joined: boolean;
  createdAt: string;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
}

export interface CompetitionListResponse {
  data: Competition[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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

export interface Participant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  competitionId: string;
  joinedAt: string;
}

export interface ParticipantsResponse {
  participants: Participant[];
}

