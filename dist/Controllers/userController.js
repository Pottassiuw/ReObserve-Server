"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarDados = exports.retornarUsuarioId = exports.retornarUsuarios = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const userSchemas_1 = require("../libs/userSchemas");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
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
        const usuarioExistente = await prisma_1.default.usuario.findUnique({
            where: { id: id },
        });
        if (!usuarioExistente) {
            return res.status(404).json({
                error: "Usuário não encontrado",
                success: false,
                searchedId: id,
            });
        }
        const validatedData = userSchemas_1.atualizarUsuarioSchema.parse(req.body);
        const updateData = {};
        if (validatedData.nome) {
            updateData.nome = validatedData.nome;
        }
        if (validatedData.email) {
            updateData.email = validatedData.email;
        }
        if (validatedData.senha) {
            updateData.senha = await bcrypt_1.default.hash(validatedData.senha, 12);
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: "Nenhum dado fornecido para atualização",
                success: false,
            });
        }
        const usuarioAtualizado = await prisma_1.default.usuario.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                nome: true,
                email: true,
                cpf: true,
                empresaId: true,
                grupoId: true,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Usuário atualizado com sucesso!",
            usuario: usuarioAtualizado,
        });
    }
    catch (error) {
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
exports.atualizarDados = atualizarDados;
