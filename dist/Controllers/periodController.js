"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscarLancamentosDisponiveis = exports.deletarPeriodo = exports.reabrirPeriodo = exports.fecharPeriodo = exports.criarPeriodo = exports.verPeriodo = exports.listarPeriodos = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const listarPeriodos = async (req, res) => {
    try {
        const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;
        if (!empresaId) {
            return res.status(400).json({
                success: false,
                error: "Empresa ou usuários não encontrados",
                message: "Não foi possível encontrar a empresa ou usuário",
            });
        }
        const periodos = await prisma_1.default.periodo.findMany({
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
    }
    catch (error) {
        console.error("Erro ao listar períodos:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao listar períodos",
            message: error.message,
        });
    }
};
exports.listarPeriodos = listarPeriodos;
const verPeriodo = async (req, res) => {
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
        const periodo = await prisma_1.default.periodo.findFirst({
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
    }
    catch (error) {
        console.error("Erro ao buscar período:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao buscar período",
            message: error.message,
        });
    }
};
exports.verPeriodo = verPeriodo;
const criarPeriodo = async (req, res) => {
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
        const periodo = await prisma_1.default.periodo.create({
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
    }
    catch (error) {
        console.error("Erro ao criar período:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao criar período",
            message: error.message,
        });
    }
};
exports.criarPeriodo = criarPeriodo;
const fecharPeriodo = async (req, res) => {
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
        const periodo = await prisma_1.default.periodo.findFirst({
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
            await prisma_1.default.lancamento.updateMany({
                where: {
                    id: { in: lancamentosIds },
                    empresaId,
                },
                data: {
                    periodoId: periodoId,
                },
            });
        }
        const lancamentos = await prisma_1.default.lancamento.findMany({
            where: { periodoId },
            include: { notaFiscal: true },
        });
        const valorTotal = lancamentos.reduce((total, lanc) => {
            return total + (lanc.notaFiscal.valor || 0);
        }, 0);
        // Fecha o período
        const periodoFechado = await prisma_1.default.periodo.update({
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
    }
    catch (error) {
        console.error("Erro ao fechar período:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao fechar período",
            message: error.message,
        });
    }
};
exports.fecharPeriodo = fecharPeriodo;
const reabrirPeriodo = async (req, res) => {
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
        const periodo = await prisma_1.default.periodo.findFirst({
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
        const periodoReaberto = await prisma_1.default.periodo.update({
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
    }
    catch (error) {
        console.error("Erro ao reabrir período:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao reabrir período",
            message: error.message,
        });
    }
};
exports.reabrirPeriodo = reabrirPeriodo;
const deletarPeriodo = async (req, res) => {
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
        const periodo = await prisma_1.default.periodo.findFirst({
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
        await prisma_1.default.lancamento.updateMany({
            where: { periodoId },
            data: { periodoId: null },
        });
        await prisma_1.default.periodo.delete({
            where: { id: periodoId },
        });
        return res.json({
            success: true,
            message: "Período deletado com sucesso",
        });
    }
    catch (error) {
        console.error("Erro ao deletar período:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao deletar período",
            message: error.message,
        });
    }
};
exports.deletarPeriodo = deletarPeriodo;
const buscarLancamentosDisponiveis = async (req, res) => {
    try {
        const empresaId = req.auth?.user?.empresaId || req.auth?.enterprise?.id;
        if (!empresaId) {
            return res.status(400).json({
                success: false,
                error: "Empresa ou usuários não encontrados",
                message: "Não foi possível encontrar a empresa ou usuário",
            });
        }
        const lancamentos = await prisma_1.default.lancamento.findMany({
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
    }
    catch (error) {
        console.error("Erro ao buscar lançamentos:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao buscar lançamentos disponíveis",
            message: error.message,
        });
    }
};
exports.buscarLancamentosDisponiveis = buscarLancamentosDisponiveis;
