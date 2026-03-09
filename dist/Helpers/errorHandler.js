"use strict";
/**
 * Comprehensive error handling for XML processing and release creation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateError = exports.NotFoundError = exports.PermissionError = exports.AuthenticationError = exports.ValidationError = exports.XMLParsingError = exports.APIError = exports.ErrorCode = void 0;
exports.createErrorResponse = createErrorResponse;
exports.createSuccessResponse = createSuccessResponse;
exports.handleError = handleError;
exports.logError = logError;
var ErrorCode;
(function (ErrorCode) {
    // XML Parsing Errors
    ErrorCode["INVALID_XML_FORMAT"] = "INVALID_XML_FORMAT";
    ErrorCode["XML_PARSE_ERROR"] = "XML_PARSE_ERROR";
    ErrorCode["INVALID_NFE_STRUCTURE"] = "INVALID_NFE_STRUCTURE";
    ErrorCode["NFE_NUMBER_NOT_FOUND"] = "NFE_NUMBER_NOT_FOUND";
    ErrorCode["XML_PROCESSING_ERROR"] = "XML_PROCESSING_ERROR";
    // File Upload Errors
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ErrorCode["FILE_VALIDATION_ERROR"] = "FILE_VALIDATION_ERROR";
    ErrorCode["UPLOAD_ERROR"] = "UPLOAD_ERROR";
    // Validation Errors
    ErrorCode["MISSING_FIELDS"] = "MISSING_FIELDS";
    ErrorCode["INVALID_NFE_DATA"] = "INVALID_NFE_DATA";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    // Database Errors
    ErrorCode["DUPLICATE_NFE"] = "DUPLICATE_NFE";
    ErrorCode["TAX_NOTE_NOT_CREATED"] = "TAX_NOTE_NOT_CREATED";
    // Authorization Errors
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_USER"] = "INVALID_USER";
    ErrorCode["INVALID_EMPRESA_ID"] = "INVALID_EMPRESA_ID";
    // Not Found Errors
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    // General Errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Creates a standardized error response
 */
function createErrorResponse(errorCode, message, statusCode = 500, details) {
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
function createSuccessResponse(data, message = 'Operação realizada com sucesso') {
    return {
        success: true,
        message,
        data,
    };
}
/**
 * Error class for API errors
 */
class APIError extends Error {
    constructor(errorCode, message, statusCode = 500, details) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'APIError';
        Object.setPrototypeOf(this, APIError.prototype);
    }
    toJSON() {
        return {
            success: false,
            error: this.errorCode,
            message: this.message,
            statusCode: this.statusCode,
            ...(this.details && { details: this.details }),
        };
    }
}
exports.APIError = APIError;
/**
 * Specific error for XML parsing failures
 */
class XMLParsingError extends APIError {
    constructor(message, errorCode = ErrorCode.XML_PROCESSING_ERROR) {
        super(errorCode, message, 400);
        this.name = 'XMLParsingError';
        Object.setPrototypeOf(this, XMLParsingError.prototype);
    }
}
exports.XMLParsingError = XMLParsingError;
/**
 * Specific error for validation failures
 */
class ValidationError extends APIError {
    constructor(message, details) {
        super(ErrorCode.INVALID_INPUT, message, 400, details);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * Specific error for authorization failures
 */
class AuthenticationError extends APIError {
    constructor(message = 'Usuário não autenticado') {
        super(ErrorCode.UNAUTHORIZED, message, 401);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Specific error for permission failures
 */
class PermissionError extends APIError {
    constructor(message = 'Permissão negada') {
        super(ErrorCode.FORBIDDEN, message, 403);
        this.name = 'PermissionError';
        Object.setPrototypeOf(this, PermissionError.prototype);
    }
}
exports.PermissionError = PermissionError;
/**
 * Specific error for not found resources
 */
class NotFoundError extends APIError {
    constructor(message = 'Recurso não encontrado') {
        super(ErrorCode.NOT_FOUND, message, 404);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Specific error for database constraint violations
 */
class DuplicateError extends APIError {
    constructor(message = 'Dados duplicados') {
        super(ErrorCode.DUPLICATE_NFE, message, 409);
        this.name = 'DuplicateError';
        Object.setPrototypeOf(this, DuplicateError.prototype);
    }
}
exports.DuplicateError = DuplicateError;
/**
 * Generic error handler for controllers
 * Logs the error and returns appropriate response
 */
function handleError(error, defaultMessage = 'Erro ao processar requisição') {
    if (error instanceof APIError) {
        console.error(`[${error.errorCode}] ${error.message}`);
        return {
            statusCode: error.statusCode,
            response: error.toJSON(),
        };
    }
    if (error instanceof SyntaxError) {
        console.error('Erro de sintaxe:', error);
        return {
            statusCode: 400,
            response: createErrorResponse(ErrorCode.INVALID_INPUT, 'Dados inválidos fornecidos', 400),
        };
    }
    // Prisma constraint violation
    if (error?.code === 'P2002') {
        console.error('Erro de violação de constraint:', error);
        return {
            statusCode: 409,
            response: createErrorResponse(ErrorCode.DUPLICATE_NFE, 'Este número de NFe já existe', 409),
        };
    }
    // Generic error
    console.error('Erro interno:', error);
    return {
        statusCode: 500,
        response: createErrorResponse(ErrorCode.INTERNAL_ERROR, defaultMessage, 500, { message: error?.message }),
    };
}
/**
 * Logs errors with context information
 */
function logError(context, error, additionalInfo) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        context,
        errorType: error?.constructor?.name || 'Unknown',
        message: error?.message,
        ...(additionalInfo && { additionalInfo }),
    };
    if (error instanceof APIError) {
        console.error(`[ERROR] ${JSON.stringify(errorInfo)}`);
    }
    else {
        console.error(`[ERROR] ${JSON.stringify(errorInfo)}`, error);
    }
}
