import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";

// Listar todos os períodos
export const listarPeriodos = async (req: Request, res: Response) => {
  try {
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "EMPRESA_ID_NOT_FOUND",
        message: "ID da empresa não fornecido",
      });
    }
    const periodos = await prisma.periodo.findMany({
      where: { empresaId },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
            imagens: true,
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: periodos,
    });
  } catch (error: any) {
    console.error("Erro ao listar períodos:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};
// Buscar período específico com detalhes
export const verPeriodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: parseInt(id),
        empresaId,
      },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
            imagens: true,
            usuarios: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Período não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: periodo,
    });
  } catch (error: any) {
    console.error("Erro ao buscar período:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

// Criar período (aberto)
export const criarPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "EMPRESA_ID_NOT_FOUND",
        message: "ID da empresa não fornecido",
      });
    }

    const { dataInicio, dataFim, observacoes } = req.body;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Data de início e fim são obrigatórias",
      });
    }

    // Verificar se já existe período aberto
    const periodoAberto = await prisma.periodo.findFirst({
      where: {
        empresaId,
        fechado: false,
      },
    });

    if (periodoAberto) {
      return res.status(400).json({
        success: false,
        error: "OPEN_PERIOD_EXISTS",
        message: "Já existe um período aberto. Feche-o antes de criar um novo.",
      });
    }

    const periodo = await prisma.periodo.create({
      data: {
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        fechado: false,
        observacoes,
        empresaId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Período criado com sucesso",
      data: periodo,
    });
  } catch (error: any) {
    console.error("Erro ao criar período:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

// Fechar período - associa lançamentos e calcula total
export const fecharPeriodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;
    const { lancamentosIds, observacoes } = req.body;

    if (
      !lancamentosIds ||
      !Array.isArray(lancamentosIds) ||
      lancamentosIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "NO_RELEASES_SELECTED",
        message: "Selecione pelo menos um lançamento para fechar o período",
      });
    }

    // Buscar período
    const periodo = await prisma.periodo.findFirst({
      where: {
        id: parseInt(id),
        empresaId,
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Período não encontrado",
      });
    }

    if (periodo.fechado) {
      return res.status(400).json({
        success: false,
        error: "ALREADY_CLOSED",
        message: "Este período já está fechado",
      });
    }

    // Buscar lançamentos e calcular valor total
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        id: { in: lancamentosIds.map((id: any) => parseInt(id)) },
        empresaId,
      },
      include: {
        notaFiscal: true,
      },
    });

    if (lancamentos.length === 0) {
      return res.status(404).json({
        success: false,
        error: "NO_RELEASES_FOUND",
        message: "Nenhum lançamento encontrado",
      });
    }
    // Calcular valor total
    const valorTotal = lancamentos.reduce(
      (total: number, lanc: (typeof lancamentos)[0]) => {
        return total + (lanc.notaFiscal?.valor || 0);
      },
      0,
    );

    // Atualizar período e associar lançamentos
    const periodoAtualizado = await prisma.periodo.update({
      where: { id: parseInt(id) },
      data: {
        fechado: true,
        valorTotal,
        observacoes,
        dataFechamento: new Date(),
        lancamentos: {
          connect: lancamentosIds.map((lancId: number) => ({ id: lancId })),
        },
      },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
            imagens: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Período fechado com sucesso",
      data: periodoAtualizado,
    });
  } catch (error: any) {
    console.error("Erro ao fechar período:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

// Reabrir período
export const reabrirPeriodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;
    const { motivo } = req.body;

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: parseInt(id),
        empresaId,
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Período não encontrado",
      });
    }

    if (!periodo.fechado) {
      return res.status(400).json({
        success: false,
        error: "NOT_CLOSED",
        message: "Este período já está aberto",
      });
    }

    const periodoAtualizado = await prisma.periodo.update({
      where: { id: parseInt(id) },
      data: {
        fechado: false,
        dataFechamento: null,
        observacoes: motivo
          ? `${periodo.observacoes || ""}\n\nReaberto: ${motivo}`
          : periodo.observacoes,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Período reaberto com sucesso",
      data: periodoAtualizado,
    });
  } catch (error: any) {
    console.error("Erro ao reabrir período:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

// Deletar período
export const deletarPeriodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: parseInt(id),
        empresaId,
      },
    });
    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Período não encontrado",
      });
    }
    // Desassociar lançamentos antes de deletar
    await prisma.lancamento.updateMany({
      where: { periodoId: parseInt(id) },
      data: { periodoId: null },
    });

    await prisma.periodo.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Período deletado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao deletar período:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

// Buscar lançamentos disponíveis para fechar período
export const buscarLancamentosDisponiveis = async (
  req: Request,
  res: Response,
) => {
  try {
    const { periodoId } = req.params;
    const empresaId = req.auth?.enterprise?.id || req.auth?.user?.empresaId;

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: parseInt(periodoId),
        empresaId,
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Período não encontrado",
      });
    }

    // Buscar lançamentos dentro do período que ainda não estão associados
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        empresaId,
        periodoId: null, // Apenas lançamentos sem período
        data_lancamento: {
          gte: periodo.dataInicio,
          lte: periodo.dataFim,
        },
      },
      include: {
        notaFiscal: true,
        imagens: true,
        usuarios: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        data_lancamento: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: lancamentos,
    });
  } catch (error: any) {
    console.error("Erro ao buscar lançamentos disponíveis:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};
