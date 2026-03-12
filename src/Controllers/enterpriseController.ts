import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../Database/prisma/prisma";
import {
  AtualizarEmpresaInput,
  atualizarEmpresaSchema,
} from "../libs/enterpriseSchemas";
import bcrypt from "bcrypt";
import { z } from "zod";
import { lookupCNPJ, isValidCNPJ, cleanCNPJ } from "../Helpers/cnpjLookup";
import {
  sendError,
  sendSuccess,
  handleControllerError,
  parseIdParam,
} from "../Helpers/serverUtils";

export const retornarEmpresas = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const enterprises = await prisma.empresa.findMany();
    return sendSuccess(res, enterprises, "Empresas encontradas!");
  } catch (error) {
    return handleControllerError(res, error);
  }
};
export const retornarEmpresasId = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const empresa = await prisma.empresa.findFirst({ where: { id } });
    if (!empresa) {
      return sendError(res, 404, "NOT_FOUND", "Empresa não encontrada");
    }

    return sendSuccess(res, empresa, "Empresa encontrada!");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const retornarUsuariosEmpresa = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const empresaId = parseIdParam(req.params.empresaId);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_ID", "ID da empresa inválido");
    }

    const users = await prisma.usuario.findMany({
      where: { empresaId },
      include: { grupo: true, empresa: true },
    });

    return sendSuccess(res, users, "Usuários encontrados!");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteUserData = async (
  tx: Prisma.TransactionClient,
  userIds: number[],
  empresaId: number,
) => {
  const lancamentos = await tx.lancamento.findMany({
    where: { usuarioId: { in: userIds }, empresaId },
    include: { imagens: true, notaFiscal: true },
  });

  if (lancamentos.length > 0) {
    const lancamentoIds = lancamentos.map((l) => l.id);
    await tx.imagem.deleteMany({
      where: { lancamentoId: { in: lancamentoIds } },
    });

    const notaFiscalIds = lancamentos
      .map((l) => l.notaFiscalId)
      .filter((id): id is number => id !== null);

    if (notaFiscalIds.length > 0) {
      await tx.notaFiscal.deleteMany({ where: { id: { in: notaFiscalIds } } });
    }

    await tx.lancamento.deleteMany({ where: { id: { in: lancamentoIds } } });
  }

  await tx.usuario.deleteMany({ where: { id: { in: userIds } } });
};

export const deletarTodosUsuariosEmpresa = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const usuarios = await prisma.usuario.findMany({
      where: { empresaId: id },
    });
    if (!usuarios.length) {
      return sendError(res, 404, "NOT_FOUND", "Não há usuários para deletar");
    }

    let userIdToExclude: number | null = null;
    if (req.auth?.type === "user" && req.auth.user) {
      userIdToExclude = req.auth.user.id;
    }

    const userFilter = userIdToExclude
      ? { empresaId: id, id: { not: userIdToExclude } }
      : { empresaId: id };

    const usersToDelete = await prisma.usuario.findMany({
      where: userFilter,
      select: { id: true },
    });
    const userIds = usersToDelete.map((u) => u.id);

    if (userIds.length === 0) {
      return sendError(res, 404, "NOT_FOUND", "Não há usuários para deletar");
    }

    await prisma.$transaction(async (tx) => deleteUserData(tx, userIds, id));

    return sendSuccess(
      res,
      null,
      userIdToExclude
        ? "Usuários deletados! (Você não foi deletado)"
        : "Todos os usuários deletados!",
    );
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const deletarUsuario = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    const idUser = parseIdParam(req.params.userId);

    if (!id || !idUser) {
      return sendError(res, 400, "INVALID_ID", "IDs inválidos");
    }

    if (req.auth?.type === "user" && req.auth.user?.id === idUser) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Você não pode deletar a si mesmo",
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: idUser, empresaId: id },
    });
    if (!usuario) {
      return sendError(res, 404, "NOT_FOUND", "Usuário não encontrado");
    }

    await prisma.$transaction(async (tx) => deleteUserData(tx, [idUser], id));

    return sendSuccess(res, null, "Usuário deletado com sucesso!");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const deletarEmpresa = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const empresa = await prisma.empresa.findFirst({ where: { id } });
    if (!empresa) {
      return sendError(res, 404, "NOT_FOUND", "Empresa não encontrada");
    }

    await prisma.empresa.delete({ where: { id } });
    return sendSuccess(res, null, `Empresa ${empresa.nomeFantasia} deletada!`);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const deletarTodasEmpresas = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const empresas = await prisma.empresa.findMany();
    if (!empresas.length) {
      return sendError(res, 404, "NOT_FOUND", "Nenhuma empresa encontrada");
    }

    await prisma.empresa.deleteMany();
    return sendSuccess(res, null, `${empresas.length} empresas deletadas!`);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export const atualizarEmpresa = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const empresaExistente = await prisma.empresa.findUnique({ where: { id } });
    if (!empresaExistente) {
      return sendError(res, 404, "NOT_FOUND", "Empresa não encontrada");
    }

    const validatedData: AtualizarEmpresaInput = atualizarEmpresaSchema.parse(
      req.body,
    );

    const updateData: Record<string, unknown> = {};
    const fields = [
      "razaoSocial",
      "nomeFantasia",
      "endereco",
      "situacaoCadastral",
      "naturezaJuridica",
      "CNAES",
    ];

    for (const field of fields) {
      if (validatedData[field as keyof AtualizarEmpresaInput] !== undefined) {
        updateData[field] = validatedData[field as keyof AtualizarEmpresaInput];
      }
    }

    if (validatedData.senha) {
      updateData.senha = await bcrypt.hash(validatedData.senha, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return sendError(
        res,
        400,
        "NO_DATA",
        "Nenhum dado fornecido para atualização",
      );
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        cnpj: true,
        razaoSocial: true,
        nomeFantasia: true,
        endereco: true,
        situacaoCadastral: true,
        naturezaJuridica: true,
        CNAES: true,
      },
    });

    return sendSuccess(res, empresaAtualizada, "Empresa atualizada!");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, "VALIDATION_ERROR", "Dados inválidos", {
        errors: error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }
    return handleControllerError(res, error);
  }
};

export const lookupCNPJEndpoint = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { cnpj } = req.params;

    if (!cnpj) {
      return sendError(res, 400, "INVALID_ID", "CNPJ é obrigatório");
    }

    const cleanedCNPJ = cleanCNPJ(cnpj);

    if (!isValidCNPJ(cleanedCNPJ)) {
      return sendError(res, 400, "INVALID_CNPJ", "CNPJ com formato inválido");
    }

    const enterpriseData = await lookupCNPJ(cleanedCNPJ);

    if (!enterpriseData) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "CNPJ não encontrado na receita federal",
      );
    }

    return sendSuccess(res, enterpriseData, "Dados da empresa encontrados!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("CNPJ")) {
      return sendError(res, 400, "VALIDATION_ERROR", errorMessage);
    }
    if (errorMessage.includes("timeout")) {
      return sendError(res, 504, "TIMEOUT", "Timeout ao buscar dados do CNPJ");
    }

    return handleControllerError(res, error);
  }
};
