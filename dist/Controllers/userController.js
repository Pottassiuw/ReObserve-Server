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
const serverUtils_1 = require("../Helpers/serverUtils");
const retornarUsuarios = async (req, res) => {
    try {
        const users = await prisma_1.default.usuario.findMany({
            include: { grupo: true, empresa: true },
        });
        return (0, serverUtils_1.sendSuccess)(res, users, "Usuários encontrados!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao buscar usuários");
    }
};
exports.retornarUsuarios = retornarUsuarios;
const retornarUsuarioId = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!id) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const usuario = await prisma_1.default.usuario.findFirst({
            where: { id },
            include: { grupo: true, empresa: true },
        });
        if (!usuario) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Usuário não encontrado");
        }
        return (0, serverUtils_1.sendSuccess)(res, usuario, "Usuário encontrado!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao buscar usuário");
    }
};
exports.retornarUsuarioId = retornarUsuarioId;
const atualizarDados = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!id) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const usuarioExistente = await prisma_1.default.usuario.findUnique({ where: { id } });
        if (!usuarioExistente) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Usuário não encontrado");
        }
        const validatedData = userSchemas_1.atualizarUsuarioSchema.parse(req.body);
        const updateData = {};
        if (validatedData.nome)
            updateData.nome = validatedData.nome;
        if (validatedData.email)
            updateData.email = validatedData.email;
        if (validatedData.senha)
            updateData.senha = await bcrypt_1.default.hash(validatedData.senha, 12);
        if (Object.keys(updateData).length === 0) {
            return (0, serverUtils_1.sendError)(res, 400, "NO_DATA", "Nenhum dado fornecido para atualização");
        }
        const usuarioAtualizado = await prisma_1.default.usuario.update({
            where: { id },
            data: updateData,
            select: { id: true, nome: true, email: true, cpf: true, empresaId: true, grupoId: true },
        });
        return (0, serverUtils_1.sendSuccess)(res, usuarioAtualizado, "Usuário atualizado!");
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, serverUtils_1.sendError)(res, 400, "VALIDATION_ERROR", "Dados inválidos", {
                errors: error.issues.map((err) => ({ field: err.path.join("."), message: err.message })),
            });
        }
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao atualizar usuário");
    }
};
exports.atualizarDados = atualizarDados;
