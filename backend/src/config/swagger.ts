import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini Competition Dashboard API',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the Mini Competition Dashboard backend',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: env.API_URL,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: 'User role',
              example: 'USER',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Competition: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Competition ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Competition name',
              example: 'Summer Trading Challenge',
            },
            slug: {
              type: 'string',
              description: 'URL-friendly competition identifier',
              example: 'summer-trading-challenge',
            },
            description: {
              type: 'string',
              description: 'Competition description',
              example: 'Join our summer trading competition and win big prizes!',
            },
            entryFee: {
              type: 'number',
              minimum: 0,
              description: 'Entry fee in USD',
              example: 50,
            },
            prizePool: {
              type: 'number',
              minimum: 0,
              description: 'Total prize pool in USD',
              example: 10000,
            },
            maxParticipants: {
              type: 'integer',
              minimum: 1,
              description: 'Maximum number of participants (optional)',
              example: 100,
            },
            participantCount: {
              type: 'integer',
              minimum: 0,
              description: 'Current number of participants',
              example: 45,
            },
            joined: {
              type: 'boolean',
              description: 'Whether the authenticated user has joined this competition',
              example: false,
            },
            startsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition start date (optional)',
              example: '2024-06-01T00:00:00.000Z',
            },
            endsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition end date (optional)',
              example: '2024-08-31T23:59:59.000Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition creation timestamp',
            },
            createdBy: {
              type: 'string',
              description: 'ID of the admin who created the competition',
            },
          },
        },
        Participant: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Participation ID',
            },
            userId: {
              $ref: '#/components/schemas/User',
            },
            competitionId: {
              type: 'string',
              description: 'Competition ID',
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user joined the competition',
            },
          },
        },
        ChartDataPoint: {
          type: 'object',
          properties: {
            time: {
              type: 'integer',
              description: 'Unix timestamp',
              example: 1609459200,
            },
            open: {
              type: 'number',
              description: 'Opening price',
              example: 100.5,
            },
            high: {
              type: 'number',
              description: 'Highest price',
              example: 102.3,
            },
            low: {
              type: 'number',
              description: 'Lowest price',
              example: 99.8,
            },
            close: {
              type: 'number',
              description: 'Closing price',
              example: 101.2,
            },
            volume: {
              type: 'number',
              description: 'Trading volume',
              example: 1000,
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 100,
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 100,
              pattern: '^(?=.*[A-Za-z])(?=.*\\d)',
              description: 'Password (must contain at least one letter and one number)',
              example: 'SecurePass123',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'SecurePass123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT authentication token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        CreateCompetitionRequest: {
          type: 'object',
          required: ['name', 'entryFee', 'prizePool'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Competition name',
              example: 'Summer Trading Challenge',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Competition description',
              example: 'Join our summer trading competition and win big prizes!',
            },
            entryFee: {
              type: 'number',
              minimum: 0,
              description: 'Entry fee in USD',
              example: 50,
            },
            prizePool: {
              type: 'number',
              minimum: 0,
              description: 'Total prize pool in USD',
              example: 10000,
            },
            maxParticipants: {
              type: 'integer',
              minimum: 1,
              description: 'Maximum number of participants (optional)',
              example: 100,
            },
            startsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition start date (optional)',
              example: '2024-06-01T00:00:00.000Z',
            },
            endsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition end date (optional)',
              example: '2024-08-31T23:59:59.000Z',
            },
          },
        },
        UpdateCompetitionRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Competition name',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Competition description',
            },
            entryFee: {
              type: 'number',
              minimum: 0,
              description: 'Entry fee in USD',
            },
            prizePool: {
              type: 'number',
              minimum: 0,
              description: 'Total prize pool in USD',
            },
            maxParticipants: {
              type: 'integer',
              minimum: 1,
              description: 'Maximum number of participants',
            },
            startsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition start date',
            },
            endsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Competition end date',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)',
            },
            meta: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                fields: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  example: {
                    email: ['Email is required'],
                    password: ['Password must be at least 8 characters'],
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints',
      },
      {
        name: 'Competitions',
        description: 'Competition management endpoints for users',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints for competition and user management',
      },
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

