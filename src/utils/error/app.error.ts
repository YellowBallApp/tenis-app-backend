import errors, { ErrorKeys } from "../../utils/constants/error";

export class AppError extends Error {
  errorKey: string;
  errorCode: number;
  message: string;
  status: number;
  
  private static getMaxErrorCategory(): number {
    const errorValues = Object.values(errors);
    const lastError = errorValues[errorValues.length - 1];
    return Math.floor(lastError.code / 1000);
  }

  private static readonly MAX_CATEGORY = AppError.getMaxErrorCategory();

  constructor(errorKey: ErrorKeys, statusCode?: number) {
    const errorInfo = errors[errorKey];
    const message = errorInfo.message;
    
    super(message);
    
    this.name = 'AppError';
    this.errorKey = errorInfo.key;
    this.errorCode = errorInfo.code;
    this.message = errorInfo.message;
    
    this.status = statusCode || this.getDefaultStatusCode(errorInfo.code);
    
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private getDefaultStatusCode(errorCode: number): number {
    if (errorCode === 1003) return 401; // UNAUTHORIZED
    if (errorCode === 1004) return 403; // FORBIDDEN

    const category = Math.floor(errorCode / 1000);
    const isNotFound = errorCode % 10 === 3;
    
    // Auth errors
    if (category === 3) return 401;
    
    // Common errors
    if (category === 1) return 400;
    
    // Entity errors
    if (category >= 2 && category <= AppError.MAX_CATEGORY) {
      return isNotFound ? 404 : 400;
    }
    
    return 500;
  }
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      errorKey: err.errorKey,
      errorCode: err.errorCode,
      message: err.message
    });
  }
  
  return res.status(500).json({
    errorKey: errors.UNKNOWN_ERROR.key,
    errorCode: errors.UNKNOWN_ERROR.code,
    message: errors.UNKNOWN_ERROR.message
  });
};