import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { CreateGroupRequest } from "../@types/types";
import { Permissoes } from "@prisma/client";
import { sendError, sendSuccess, handleControllerError, parseIdParam } from "../Helpers/serverUtils";

const getEnterpriseId = (req: Request): number => req.auth!.enterprise!.id;

export const CriarGrupo = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const { nome, permissoes }: CreateGroupRequest = req.body;

    if (!nome?.trim()) {
      return sendError(res, 400, "NAME_REQUIRED", "Nome do grupo é obrigatório");
    }
    if (!permissoes || !Array.isArray(permissoes)) {
      return sendError(res, 400, "PERMISSIONS_INVALID", "Permissões devem ser um array");
    }

    const permissoesValidas = Object.values(Permissoes);
    const permissoesInvalidas = permissoes.filter((p) => !permissoesValidas.includes(p));

    if (permissoesInvalidas.length > 0) {
      return sendError(res, 400, "INVALID_PERMISSIONS", "Permissões inválidas", { invalidPermissions: permissoesInvalidas });
    }

    const grupoExistente = await prisma.grupo.findFirst({ where: { nome: nome.trim(), empresaId: enterpriseId } });
    if (grupoExistente) {
      return sendError(res, 400, "GROUP_NAME_EXISTS", "Já existe um grupo com este nome");
    }

    const grupo = await prisma.grupo.create({
      data: { empresaId: enterpriseId, nome: nome.trim(), permissoes: permissoes },
      include: { usuarios: { select: { id: true, nome: true, email: true } }, _count: { select: { usuarios: true } } },
    });

    return sendSuccess(res, grupo, "Grupo criado com sucesso", 201);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao criar grupo");
  }
};

export const verGruposEmpresa = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);

    const grupos = await prisma.grupo.findMany({
      where: { empresaId: enterpriseId },
      include: { usuarios: { select: { id: true, nome: true, email: true } }, _count: { select: { usuarios: true } } },
    });

    return sendSuccess(res, grupos, `${grupos.length} grupos encontrados`);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar grupos");
  }
};

export const atualizarGrupo = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const grupoId = parseIdParam(req.params.groupId);
    const { nome, permissoes }: CreateGroupRequest = req.body;

    if (!grupoId) {
      return sendError(res, 400, "MISSING_ID", "ID do grupo não fornecido");
    }

    const grupo = await prisma.grupo.findFirst({ where: { id: grupoId, empresaId: enterpriseId } });
    if (!grupo) {
      return sendError(res, 404, "NOT_FOUND", "Grupo não encontrado");
    }

    if (!nome?.trim()) {
      return sendError(res, 400, "NAME_REQUIRED", "Nome do grupo é obrigatório");
    }

    if (!permissoes || !Array.isArray(permissoes)) {
      return sendError(res, 400, "PERMISSIONS_INVALID", "Permissões devem ser um array");
    }

    const permissoesValidas = Object.values(Permissoes);
    const permissoesInvalidas = permissoes.filter((p) => !permissoesValidas.includes(p));

    if (permissoesInvalidas.length > 0) {
      return sendError(res, 400, "INVALID_PERMISSIONS", "Permissões inválidas", { invalidPermissions: permissoesInvalidas });
    }

    const grupoExistente = await prisma.grupo.findFirst({ 
      where: { 
        nome: nome.trim(), 
        empresaId: enterpriseId,
        id: { not: grupoId }
      } 
    });
    if (grupoExistente) {
      return sendError(res, 400, "GROUP_NAME_EXISTS", "Já existe um grupo com este nome");
    }

    const grupoAtualizado = await prisma.grupo.update({
      where: { id: grupoId },
      data: { nome: nome.trim(), permissoes: permissoes },
      include: { usuarios: { select: { id: true, nome: true, email: true } }, _count: { select: { usuarios: true } } },
    });

    return sendSuccess(res, grupoAtualizado, "Grupo atualizado com sucesso");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao atualizar grupo");
  }
};

export const deletarGrupoEmpresa = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const grupoId = parseIdParam(req.params.groupId);

    if (!grupoId) {
      return sendError(res, 400, "MISSING_ID", "ID do grupo não fornecido");
    }

    const grupo = await prisma.grupo.findFirst({ where: { id: grupoId, empresaId: enterpriseId } });
    if (!grupo) {
      return sendError(res, 404, "NOT_FOUND", "Grupo não encontrado");
    }

    await prisma.grupo.delete({ where: { id: grupoId } });
    return sendSuccess(res, null, "Grupo deletado com sucesso");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao deletar grupo");
  }
};

export const deletarTodosGruposEmpresa = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);

    const grupos = await prisma.grupo.findMany({ where: { empresaId: enterpriseId } });
    if (!grupos.length) {
      return sendError(res, 404, "NO_GROUPS", "Não há grupos para deletar");
    }

    await prisma.grupo.deleteMany({ where: { empresaId: enterpriseId } });
    return sendSuccess(res, null, `${grupos.length} grupos deletados!`);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao deletar grupos");
  }
};

export const colocarUsuarioGrupo = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const grupoId = parseIdParam(req.params.groupId);
    const usuarioId = parseIdParam(req.params.userId);

    if (!grupoId || !usuarioId) {
      return sendError(res, 400, "MISSING_IDS", "IDs de grupo e usuário são obrigatórios");
    }

    const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, empresaId: enterpriseId } });
    if (!usuario) {
      return sendError(res, 404, "USER_NOT_FOUND", "Usuário não encontrado");
    }

    const grupo = await prisma.grupo.findFirst({ where: { id: grupoId, empresaId: enterpriseId } });
    if (!grupo) {
      return sendError(res, 404, "GROUP_NOT_FOUND", "Grupo não encontrado");
    }

    await prisma.usuario.update({ where: { id: usuarioId }, data: { grupoId } });
    return sendSuccess(res, null, "Usuário adicionado ao grupo!");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao adicionar usuário ao grupo");
  }
};

export const removerUsuarioGrupo = async (req: Request, res: Response) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const grupoId = parseIdParam(req.params.groupId);
    const usuarioId = parseIdParam(req.params.usuarioId);

    if (!grupoId || !usuarioId) {
      return sendError(res, 400, "MISSING_IDS", "IDs são obrigatórios");
    }

    const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, empresaId: enterpriseId, grupoId } });
    if (!usuario) {
      return sendError(res, 404, "USER_NOT_IN_GROUP", "Usuário não está no grupo");
    }

    await prisma.usuario.update({ where: { id: usuarioId }, data: { grupoId: null } });
    return sendSuccess(res, null, "Usuário removido do grupo!");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao remover usuário do grupo");
  }
};
