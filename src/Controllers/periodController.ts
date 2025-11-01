import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";

export const listarPeriodos = async (req: Request, res: Response) => {
  try {
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }

    const periodos = await prisma.periodo.findMany({
      where: { empresaId: empresaId },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
    });

    const periodosFormatados = periodos.map((p) => ({
      id: p.id,
      dataInicio: p.dataInicio,
      dataFim: p.dataFim,
      fechado: p.fechado,
      valorTotal: p.valorTotal || 0,
      observacoes: p.observacoes,
      dataFechamento: p.dataFechamento,
      lancamentos: p.lancamentos,
    }));

    return res.json({
      success: true,
      data: periodosFormatados,
    });
  } catch (error: any) {
    console.error("Erro ao listar períodos:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao listar períodos",
      message: error.message,
    });
  }
};

export const verPeriodo = async (req: Request, res: Response) => {
  try {
    const periodoId = parseInt(req.params.id);
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: periodoId,
        empresaId,
      },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
            usuarios: {
              select: {
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
        error: "Período não encontrado",
      });
    }

    return res.json({
      success: true,
      data: periodo,
    });
  } catch (error: any) {
    console.error("Erro ao buscar período:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar período",
      message: error.message,
    });
  }
};

export const criarPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }
    const { dataInicio, dataFim, observacoes } = req.body;

    const periodo = await prisma.periodo.create({
      data: {
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        observacoes,
        empresaId,
        fechado: false,
      },
    });

    return res.json({
      success: true,
      data: periodo,
      message: "Período criado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao criar período:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao criar período",
      message: error.message,
    });
  }
};

export const fecharPeriodo = async (req: Request, res: Response) => {
  try {
    const periodoId = parseInt(req.params.id);
    const { lancamentosIds, observacoes } = req.body;
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }
    const periodo = await prisma.periodo.findFirst({
      where: {
        id: periodoId,
        empresaId,
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "Período não encontrado",
      });
    }

    if (periodo.fechado) {
      return res.status(400).json({
        success: false,
        error: "Período já está fechado",
      });
    }

    if (lancamentosIds && lancamentosIds.length > 0) {
      await prisma.lancamento.updateMany({
        where: {
          id: { in: lancamentosIds },
          empresaId,
        },
        data: {
          periodoId: periodoId,
        },
      });
    }

    const lancamentos = await prisma.lancamento.findMany({
      where: { periodoId },
      include: { notaFiscal: true },
    });

    const valorTotal = lancamentos.reduce((total, lanc) => {
      return total + (lanc.notaFiscal.valor || 0);
    }, 0);

    // Fecha o período
    const periodoFechado = await prisma.periodo.update({
      where: { id: periodoId },
      data: {
        fechado: true,
        dataFechamento: new Date(),
        valorTotal: valorTotal,
        observacoes: observacoes || periodo.observacoes,
      },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: periodoFechado,
      message: "Período fechado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao fechar período:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao fechar período",
      message: error.message,
    });
  }
};

export const reabrirPeriodo = async (req: Request, res: Response) => {
  try {
    const periodoId = parseInt(req.params.id);
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }
    const { motivo } = req.body;

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: periodoId,
        empresaId,
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "Período não encontrado",
      });
    }

    if (!periodo.fechado) {
      return res.status(400).json({
        success: false,
        error: "Período já está aberto",
      });
    }

    const periodoReaberto = await prisma.periodo.update({
      where: { id: periodoId },
      data: {
        fechado: false,
        dataFechamento: null,
        observacoes: motivo
          ? `${periodo.observacoes || ""}\n\nReaberto: ${motivo}`
          : periodo.observacoes,
      },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: periodoReaberto,
      message: "Período reaberto com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao reabrir período:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao reabrir período",
      message: error.message,
    });
  }
};

export const deletarPeriodo = async (req: Request, res: Response) => {
  try {
    const periodoId = parseInt(req.params.id);
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }

    const periodo = await prisma.periodo.findFirst({
      where: {
        id: periodoId,
        empresaId,
      },
    });

    if (!periodo) {
      return res.status(404).json({
        success: false,
        error: "Período não encontrado",
      });
    }

    await prisma.lancamento.updateMany({
      where: { periodoId },
      data: { periodoId: null },
    });

    await prisma.periodo.delete({
      where: { id: periodoId },
    });

    return res.json({
      success: true,
      message: "Período deletado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao deletar período:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao deletar período",
      message: error.message,
    });
  }
};

export const buscarLancamentosDisponiveis = async (
  req: Request,
  res: Response,
) => {
  try {
    const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: "Empresa ou usuários não encontrados",
        message: "Não foi possível encontrar a empresa ou usuário",
      });
    }
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        empresaId,
        periodoId: null, // Apenas lançamentos sem período
      },
      include: {
        notaFiscal: true,
        usuarios: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { data_lancamento: "desc" },
    });

    return res.json({
      success: true,
      data: lancamentos,
    });
  } catch (error: any) {
    console.error("Erro ao buscar lançamentos:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar lançamentos disponíveis",
      message: error.message,
    });
  }
};
