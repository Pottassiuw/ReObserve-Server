import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";

export const retornarEmpresas = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const enterprise = await prisma.empresa.findMany();
    if (!enterprise) {
      res.status(401).json({
        error: "Empresa não existe",
        success: false,
        code: "NO_ENTERPRISES",
      });
    }
    return res.status(200).json({
      message: "Empresas encontradas!",
      success: true,
      code: "ALL_ENTERPRISES",
      enterprises: enterprise,
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

export const retornarEmpresasId = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    console.log("=== DEBUG GET BY ID ===");
    console.log("req.params:", req.params);
    console.log("req.url:", req.url);

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

    console.log("Buscando empresa com ID:", id);

    // Versão mais simples da query
    const empresa = await prisma.empresa.findFirst({
      where: { id: id },
    });

    console.log(
      "Resultado da query:",
      empresa ? "encontrada" : "não encontrada"
    );

    if (!empresa) {
      return res.status(404).json({
        error: "Empresa não encontrada",
        success: false,
        searchedId: id,
      });
    }

    return res.status(200).json({
      message: "Empresa encontrada!",
      success: true,
      enterprise: empresa,
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

export const deletarTodosUsuariosEmpresa = async (
  req: Request,
  res: Response
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
    const usuarios = await prisma.usuario.findMany({
      where: { empresaId: id },
    });
    if (!usuarios) {
      return res.status(404).json({
        error: "Não há usuários em sua empresa para deletar",
        success: false,
      });
    }
    await prisma.usuario.deleteMany({ where: { empresaId: id } });
    return res.status(200).json({
      success: true,
      message: "TODOS Usuários deletados!",
      code: "USERS_DELETED",
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

export const deletarUsuario = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const idParam = req.params.id;
    const idUserParam = req.params.userId;
    console.log(idParam, idUserParam);

    if (!idParam && idUserParam) {
      return res.status(400).json({
        error: "ID não fornecido da Empresa e do Usuário",
        success: false,
      });
    }
    if (!idParam || !idUserParam) {
      return res.status(400).json({
        error: "ID não fornecido da Empresa ou do Usuário",
        success: false,
      });
    }
    const id = parseInt(idParam);
    const idUser = parseInt(idUserParam);

    if (isNaN(id) || isNaN(idUser)) {
      return res.status(400).json({
        error: "ID deve ser um número para Ambos!",
        success: false,
        receivedId: idParam,
      });
    }
    const usuarios = await prisma.usuario.findUnique({
      where: { id: idUser, empresaId: id },
    });
    if (!usuarios) {
      return res.status(404).json({
        error: "Usuário não existe",
        success: false,
        searchedId: id,
      });
    }
    await prisma.usuario.delete({ where: { id: idUser, empresaId: id } });
    return res.status(200).json({
      success: true,
      code: "USER_DELETED",
      message: "Usuário deletado com sucesso!",
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
export const deletarEmpresa = async (
  req: Request,
  res: Response
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

    const empresa = await prisma.empresa.findFirst({
      where: {
        id,
      },
    });
    if (!empresa) {
      return res.status(400).json({
        success: false,
        code: "NO_ENTERPRISE_FOUND",
      });
    }

    await prisma.empresa.delete({
      where: {
        id,
      },
    });
    return res.status(200).json({
      success: false,
      message: `Empresa ${empresa.nomeFantasia} deletada com sucesso!`,
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

export const deletarTodasEmpresas = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const empresas = await prisma.empresa.findMany();
    if (!empresas) {
      return res.status(400).json({
        success: false,
        code: "NO_ENTERPRISES_FOUND",
      });
    }

    await prisma.empresa.deleteMany();

    return res.status(200).json({
      success: false,
      message: `${empresas.length} Empresas foram deletadas 🔥`
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
