"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIdParam = exports.handleControllerError = exports.sendSuccess = exports.sendError = void 0;
const zod_1 = require("zod");
const sendError = (res, statusCode, error, message, details) => {
    return res.status(statusCode).json({
        success: false,
        error,
        message,
        ...(details && { details }),
    });
};
exports.sendError = sendError;
const sendSuccess = (res, data, message = "Operação realizada com sucesso", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const handleControllerError = (res, error, defaultMessage = "Erro interno do servidor") => {
    if (error instanceof zod_1.ZodError) {
        return (0, exports.sendError)(res, 400, "VALIDATION_ERROR", "Dados inválidos", {
            issues: error.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            })),
        });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return (0, exports.sendError)(res, 409, "DUPLICATE_ERROR", "Dados duplicados");
    }
    const errorObj = error;
    console.error("Error:", errorObj.message || error);
    return (0, exports.sendError)(res, 500, "INTERNAL_ERROR", errorObj.message || defaultMessage);
};
exports.handleControllerError = handleControllerError;
const parseIdParam = (param) => {
    if (!param)
        return null;
    const id = parseInt(param, 10);
    return isNaN(id) ? null : id;
};
exports.parseIdParam = parseIdParam;
