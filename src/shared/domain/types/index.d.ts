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

interface PaginatedResponse<T> {
  records: T[];
  page: number;
  totalPages: number;
  totalRecords: number;
}

interface JwtPayload {
  accountId: string;
  roleId: string;
  profileId: string;
}

export { ServerErrorResponse, ApiResponse, JwtPayload, PaginatedResponse };
