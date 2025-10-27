class ApiError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean = false;
  constructor(statusCode: number, message: string) {
    super(message); // by default Error has message property, to access this.error we need this.
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
