import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { criarNotaFiscal } from "../Helpers/releaseHelpers";

// Create lancamento with images
export const criarLancamento = async (req: Request, res: Response) => {
  try {
    const {
      data_lancamento,
      latitude,
      longitude,
      notaFiscal,
      imageUrls,
      periodoId,
    } = req.body;

    if (
      !data_lancamento ||
      !latitude ||
      !longitude ||
      !notaFiscal ||
      !imageUrls
    ) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Dados obrigatórios não fornecidos",
      });
    }

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: "NO_IMAGES",
        message: "Pelo menos uma imagem é necessária",
      });
    }

    const notaFiscalCriada = await criarNotaFiscal({
      ...notaFiscal,
      empresaId: req.auth!.user!.empresaId,
    });

    if (!notaFiscalCriada) {
      return res.status(500).json({
        success: false,
        error: "TAX_NOTE_NOT_CREATED",
        message: "Erro ao criar nota fiscal",
      });
    }

    const lancamento = await prisma.lancamento.create({
      data: {
        data_lancamento: new Date(data_lancamento),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        notaFiscalId: notaFiscalCriada.id,
        usuarioId: req.auth!.user!.id,
        empresaId: req.auth!.user!.empresaId,
        periodoId: periodoId ? parseInt(periodoId) : null,
        imagens: {
          create: imageUrls.map((url: string) => ({ url })),
        },
      },
      include: {
        imagens: true,
        notaFiscal: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Lançamento criado com sucesso",
      data: lancamento,
    });
  } catch (error: any) {
    console.error("Erro ao criar lançamento:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const verTodosLancamentos = async (req: Request, res: Response) => {
  try {
    const empresaId = req.auth!.user!.empresaId;

    const lancamentos = await prisma.lancamento.findMany({
      where: { empresaId },
      include: {
        imagens: true,
        notaFiscal: true,
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: `${lancamentos.length} lançamentos encontrados`,
      data: lancamentos,
    });
  } catch (error: any) {
    console.error("Erro ao buscar lançamentos:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const verLancamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.auth!.user!.empresaId;

    const lancamento = await prisma.lancamento.findFirst({
      where: {
        id: parseInt(id),
        empresaId: empresaId,
      },
      include: {
        imagens: true,
        notaFiscal: true,
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!lancamento) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Lançamento não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: lancamento,
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

export const deletarLancamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.auth!.user!.empresaId;

    const lancamento = await prisma.lancamento.findFirst({
      where: {
        id: parseInt(id),
        empresaId: empresaId,
      },
    });

    if (!lancamento) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Lançamento não encontrado",
      });
    }

    await prisma.lancamento.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Lançamento deletado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao deletar lançamento:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};
