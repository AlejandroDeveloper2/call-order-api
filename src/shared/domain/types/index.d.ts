interface ServerErrorResponse {
  name: string;
  httpCode: number;
  isOperational: boolean;
  description: string;
  path: string;
  timestamp: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  httpCode: number;
}

interface JwtPayload {
  accountId: string;
}

export { ServerErrorResponse, ApiResponse, JwtPayload };
