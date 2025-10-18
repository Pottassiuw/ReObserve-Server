import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { AtualizarUsuarioInput } from "../libs/userSchemas";

type userUpdatePayload = {
  nome?: string;
  senha?: string;
  email?: string;
};

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

    console.log("Buscando Usuário com ID:", id);

    // Versão mais simples da query
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
    const { email, senha, nome }: AtualizarUsuarioInput = req.body;
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

    const novosDados = prisma.usuario.update({
      where: { id: id },
      data: { nome, email, senha },
      select: {
        id: true,
        nome: true,
        email: true,
      },
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
