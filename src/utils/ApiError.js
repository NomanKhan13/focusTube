class ApiError extends Error {
  constructor(statusCode, message) {
    super(message); // by default Error has message property, to access this.error we need this.
    this.statusCode = statusCode;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
