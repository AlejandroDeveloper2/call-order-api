export interface ServerErrorResponse {
  name: string;
  httpCode: number;
  isOperational: boolean;
  description: string;
  path: string;
  timestamp: string;
}
export interface ApiResponse<T> {
  data: T;
  message: string;
  httpCode: number;
}
