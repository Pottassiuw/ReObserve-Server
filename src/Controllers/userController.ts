import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { AtualizarUsuarioInput, atualizarUsuarioSchema } from "../libs/userSchemas";
import bcrypt from "bcrypt";
import { z } from "zod";

export const retornarUsuarios = async (req: Request, res: Response) => {
  try {
    const user = await prisma.usuario.findMany({
      include: {
        grupo: true,
        empresa: true,
      },
    });
    if (!user) {
      res.status(401).json({
        error: "Usuário não existe",
        success: false,
        code: "NO_USERS",
      });
    }
    return res.status(200).json({
      message: "Usuários encontrados!",
      success: true,
      code: "ALL_USERS",
      users: user,
    });
  } catch (error: any) {
    console.error("Erro ao buscar lançamento:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const retornarUsuarioId = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const idParam = req.params.id;

    if (!idParam) {
      return res.status(400).json({
        error: "ID não fornecido",
        success: false,
      });
    }

    const id = parseInt(idParam);

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID deve ser um número",
        success: false,
        receivedId: idParam,
      });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id: id },
      include: {
        grupo: true,
        empresa: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado",
        success: false,
        searchedId: id,
      });
    }

    return res.status(200).json({
      message: "Usuário encontrado!",
      success: true,
      usuario,
    });
  } catch (error: any) {
    console.error("Tipo do erro:", error.constructor.name);
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      error: "Erro interno do servidor",
      success: false,
      errorType: error.constructor.name,
    });
  }
};

export const atualizarDados = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const idParam = req.params.id;

    if (!idParam) {
      return res.status(400).json({
        error: "ID não fornecido",
        success: false,
      });
    }

    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID deve ser um número",
        success: false,
        receivedId: idParam,
      });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: id },
    });

    if (!usuarioExistente) {
      return res.status(404).json({
        error: "Usuário não encontrado",
        success: false,
        searchedId: id,
      });
    }

    const validatedData: AtualizarUsuarioInput = atualizarUsuarioSchema.parse(
      req.body,
    );

    const updateData: any = {};

    if (validatedData.nome) {
      updateData.nome = validatedData.nome;
    }

    if (validatedData.email) {
      updateData.email = validatedData.email;
    }

    if (validatedData.senha) {
      updateData.senha = await bcrypt.hash(validatedData.senha, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "Nenhum dado fornecido para atualização",
        success: false,
      });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        empresaId: true,
        grupoId: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Usuário atualizado com sucesso!",
      usuario: usuarioAtualizado,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        message: "Dados fornecidos não são válidos",
        errors: error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Tipo do erro:", error.constructor.name);
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      error: "Erro interno do servidor",
      success: false,
      errorType: error.constructor.name,
      message: error.message,
    });
  }
};
