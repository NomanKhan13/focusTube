import { ApiError } from "../utils/ApiError";

const errorHandler = (err, req, res, next) => {
  if (!(err instanceof ApiError)) {
    err = new ApiError(err.message || "Internal server error", 500);
  }
  res
    .status(err.statusCode)
    .json({ sucess: false, message: err.message, statusCode: err.statusCode });
};

export { errorHandler };
