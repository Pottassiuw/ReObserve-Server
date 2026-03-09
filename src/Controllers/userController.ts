import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { AtualizarUsuarioInput, atualizarUsuarioSchema } from "../libs/userSchemas";
import bcrypt from "bcrypt";
import { z } from "zod";
import { sendError, sendSuccess, handleControllerError, parseIdParam } from "../Helpers/serverUtils";

export const retornarUsuarios = async (req: Request, res: Response) => {
  try {
    const users = await prisma.usuario.findMany({
      include: { grupo: true, empresa: true },
    });
    return sendSuccess(res, users, "Usuários encontrados!");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar usuários");
  }
};

export const retornarUsuarioId = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id },
      include: { grupo: true, empresa: true },
    });

    if (!usuario) {
      return sendError(res, 404, "NOT_FOUND", "Usuário não encontrado");
    }

    return sendSuccess(res, usuario, "Usuário encontrado!");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar usuário");
  }
};

export const atualizarDados = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioExistente) {
      return sendError(res, 404, "NOT_FOUND", "Usuário não encontrado");
    }

    const validatedData: AtualizarUsuarioInput = atualizarUsuarioSchema.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (validatedData.nome) updateData.nome = validatedData.nome;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.senha) updateData.senha = await bcrypt.hash(validatedData.senha, 12);

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, "NO_DATA", "Nenhum dado fornecido para atualização");
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: { id: true, nome: true, email: true, cpf: true, empresaId: true, grupoId: true },
    });

    return sendSuccess(res, usuarioAtualizado, "Usuário atualizado!");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, "VALIDATION_ERROR", "Dados inválidos", {
        errors: error.issues.map((err) => ({ field: err.path.join("."), message: err.message })),
      });
    }
    return handleControllerError(res, error, "Erro ao atualizar usuário");
  }
};
