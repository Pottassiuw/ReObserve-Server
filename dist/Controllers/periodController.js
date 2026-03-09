"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscarLancamentosDisponiveis = exports.deletarPeriodo = exports.reabrirPeriodo = exports.fecharPeriodo = exports.criarPeriodo = exports.verPeriodo = exports.listarPeriodos = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const serverUtils_1 = require("../Helpers/serverUtils");
const getEmpresaId = (req) => {
    return req.auth?.user?.empresaId || req.auth?.enterprise?.id || null;
};
const listarPeriodos = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const periodos = await prisma_1.default.periodo.findMany({
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
        return (0, serverUtils_1.sendSuccess)(res, periodosFormatados);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao listar períodos");
    }
};
exports.listarPeriodos = listarPeriodos;
const verPeriodo = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const periodoId = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!periodoId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const periodo = await prisma_1.default.periodo.findFirst({
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
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Período não encontrado");
        }
        return (0, serverUtils_1.sendSuccess)(res, periodo);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao buscar período");
    }
};
exports.verPeriodo = verPeriodo;
const criarPeriodo = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const { dataInicio, dataFim, observacoes } = req.body;
        const periodo = await prisma_1.default.periodo.create({
            data: {
                dataInicio: new Date(dataInicio),
                dataFim: new Date(dataFim),
                observacoes,
                empresaId,
                fechado: false,
            },
        });
        return (0, serverUtils_1.sendSuccess)(res, periodo, "Período criado com sucesso");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao criar período");
    }
};
exports.criarPeriodo = criarPeriodo;
const fecharPeriodo = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const periodoId = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!periodoId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const { lancamentosIds, observacoes } = req.body;
        const periodo = await prisma_1.default.periodo.findFirst({ where: { id: periodoId, empresaId } });
        if (!periodo) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Período não encontrado");
        }
        if (periodo.fechado) {
            return (0, serverUtils_1.sendError)(res, 400, "ALREADY_CLOSED", "Período já está fechado");
        }
        if (lancamentosIds?.length > 0) {
            await prisma_1.default.lancamento.updateMany({
                where: { id: { in: lancamentosIds }, empresaId },
                data: { periodoId },
            });
        }
        const lancamentos = await prisma_1.default.lancamento.findMany({
            where: { periodoId },
            include: { notaFiscal: true },
        });
        const valorTotal = lancamentos.reduce((total, lanc) => total + (lanc.notaFiscal.valor || 0), 0);
        const periodoFechado = await prisma_1.default.periodo.update({
            where: { id: periodoId },
            data: {
                fechado: true,
                dataFechamento: new Date(),
                valorTotal,
                observacoes: observacoes || periodo.observacoes,
            },
            include: { lancamentos: { include: { notaFiscal: true } } },
        });
        return (0, serverUtils_1.sendSuccess)(res, periodoFechado, "Período fechado com sucesso");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao fechar período");
    }
};
exports.fecharPeriodo = fecharPeriodo;
const reabrirPeriodo = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const periodoId = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!periodoId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const { motivo } = req.body;
        const periodo = await prisma_1.default.periodo.findFirst({ where: { id: periodoId, empresaId } });
        if (!periodo) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Período não encontrado");
        }
        if (!periodo.fechado) {
            return (0, serverUtils_1.sendError)(res, 400, "ALREADY_OPEN", "Período já está aberto");
        }
        const periodoReaberto = await prisma_1.default.periodo.update({
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
        return (0, serverUtils_1.sendSuccess)(res, periodoReaberto, "Período reaberto com sucesso");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao reabrir período");
    }
};
exports.reabrirPeriodo = reabrirPeriodo;
const deletarPeriodo = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const periodoId = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!periodoId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const periodo = await prisma_1.default.periodo.findFirst({ where: { id: periodoId, empresaId } });
        if (!periodo) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Período não encontrado");
        }
        await prisma_1.default.lancamento.updateMany({ where: { periodoId }, data: { periodoId: null } });
        await prisma_1.default.periodo.delete({ where: { id: periodoId } });
        return (0, serverUtils_1.sendSuccess)(res, null, "Período deletado com sucesso");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao deletar período");
    }
};
exports.deletarPeriodo = deletarPeriodo;
const buscarLancamentosDisponiveis = async (req, res) => {
    try {
        const empresaId = getEmpresaId(req);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_AUTH", "Empresa não encontrada");
        }
        const lancamentos = await prisma_1.default.lancamento.findMany({
            where: { empresaId, periodoId: null },
            include: {
                notaFiscal: true,
                usuarios: { select: { nome: true } },
            },
            orderBy: { data_lancamento: "desc" },
        });
        return (0, serverUtils_1.sendSuccess)(res, lancamentos);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao buscar lançamentos disponíveis");
    }
};
exports.buscarLancamentosDisponiveis = buscarLancamentosDisponiveis;
