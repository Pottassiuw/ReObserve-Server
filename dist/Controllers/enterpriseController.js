"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarEmpresa = exports.deletarTodasEmpresas = exports.deletarEmpresa = exports.deletarUsuario = exports.deletarTodosUsuariosEmpresa = exports.retornarUsuariosEmpresa = exports.retornarEmpresasId = exports.retornarEmpresas = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const enterpriseSchemas_1 = require("../libs/enterpriseSchemas");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const retornarEmpresas = async (req, res) => {
    try {
        const enterprise = await prisma_1.default.empresa.findMany();
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
    }
    catch (error) {
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
exports.retornarEmpresas = retornarEmpresas;
const retornarEmpresasId = async (req, res) => {
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
        const empresa = await prisma_1.default.empresa.findFirst({
            where: { id: id },
        });
        console.log("Resultado da query:", empresa ? "encontrada" : "não encontrada");
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
    }
    catch (error) {
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
exports.retornarEmpresasId = retornarEmpresasId;
const retornarUsuariosEmpresa = async (req, res) => {
    try {
        const empresaId = parseInt(req.params.empresaId);
        console.log("=== DEBUG GET BY ID ===");
        console.log("EmpresaId:", empresaId);
        if (!empresaId) {
            return res.status(400).json({
                error: "ID da empresa não fornecido",
                success: false,
            });
        }
        const user = await prisma_1.default.usuario.findMany({
            where: {
                empresaId: empresaId,
            },
            include: {
                grupo: true,
                empresa: true,
            },
        });
        if (!user) {
            res.status(401).json({
                error: "Usuário não existe",
                success: false,
                code: "NO_USERS",
            });
        }
        return res.status(200).json({
            message: "Usuários encontrados!",
            success: true,
            code: "ALL_USERS",
            users: user,
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
exports.retornarUsuariosEmpresa = retornarUsuariosEmpresa;
const deletarTodosUsuariosEmpresa = async (req, res) => {
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
        const usuarios = await prisma_1.default.usuario.findMany({
            where: { empresaId: id },
        });
        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                error: "Não há usuários em sua empresa para deletar",
                success: false,
            });
        }
        // Se for um usuário (não empresa) tentando deletar todos, excluir o próprio usuário
        let userIdToExclude = null;
        if (req.auth?.type === "user" && req.auth.user) {
            userIdToExclude = req.auth.user.id;
        }
        // Construir filtro de usuários para deletar
        const userFilter = { empresaId: id };
        if (userIdToExclude) {
            userFilter.id = { not: userIdToExclude };
        }
        // Buscar IDs dos usuários que serão deletados
        const usuariosParaDeletar = await prisma_1.default.usuario.findMany({
            where: userFilter,
            select: { id: true },
        });
        const userIdsParaDeletar = usuariosParaDeletar.map((u) => u.id);
        if (userIdsParaDeletar.length === 0) {
            return res.status(404).json({
                error: "Não há usuários para deletar",
                success: false,
            });
        }
        // Deletar em transação: primeiro os lançamentos, depois os usuários
        await prisma_1.default.$transaction(async (tx) => {
            // 1. Buscar todos os lançamentos dos usuários que serão deletados
            const lancamentos = await tx.lancamento.findMany({
                where: {
                    usuarioId: { in: userIdsParaDeletar },
                    empresaId: id,
                },
                include: {
                    imagens: true,
                    notaFiscal: true,
                },
            });
            // 2. Deletar imagens dos lançamentos
            if (lancamentos.length > 0) {
                const lancamentoIds = lancamentos.map((l) => l.id);
                await tx.imagem.deleteMany({
                    where: {
                        lancamentoId: { in: lancamentoIds },
                    },
                });
                // 3. Deletar notas fiscais dos lançamentos
                const notaFiscalIds = lancamentos
                    .map((l) => l.notaFiscalId)
                    .filter((id) => id !== null);
                if (notaFiscalIds.length > 0) {
                    await tx.notaFiscal.deleteMany({
                        where: {
                            id: { in: notaFiscalIds },
                        },
                    });
                }
                // 4. Deletar lançamentos
                await tx.lancamento.deleteMany({
                    where: {
                        id: { in: lancamentoIds },
                    },
                });
            }
            // 5. Deletar usuários
            await tx.usuario.deleteMany({
                where: userFilter,
            });
        });
        return res.status(200).json({
            success: true,
            message: userIdToExclude
                ? "Usuários deletados! (Você não foi deletado por motivos de segurança)"
                : "TODOS Usuários deletados!",
            code: "USERS_DELETED",
        });
    }
    catch (error) {
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
exports.deletarTodosUsuariosEmpresa = deletarTodosUsuariosEmpresa;
const deletarUsuario = async (req, res) => {
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
        // Verificar se o usuário está tentando se deletar
        if (req.auth?.type === "user" && req.auth.user && req.auth.user.id === idUser) {
            return res.status(403).json({
                error: "Você não pode deletar a si mesmo",
                success: false,
                code: "CANNOT_DELETE_SELF",
            });
        }
        const usuarios = await prisma_1.default.usuario.findUnique({
            where: { id: idUser, empresaId: id },
        });
        if (!usuarios) {
            return res.status(404).json({
                error: "Usuário não existe",
                success: false,
                searchedId: id,
            });
        }
        // Deletar em transação: primeiro os lançamentos relacionados, depois o usuário
        await prisma_1.default.$transaction(async (tx) => {
            // 1. Buscar todos os lançamentos do usuário
            const lancamentos = await tx.lancamento.findMany({
                where: {
                    usuarioId: idUser,
                    empresaId: id,
                },
                include: {
                    imagens: true,
                    notaFiscal: true,
                },
            });
            // 2. Deletar imagens dos lançamentos
            if (lancamentos.length > 0) {
                const lancamentoIds = lancamentos.map((l) => l.id);
                await tx.imagem.deleteMany({
                    where: {
                        lancamentoId: { in: lancamentoIds },
                    },
                });
                // 3. Deletar notas fiscais dos lançamentos
                const notaFiscalIds = lancamentos
                    .map((l) => l.notaFiscalId)
                    .filter((id) => id !== null);
                if (notaFiscalIds.length > 0) {
                    await tx.notaFiscal.deleteMany({
                        where: {
                            id: { in: notaFiscalIds },
                        },
                    });
                }
                // 4. Deletar lançamentos
                await tx.lancamento.deleteMany({
                    where: {
                        id: { in: lancamentoIds },
                    },
                });
            }
            // 5. Deletar usuário
            await tx.usuario.delete({
                where: { id: idUser, empresaId: id },
            });
        });
        return res.status(200).json({
            success: true,
            code: "USER_DELETED",
            message: "Usuário deletado com sucesso!",
        });
    }
    catch (error) {
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
exports.deletarUsuario = deletarUsuario;
const deletarEmpresa = async (req, res) => {
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
        const empresa = await prisma_1.default.empresa.findFirst({
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
        await prisma_1.default.empresa.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            success: false,
            message: `Empresa ${empresa.nomeFantasia} deletada com sucesso!`,
        });
    }
    catch (error) {
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
exports.deletarEmpresa = deletarEmpresa;
const deletarTodasEmpresas = async (req, res) => {
    try {
        const empresas = await prisma_1.default.empresa.findMany();
        if (!empresas) {
            return res.status(400).json({
                success: false,
                code: "NO_ENTERPRISES_FOUND",
            });
        }
        await prisma_1.default.empresa.deleteMany();
        return res.status(200).json({
            success: false,
            message: `${empresas.length} Empresas foram deletadas 🔥`,
        });
    }
    catch (error) {
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
exports.deletarTodasEmpresas = deletarTodasEmpresas;
const atualizarEmpresa = async (req, res) => {
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
        // Verificar se a empresa existe
        const empresaExistente = await prisma_1.default.empresa.findUnique({
            where: { id: id },
        });
        if (!empresaExistente) {
            return res.status(404).json({
                error: "Empresa não encontrada",
                success: false,
                searchedId: id,
            });
        }
        // Validar dados com Zod
        const validatedData = enterpriseSchemas_1.atualizarEmpresaSchema.parse(req.body);
        // Preparar dados para atualização
        const updateData = {};
        if (validatedData.razaoSocial) {
            updateData.razaoSocial = validatedData.razaoSocial;
        }
        if (validatedData.nomeFantasia !== undefined) {
            updateData.nomeFantasia = validatedData.nomeFantasia;
        }
        if (validatedData.endereco) {
            updateData.endereco = validatedData.endereco;
        }
        if (validatedData.situacaoCadastral) {
            updateData.situacaoCadastral = validatedData.situacaoCadastral;
        }
        if (validatedData.naturezaJuridica) {
            updateData.naturezaJuridica = validatedData.naturezaJuridica;
        }
        if (validatedData.CNAES) {
            updateData.CNAES = validatedData.CNAES;
        }
        if (validatedData.senha) {
            // Hash da senha se fornecida
            updateData.senha = await bcrypt_1.default.hash(validatedData.senha, 12);
        }
        // Verificar se há dados para atualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: "Nenhum dado fornecido para atualização",
                success: false,
            });
        }
        // Atualizar empresa
        const empresaAtualizada = await prisma_1.default.empresa.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                cnpj: true,
                razaoSocial: true,
                nomeFantasia: true,
                endereco: true,
                situacaoCadastral: true,
                naturezaJuridica: true,
                CNAES: true,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Empresa atualizada com sucesso!",
            enterprise: empresaAtualizada,
        });
    }
    catch (error) {
        // Erro de validação do Zod
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: "Dados inválidos",
                message: "Dados fornecidos não são válidos",
                errors: error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        // Erro de constraint unique do Prisma
        if (error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: "Dados duplicados",
                message: "Alguns dados já estão em uso por outra empresa",
            });
        }
        console.error("Tipo do erro:", error.constructor.name);
        console.error("Mensagem:", error.message);
        console.error("Stack:", error.stack);
        return res.status(500).json({
            error: "Erro interno do servidor",
            success: false,
            errorType: error.constructor.name,
            message: error.message,
        });
    }
};
exports.atualizarEmpresa = atualizarEmpresa;
