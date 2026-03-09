"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarLancamento = exports.deletarLancamento = exports.verLancamento = exports.verTodosLancamentos = exports.criarLancamento = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const releaseHelpers_1 = require("../Helpers/releaseHelpers");
const validationSchemas_1 = require("../Helpers/validationSchemas");
const criarLancamento = async (req, res) => {
    try {
        const validation = (0, validationSchemas_1.validateCriarLancamentoRequest)(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Dados de criação inválidos",
                details: validation.errors,
            });
        }
        const { data_lancamento, latitude, longitude, notaFiscal, imagensUrls, periodoId, usuarioId, } = validation.data;
        if (!notaFiscal) {
            return res.status(400).json({
                success: false,
                error: "MISSING_NFE_DATA",
                message: "Dados da nota fiscal são obrigatórios",
            });
        }
        let empresaId;
        let finalUsuarioId = null;
        if (req.auth?.enterprise?.id) {
            empresaId = req.auth.enterprise.id;
            if (usuarioId) {
                const usuario = await prisma_1.default.usuario.findFirst({
                    where: {
                        id: usuarioId,
                        empresaId,
                    },
                });
                if (!usuario) {
                    return res.status(400).json({
                        success: false,
                        error: "INVALID_USER",
                        message: "Usuário não pertence a esta empresa",
                    });
                }
                finalUsuarioId = usuarioId;
            }
            else {
                const primeiroUsuario = await prisma_1.default.usuario.findFirst({
                    where: { empresaId },
                });
                if (primeiroUsuario) {
                    finalUsuarioId = primeiroUsuario.id;
                }
            }
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
        if (!empresaId || Number.isNaN(empresaId)) {
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
        const lancamentoData = {
            data_lancamento: new Date(data_lancamento),
            latitude,
            longitude,
            notaFiscalId: notaFiscalCriada.id,
            empresaId,
            periodoId: periodoId ?? null,
            imagens: {
                create: imagensUrls.map((url) => ({ url })),
            },
        };
        if (finalUsuarioId) {
            lancamentoData.usuarioId = finalUsuarioId;
        }
        const lancamento = await prisma_1.default.lancamento.create({
            data: lancamentoData,
            include: {
                imagens: true,
                notaFiscal: true,
                usuarios: true,
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
        if (error?.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: "DUPLICATE_NFE",
                message: "Já existe uma nota fiscal cadastrada com este número de NFe",
            });
        }
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
        let empresaId;
        if (req.auth?.enterprise?.id) {
            empresaId = req.auth.enterprise.id;
        }
        else if (req.auth?.user?.empresaId) {
            empresaId = req.auth.user.empresaId;
        }
        else {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Usuário não autenticado",
            });
        }
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
        let empresaId;
        if (req.auth?.enterprise?.id) {
            empresaId = req.auth.enterprise.id;
        }
        else if (req.auth?.user?.empresaId) {
            empresaId = req.auth.user.empresaId;
        }
        else {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Usuário não autenticado",
            });
        }
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
const atualizarLancamento = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate request body
        const validation = (0, validationSchemas_1.validateAtualizarLancamentoRequest)(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Dados de atualização inválidos",
                details: validation.errors,
            });
        }
        const { data_lancamento, latitude, longitude, periodoId, notaFiscal, imagensUrls, } = validation.data;
        let empresaId;
        if (req.auth?.enterprise?.id) {
            empresaId = req.auth.enterprise.id;
        }
        else if (req.auth?.user?.empresaId) {
            empresaId = req.auth.user.empresaId;
        }
        else {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Usuário não autenticado",
            });
        }
        // Buscar lançamento existente
        const lancamentoExistente = await prisma_1.default.lancamento.findFirst({
            where: {
                id: parseInt(id),
                empresaId: empresaId,
            },
            include: {
                notaFiscal: true,
                imagens: true,
            },
        });
        if (!lancamentoExistente) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Lançamento não encontrado",
            });
        }
        // Preparar dados de atualização do lançamento
        const updateLancamentoData = {};
        if (data_lancamento) {
            updateLancamentoData.data_lancamento = new Date(data_lancamento);
        }
        if (latitude !== undefined) {
            updateLancamentoData.latitude = parseFloat(latitude);
        }
        if (longitude !== undefined) {
            updateLancamentoData.longitude = parseFloat(longitude);
        }
        if (periodoId !== undefined) {
            updateLancamentoData.periodoId = periodoId ? parseInt(periodoId) : null;
        }
        // Preparar dados de atualização da nota fiscal
        const updateNotaFiscalData = {};
        if (notaFiscal) {
            if (notaFiscal.numero) {
                updateNotaFiscalData.numero = notaFiscal.numero;
            }
            if (notaFiscal.valor !== undefined && notaFiscal.valor !== null) {
                updateNotaFiscalData.valor = notaFiscal.valor;
            }
            if (notaFiscal.dataEmissao) {
                updateNotaFiscalData.dataEmissao = new Date(notaFiscal.dataEmissao);
            }
            if (notaFiscal.xmlPath !== undefined) {
                updateNotaFiscalData.xmlPath = notaFiscal.xmlPath;
            }
            if (notaFiscal.xmlContent !== undefined) {
                updateNotaFiscalData.xmlContent = notaFiscal.xmlContent;
            }
        }
        // Atualizar usando transação
        const resultado = await prisma_1.default.$transaction(async (tx) => {
            // Atualizar nota fiscal se houver dados
            if (Object.keys(updateNotaFiscalData).length > 0) {
                await tx.notaFiscal.update({
                    where: { id: lancamentoExistente.notaFiscalId },
                    data: updateNotaFiscalData,
                });
            }
            // Atualizar imagens se fornecidas
            if (imagensUrls && Array.isArray(imagensUrls)) {
                // Deletar imagens antigas
                await tx.imagem.deleteMany({
                    where: { lancamentoId: lancamentoExistente.id },
                });
                // Criar novas imagens
                if (imagensUrls.length > 0) {
                    await tx.imagem.createMany({
                        data: imagensUrls.map((url) => ({
                            url,
                            lancamentoId: lancamentoExistente.id,
                        })),
                    });
                }
            }
            // Atualizar lançamento se houver dados
            let lancamentoAtualizado = lancamentoExistente;
            if (Object.keys(updateLancamentoData).length > 0) {
                lancamentoAtualizado = await tx.lancamento.update({
                    where: { id: lancamentoExistente.id },
                    data: updateLancamentoData,
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
            }
            else {
                // Se não atualizou o lançamento, buscar novamente com includes
                lancamentoAtualizado = await tx.lancamento.findUnique({
                    where: { id: lancamentoExistente.id },
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
            }
            return lancamentoAtualizado;
        });
        return res.status(200).json({
            success: true,
            message: "Lançamento atualizado com sucesso",
            data: resultado,
        });
    }
    catch (error) {
        console.error("Erro ao atualizar lançamento:", error);
        return res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
};
exports.atualizarLancamento = atualizarLancamento;
