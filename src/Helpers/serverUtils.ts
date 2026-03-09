import { Request, Response } from "express";
import { ZodError } from "zod";

export const sendError = (
  res: Response,
  statusCode: number,
  error: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  return res.status(statusCode).json({
    success: false,
    error,
    message,
    ...(details && { details }),
  });
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Operação realizada com sucesso",
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const handleControllerError = (
  res: Response,
  error: unknown,
  defaultMessage: string = "Erro interno do servidor",
): Response => {
  if (error instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Dados inválidos", {
      issues: error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return sendError(res, 409, "DUPLICATE_ERROR", "Dados duplicados");
  }

  const errorObj = error as { message?: string };
  console.error("Error:", errorObj.message || error);

  return sendError(res, 500, "INTERNAL_ERROR", errorObj.message || defaultMessage);
};

export const parseIdParam = (param: string | undefined): number | null => {
  if (!param) return null;
  const id = parseInt(param, 10);
  return isNaN(id) ? null : id;
};
