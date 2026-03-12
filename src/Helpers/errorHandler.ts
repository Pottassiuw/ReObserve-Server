export enum ErrorCode {
  // XML Parsing Errors
  INVALID_XML_FORMAT = "INVALID_XML_FORMAT",
  XML_PARSE_ERROR = "XML_PARSE_ERROR",
  INVALID_NFE_STRUCTURE = "INVALID_NFE_STRUCTURE",
  NFE_NUMBER_NOT_FOUND = "NFE_NUMBER_NOT_FOUND",
  XML_PROCESSING_ERROR = "XML_PROCESSING_ERROR",

  // File Upload Errors
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_VALIDATION_ERROR = "FILE_VALIDATION_ERROR",
  UPLOAD_ERROR = "UPLOAD_ERROR",

  // Validation Errors
  MISSING_FIELDS = "MISSING_FIELDS",
  INVALID_NFE_DATA = "INVALID_NFE_DATA",
  INVALID_INPUT = "INVALID_INPUT",

  // Database Errors
  DUPLICATE_NFE = "DUPLICATE_NFE",
  TAX_NOTE_NOT_CREATED = "TAX_NOTE_NOT_CREATED",

  // Authorization Errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_USER = "INVALID_USER",
  INVALID_EMPRESA_ID = "INVALID_EMPRESA_ID",

  // Not Found Errors
  NOT_FOUND = "NOT_FOUND",

  // General Errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface APIErrorResponse {
  success: false;
  error: ErrorCode | string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export interface APISuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  errorCode: ErrorCode | string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>,
): APIErrorResponse {
  return {
    success: false,
    error: errorCode,
    message,
    statusCode,
    ...(details && { details }),
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message: string = "Operação realizada com sucesso",
): APISuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Error class for API errors
 */
export class APIError extends Error {
  public readonly errorCode: ErrorCode | string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    errorCode: ErrorCode | string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>,
  ) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "APIError";
    Object.setPrototypeOf(this, APIError.prototype);
  }

  toJSON(): APIErrorResponse {
    return {
      success: false,
      error: this.errorCode,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Specific error for XML parsing failures
 */
export class XMLParsingError extends APIError {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.XML_PROCESSING_ERROR,
  ) {
    super(errorCode, message, 400);
    this.name = "XMLParsingError";
    Object.setPrototypeOf(this, XMLParsingError.prototype);
  }
}

/**
 * Specific error for validation failures
 */
export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.INVALID_INPUT, message, 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Specific error for authorization failures
 */
export class AuthenticationError extends APIError {
  constructor(message: string = "Usuário não autenticado") {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Specific error for permission failures
 */
export class PermissionError extends APIError {
  constructor(message: string = "Permissão negada") {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = "PermissionError";
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Specific error for not found resources
 */
export class NotFoundError extends APIError {
  constructor(message: string = "Recurso não encontrado") {
    super(ErrorCode.NOT_FOUND, message, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Specific error for database constraint violations
 */
export class DuplicateError extends APIError {
  constructor(message: string = "Dados duplicados") {
    super(ErrorCode.DUPLICATE_NFE, message, 409);
    this.name = "DuplicateError";
    Object.setPrototypeOf(this, DuplicateError.prototype);
  }
}

/**
 * Generic error handler for controllers
 * Logs the error and returns appropriate response
 */
export function handleError(
  error: any,
  defaultMessage: string = "Erro ao processar requisição",
) {
  if (error instanceof APIError) {
    console.error(`[${error.errorCode}] ${error.message}`);
    return {
      statusCode: error.statusCode,
      response: error.toJSON(),
    };
  }

  if (error instanceof SyntaxError) {
    console.error("Erro de sintaxe:", error);
    return {
      statusCode: 400,
      response: createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "Dados inválidos fornecidos",
        400,
      ),
    };
  }

  // Prisma constraint violation
  if ((error as any)?.code === "P2002") {
    console.error("Erro de violação de constraint:", error);
    return {
      statusCode: 409,
      response: createErrorResponse(
        ErrorCode.DUPLICATE_NFE,
        "Este número de NFe já existe",
        409,
      ),
    };
  }

  // Generic error
  console.error("Erro interno:", error);
  return {
    statusCode: 500,
    response: createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      defaultMessage,
      500,
      { message: error?.message },
    ),
  };
}

/**
 * Logs errors with context information
 */
export function logError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>,
) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    errorType: error?.constructor?.name || "Unknown",
    message: error?.message,
    ...(additionalInfo && { additionalInfo }),
  };

  if (error instanceof APIError) {
    console.error(`[ERROR] ${JSON.stringify(errorInfo)}`);
  } else {
    console.error(`[ERROR] ${JSON.stringify(errorInfo)}`, error);
  }
}
