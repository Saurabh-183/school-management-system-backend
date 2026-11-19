export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export class ApiResponse {
  static success<T>(message: string, data?: T): ApiResponsePayload<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, errors?: unknown): ApiResponsePayload<null> {
    return {
      success: false,
      message,
      errors,
    };
  }
}
