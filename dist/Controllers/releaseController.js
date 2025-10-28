"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletarLancamento = exports.verLancamento = exports.verTodosLancamentos = exports.criarLancamento = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const releaseHelpers_1 = require("../Helpers/releaseHelpers");
const criarLancamento = async (req, res) => {
    try {
        const { data_lancamento, latitude, longitude, notaFiscal, imagensUrls, periodoId, usuarioId, empresaId: empresaIdBody, } = req.body;
        if (!data_lancamento ||
            !latitude ||
            !longitude ||
            !notaFiscal ||
            !imagensUrls) {
            return res.status(400).json({
                success: false,
                error: "MISSING_FIELDS",
                message: "Dados obrigatórios não fornecidos",
            });
        }
        if (!Array.isArray(imagensUrls) || imagensUrls.length === 0) {
            return res.status(400).json({
                success: false,
                error: "NO_IMAGES",
                message: "Pelo menos uma imagem é necessária",
            });
        }
        let empresaId;
        let finalUsuarioId;
        if (req.auth?.enterprise?.id) {
            empresaId = req.auth.enterprise.id;
            finalUsuarioId = usuarioId || req.auth.enterprise.id;
        }
        else if (req.auth?.user) {
            empresaId = req.auth.user.empresaId;
            finalUsuarioId = req.auth.user.id;
        }
        else {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Usuário não autenticado",
            });
        }
        if (!empresaId || isNaN(empresaId)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_EMPRESA_ID",
                message: "ID da empresa inválido",
            });
        }
        const notaFiscalCriada = await (0, releaseHelpers_1.criarNotaFiscal)({
            ...notaFiscal,
            empresaId,
        });
        if (!notaFiscalCriada) {
            return res.status(500).json({
                success: false,
                error: "TAX_NOTE_NOT_CREATED",
                message: "Erro ao criar nota fiscal",
            });
        }
        const lancamento = await prisma_1.default.lancamento.create({
            data: {
                data_lancamento: new Date(data_lancamento),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                notaFiscalId: notaFiscalCriada.id,
                usuarioId: finalUsuarioId,
                empresaId,
                periodoId: periodoId ? parseInt(periodoId) : null,
                imagens: {
                    create: imagensUrls.map((url) => ({ url })),
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
    }
    catch (error) {
        console.error("Erro ao criar lançamento:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.criarLancamento = criarLancamento;
const verTodosLancamentos = async (req, res) => {
    try {
        let empresaId;
        if (req.auth?.enterprise?.id) {
            empresaId = req.auth.enterprise.id;
        }
        else if (req.auth?.user?.empresaId) {
            empresaId = req.auth.user.empresaId;
        }
        else if (req.params.empresaId) {
            empresaId = parseInt(req.params.empresaId);
        }
        if (!empresaId || isNaN(empresaId)) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "ID da empresa não fornecido ou inválido",
            });
        }
        const lancamentos = await prisma_1.default.lancamento.findMany({
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
    }
    catch (error) {
        console.error("Erro ao buscar lançamentos:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.verTodosLancamentos = verTodosLancamentos;
const verLancamento = async (req, res) => {
    try {
        const { id } = req.params;
        const empresaId = req.auth.user.empresaId;
        const lancamento = await prisma_1.default.lancamento.findFirst({
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
    }
    catch (error) {
        console.error("Erro ao buscar lançamento:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.verLancamento = verLancamento;
const deletarLancamento = async (req, res) => {
    try {
        const { id } = req.params;
        const empresaId = req.auth.user.empresaId;
        const lancamento = await prisma_1.default.lancamento.findFirst({
            where: {
                id: parseInt(id),
                empresaId: empresaId,
            },
            include: {
                imagens: true,
                notaFiscal: true,
            },
        });
        if (!lancamento) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lançamento não encontrado",
            });
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.imagem.deleteMany({
                where: {
                    lancamentoId: lancamento.id,
                },
            });
            await tx.lancamento.delete({
                where: {
                    id: lancamento.id,
                },
            });
            if (lancamento.notaFiscalId) {
                await tx.notaFiscal.delete({
                    where: {
                        id: lancamento.notaFiscalId,
                    },
                });
            }
        });
        return res.status(200).json({
            success: true,
            message: "Lançamento deletado com sucesso",
        });
    }
    catch (error) {
        console.error("Erro ao deletar lançamento:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.deletarLancamento = deletarLancamento;
