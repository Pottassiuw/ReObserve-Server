"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarDados = exports.retornarUsuarioId = exports.retornarUsuarios = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const retornarUsuarios = async (req, res) => {
    try {
        const user = await prisma_1.default.usuario.findMany({
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
exports.retornarUsuarios = retornarUsuarios;
const retornarUsuarioId = async (req, res) => {
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
        console.log("Buscando Usuário com ID:", id);
        // Versão mais simples da query
        const usuario = await prisma_1.default.usuario.findFirst({
            where: { id: id },
            include: {
                grupo: true,
                empresa: true,
            },
        });
        if (!usuario) {
            return res.status(404).json({
                error: "Usuário não encontrado",
                success: false,
                searchedId: id,
            });
        }
        return res.status(200).json({
            message: "Usuário encontrado!",
            success: true,
            usuario,
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
exports.retornarUsuarioId = retornarUsuarioId;
const atualizarDados = async (req, res) => {
    try {
        const { email, senha, nome } = req.body;
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
        const novosDados = prisma_1.default.usuario.update({
            where: { id: id },
            data: { nome, email, senha },
            select: {
                id: true,
                nome: true,
                email: true,
            },
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
exports.atualizarDados = atualizarDados;
