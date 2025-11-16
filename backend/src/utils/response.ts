import { Response } from 'express';

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

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: string,
    fields?: Record<string, string[]>
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(fields && { fields }),
      },
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response {
    return this.success(
      res,
      data,
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  }
}

