import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { CreateGroupRequest } from "../@types/types";
import { Permissoes } from "../generated/prisma";

export const CriarGrupo = async (req: Request, res: Response) => {
  try {
    const enterpriseId = req.auth!.enterprise!.id;
    const { nome, permissoes }: CreateGroupRequest = req.body;

    if (!nome || nome.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "NAME_REQUIRED",
        message: "Nome do grupo é obrigatório",
      });
    }

    if (!permissoes || !Array.isArray(permissoes)) {
      return res.status(400).json({
        success: false,
        error: "PERMISSIONS_INVALID",
        message: "Permissões devem ser fornecidas como array",
      });
    }

    const permissoesValidas = Object.values(Permissoes);
    const permissoesInvalidas = permissoes.filter(
      (p) => !permissoesValidas.includes(p),
    );

    if (permissoesInvalidas.length > 0) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PERMISSIONS",
        message: "Permissões inválidas encontradas",
        invalidPermissions: permissoesInvalidas,
      });
    }

    const grupoExistente = await prisma.grupo.findFirst({
      where: {
        nome: nome.trim(),
        empresaId: enterpriseId,
      },
    });

    if (grupoExistente) {
      return res.status(400).json({
        success: false,
        error: "GROUP_NAME_EXISTS",
        message: "Já existe um grupo com este nome na empresa",
      });
    }

    const grupo = await prisma.grupo.create({
      data: {
        empresaId: enterpriseId,
        nome: nome.trim(),
        permissoes: permissoes,
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Grupo criado com sucesso",
      data: grupo,
    });
  } catch (error: any) {
    console.error("Erro ao criar grupo:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const verGruposEmpresa = async (req: Request, res: Response) => {
  try {
    const enterpriseId = req.auth!.enterprise!.id;

    const grupo = await prisma.grupo.findMany({
      where: { empresaId: enterpriseId },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `${grupo.length} grupos encontrados`,
      data: grupo,
    });
  } catch (error: any) {
    console.error("Erro ao buscar grupos:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const deletarGrupoEmpresa = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const enterpriseId = req.auth!.enterprise!.id;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_ID",
        message: "ID do grupo não fornecido",
      });
    }

    const grupo = await prisma.grupo.findFirst({
      where: {
        id: parseInt(groupId),
        empresaId: enterpriseId,
      },
    });

    if (!grupo) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Grupo não encontrado ou não pertence à sua empresa",
      });
    }

    await prisma.grupo.delete({
      where: { id: parseInt(groupId) },
    });

    return res.status(200).json({
      success: true,
      message: "Grupo deletado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao deletar grupo:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const deletarTodosGruposEmpresa = async (
  req: Request,
  res: Response,
) => {
  try {
    const enterpriseId = req.auth!.enterprise!.id;

    const grupos = await prisma.grupo.findMany({
      where: { empresaId: enterpriseId },
    });

    if (grupos.length === 0) {
      return res.status(404).json({
        success: false,
        error: "NO_GROUPS",
        message: "Não há grupos na empresa para deletar",
      });
    }

    await prisma.grupo.deleteMany({
      where: { empresaId: enterpriseId },
    });

    return res.status(200).json({
      success: true,
      message: `${grupos.length} grupos deletados com sucesso`,
    });
  } catch (error: any) {
    console.error("Erro ao deletar grupos:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const colocarUsuarioGrupo = async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    const enterpriseId = req.auth!.enterprise!.id;

    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_IDS",
        message: "IDs de grupo e usuário são obrigatórios",
      });
    }

    // Validate user exists and belongs to company
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: parseInt(userId),
        empresaId: enterpriseId,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "Usuário não encontrado ou não pertence à sua empresa",
      });
    }

    // Validate group exists and belongs to company
    const grupo = await prisma.grupo.findFirst({
      where: {
        id: parseInt(groupId),
        empresaId: enterpriseId,
      },
    });

    if (!grupo) {
      return res.status(404).json({
        success: false,
        error: "GROUP_NOT_FOUND",
        message: "Grupo não encontrado ou não pertence à sua empresa",
      });
    }

    // Add user to group
    await prisma.usuario.update({
      where: { id: parseInt(userId) },
      data: { grupoId: parseInt(groupId) },
    });

    return res.status(200).json({
      success: true,
      message: "Usuário adicionado ao grupo com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao adicionar usuário ao grupo:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const removerUsuarioGrupo = async (req: Request, res: Response) => {
  try {
    const { grupoId, usuarioId } = req.params;
    const empresaId = req.auth!.enterprise!.id;

    if (!grupoId || !usuarioId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_IDS",
        message: "IDs de grupo e usuário são obrigatórios",
      });
    }

    // Validate user exists, belongs to company and is in the group
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: parseInt(usuarioId),
        empresaId: empresaId,
        grupoId: parseInt(grupoId),
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_IN_GROUP",
        message:
          "Usuário não encontrado no grupo ou não pertence à sua empresa",
      });
    }

    // Remove user from group
    await prisma.usuario.update({
      where: { id: parseInt(usuarioId) },
      data: { grupoId: null },
    });

    return res.status(200).json({
      success: true,
      message: "Usuário removido do grupo com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao remover usuário do grupo:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};
