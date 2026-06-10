export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? normalizeErrorCode(message);
  }
}

function normalizeErrorCode(message: string) {
  const normalized = message
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

  return normalized.length > 0 ? normalized : 'INTERNAL_SERVER_ERROR';
}
