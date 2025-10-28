"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletarTodasEmpresas = exports.deletarEmpresa = exports.deletarUsuario = exports.deletarTodosUsuariosEmpresa = exports.retornarUsuariosEmpresa = exports.retornarEmpresasId = exports.retornarEmpresas = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
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
        if (!usuarios) {
            return res.status(404).json({
                error: "Não há usuários em sua empresa para deletar",
                success: false,
            });
        }
        await prisma_1.default.usuario.deleteMany({ where: { empresaId: id } });
        return res.status(200).json({
            success: true,
            message: "TODOS Usuários deletados!",
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
        await prisma_1.default.usuario.delete({ where: { id: idUser, empresaId: id } });
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
