import { Request, Response } from "express";
import prisma from "../Database/prisma/prisma";
import { sendError, sendSuccess, handleControllerError, parseIdParam } from "../Helpers/serverUtils";

const getEmpresaId = (req: Request): number | null => {
  return req.auth?.user?.empresaId || req.auth?.enterprise?.id || null;
};

export const listarPeriodos = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
    }

    const periodos = await prisma.periodo.findMany({
      where: { empresaId },
      include: { lancamentos: { include: { notaFiscal: true } } },
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

    return sendSuccess(res, periodosFormatados);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao listar períodos");
  }
};

export const verPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
    }

    const periodoId = parseIdParam(req.params.id);
    if (!periodoId) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const periodo = await prisma.periodo.findFirst({
      where: { id: periodoId, empresaId },
      include: {
        lancamentos: {
          include: {
            notaFiscal: true,
            usuarios: { select: { nome: true, email: true } },
          },
        },
      },
    });

    if (!periodo) {
      return sendError(res, 404, "NOT_FOUND", "Período não encontrado");
    }

    return sendSuccess(res, periodo);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar período");
  }
};

export const criarPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
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

    return sendSuccess(res, periodo, "Período criado com sucesso");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao criar período");
  }
};

export const fecharPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
    }

    const periodoId = parseIdParam(req.params.id);
    if (!periodoId) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const { lancamentosIds, observacoes } = req.body;

    const periodo = await prisma.periodo.findFirst({ where: { id: periodoId, empresaId } });

    if (!periodo) {
      return sendError(res, 404, "NOT_FOUND", "Período não encontrado");
    }

    if (periodo.fechado) {
      return sendError(res, 400, "ALREADY_CLOSED", "Período já está fechado");
    }

    if (lancamentosIds?.length > 0) {
      await prisma.lancamento.updateMany({
        where: { id: { in: lancamentosIds }, empresaId },
        data: { periodoId },
      });
    }

    const lancamentos = await prisma.lancamento.findMany({
      where: { periodoId },
      include: { notaFiscal: true },
    });

    const valorTotal = lancamentos.reduce((total, lanc) => total + (lanc.notaFiscal.valor || 0), 0);

    const periodoFechado = await prisma.periodo.update({
      where: { id: periodoId },
      data: {
        fechado: true,
        dataFechamento: new Date(),
        valorTotal,
        observacoes: observacoes || periodo.observacoes,
      },
      include: { lancamentos: { include: { notaFiscal: true } } },
    });

    return sendSuccess(res, periodoFechado, "Período fechado com sucesso");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao fechar período");
  }
};

export const reabrirPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
    }

    const periodoId = parseIdParam(req.params.id);
    if (!periodoId) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const { motivo } = req.body;

    const periodo = await prisma.periodo.findFirst({ where: { id: periodoId, empresaId } });

    if (!periodo) {
      return sendError(res, 404, "NOT_FOUND", "Período não encontrado");
    }

    if (!periodo.fechado) {
      return sendError(res, 400, "ALREADY_OPEN", "Período já está aberto");
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
      include: { lancamentos: { include: { notaFiscal: true } } },
    });

    return sendSuccess(res, periodoReaberto, "Período reaberto com sucesso");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao reabrir período");
  }
};

export const deletarPeriodo = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
    }

    const periodoId = parseIdParam(req.params.id);
    if (!periodoId) {
      return sendError(res, 400, "INVALID_ID", "ID inválido");
    }

    const periodo = await prisma.periodo.findFirst({ where: { id: periodoId, empresaId } });

    if (!periodo) {
      return sendError(res, 404, "NOT_FOUND", "Período não encontrado");
    }

    await prisma.lancamento.updateMany({ where: { periodoId }, data: { periodoId: null } });
    await prisma.periodo.delete({ where: { id: periodoId } });

    return sendSuccess(res, null, "Período deletado com sucesso");
  } catch (error) {
    return handleControllerError(res, error, "Erro ao deletar período");
  }
};

export const buscarLancamentosDisponiveis = async (req: Request, res: Response) => {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return sendError(res, 400, "INVALID_AUTH", "Empresa não encontrada");
    }

    const lancamentos = await prisma.lancamento.findMany({
      where: { empresaId, periodoId: null },
      include: {
        notaFiscal: true,
        usuarios: { select: { nome: true } },
      },
      orderBy: { data_lancamento: "desc" },
    });

    return sendSuccess(res, lancamentos);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar lançamentos disponíveis");
  }
};
