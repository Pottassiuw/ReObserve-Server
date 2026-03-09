"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removerUsuarioGrupo = exports.colocarUsuarioGrupo = exports.deletarTodosGruposEmpresa = exports.deletarGrupoEmpresa = exports.atualizarGrupo = exports.verGruposEmpresa = exports.CriarGrupo = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const client_1 = require("@prisma/client");
const serverUtils_1 = require("../Helpers/serverUtils");
const getEnterpriseId = (req) => req.auth.enterprise.id;
const CriarGrupo = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const { nome, permissoes } = req.body;
        if (!nome?.trim()) {
            return (0, serverUtils_1.sendError)(res, 400, "NAME_REQUIRED", "Nome do grupo é obrigatório");
        }
        if (!permissoes || !Array.isArray(permissoes)) {
            return (0, serverUtils_1.sendError)(res, 400, "PERMISSIONS_INVALID", "Permissões devem ser um array");
        }
        const permissoesValidas = Object.values(client_1.Permissoes);
        const permissoesInvalidas = permissoes.filter((p) => !permissoesValidas.includes(p));
        if (permissoesInvalidas.length > 0) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_PERMISSIONS", "Permissões inválidas", { invalidPermissions: permissoesInvalidas });
        }
        const grupoExistente = await prisma_1.default.grupo.findFirst({ where: { nome: nome.trim(), empresaId: enterpriseId } });
        if (grupoExistente) {
            return (0, serverUtils_1.sendError)(res, 400, "GROUP_NAME_EXISTS", "Já existe um grupo com este nome");
        }
        const grupo = await prisma_1.default.grupo.create({
            data: { empresaId: enterpriseId, nome: nome.trim(), permissoes: permissoes },
            include: { usuarios: { select: { id: true, nome: true, email: true } }, _count: { select: { usuarios: true } } },
        });
        return (0, serverUtils_1.sendSuccess)(res, grupo, "Grupo criado com sucesso", 201);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao criar grupo");
    }
};
exports.CriarGrupo = CriarGrupo;
const verGruposEmpresa = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const grupos = await prisma_1.default.grupo.findMany({
            where: { empresaId: enterpriseId },
            include: { usuarios: { select: { id: true, nome: true, email: true } }, _count: { select: { usuarios: true } } },
        });
        return (0, serverUtils_1.sendSuccess)(res, grupos, `${grupos.length} grupos encontrados`);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao buscar grupos");
    }
};
exports.verGruposEmpresa = verGruposEmpresa;
const atualizarGrupo = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const grupoId = (0, serverUtils_1.parseIdParam)(req.params.groupId);
        const { nome, permissoes } = req.body;
        if (!grupoId) {
            return (0, serverUtils_1.sendError)(res, 400, "MISSING_ID", "ID do grupo não fornecido");
        }
        const grupo = await prisma_1.default.grupo.findFirst({ where: { id: grupoId, empresaId: enterpriseId } });
        if (!grupo) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Grupo não encontrado");
        }
        if (!nome?.trim()) {
            return (0, serverUtils_1.sendError)(res, 400, "NAME_REQUIRED", "Nome do grupo é obrigatório");
        }
        if (!permissoes || !Array.isArray(permissoes)) {
            return (0, serverUtils_1.sendError)(res, 400, "PERMISSIONS_INVALID", "Permissões devem ser um array");
        }
        const permissoesValidas = Object.values(client_1.Permissoes);
        const permissoesInvalidas = permissoes.filter((p) => !permissoesValidas.includes(p));
        if (permissoesInvalidas.length > 0) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_PERMISSIONS", "Permissões inválidas", { invalidPermissions: permissoesInvalidas });
        }
        const grupoExistente = await prisma_1.default.grupo.findFirst({
            where: {
                nome: nome.trim(),
                empresaId: enterpriseId,
                id: { not: grupoId }
            }
        });
        if (grupoExistente) {
            return (0, serverUtils_1.sendError)(res, 400, "GROUP_NAME_EXISTS", "Já existe um grupo com este nome");
        }
        const grupoAtualizado = await prisma_1.default.grupo.update({
            where: { id: grupoId },
            data: { nome: nome.trim(), permissoes: permissoes },
            include: { usuarios: { select: { id: true, nome: true, email: true } }, _count: { select: { usuarios: true } } },
        });
        return (0, serverUtils_1.sendSuccess)(res, grupoAtualizado, "Grupo atualizado com sucesso");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao atualizar grupo");
    }
};
exports.atualizarGrupo = atualizarGrupo;
const deletarGrupoEmpresa = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const grupoId = (0, serverUtils_1.parseIdParam)(req.params.groupId);
        if (!grupoId) {
            return (0, serverUtils_1.sendError)(res, 400, "MISSING_ID", "ID do grupo não fornecido");
        }
        const grupo = await prisma_1.default.grupo.findFirst({ where: { id: grupoId, empresaId: enterpriseId } });
        if (!grupo) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Grupo não encontrado");
        }
        await prisma_1.default.grupo.delete({ where: { id: grupoId } });
        return (0, serverUtils_1.sendSuccess)(res, null, "Grupo deletado com sucesso");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao deletar grupo");
    }
};
exports.deletarGrupoEmpresa = deletarGrupoEmpresa;
const deletarTodosGruposEmpresa = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const grupos = await prisma_1.default.grupo.findMany({ where: { empresaId: enterpriseId } });
        if (!grupos.length) {
            return (0, serverUtils_1.sendError)(res, 404, "NO_GROUPS", "Não há grupos para deletar");
        }
        await prisma_1.default.grupo.deleteMany({ where: { empresaId: enterpriseId } });
        return (0, serverUtils_1.sendSuccess)(res, null, `${grupos.length} grupos deletados!`);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao deletar grupos");
    }
};
exports.deletarTodosGruposEmpresa = deletarTodosGruposEmpresa;
const colocarUsuarioGrupo = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const grupoId = (0, serverUtils_1.parseIdParam)(req.params.groupId);
        const usuarioId = (0, serverUtils_1.parseIdParam)(req.params.userId);
        if (!grupoId || !usuarioId) {
            return (0, serverUtils_1.sendError)(res, 400, "MISSING_IDS", "IDs de grupo e usuário são obrigatórios");
        }
        const usuario = await prisma_1.default.usuario.findFirst({ where: { id: usuarioId, empresaId: enterpriseId } });
        if (!usuario) {
            return (0, serverUtils_1.sendError)(res, 404, "USER_NOT_FOUND", "Usuário não encontrado");
        }
        const grupo = await prisma_1.default.grupo.findFirst({ where: { id: grupoId, empresaId: enterpriseId } });
        if (!grupo) {
            return (0, serverUtils_1.sendError)(res, 404, "GROUP_NOT_FOUND", "Grupo não encontrado");
        }
        await prisma_1.default.usuario.update({ where: { id: usuarioId }, data: { grupoId } });
        return (0, serverUtils_1.sendSuccess)(res, null, "Usuário adicionado ao grupo!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao adicionar usuário ao grupo");
    }
};
exports.colocarUsuarioGrupo = colocarUsuarioGrupo;
const removerUsuarioGrupo = async (req, res) => {
    try {
        const enterpriseId = getEnterpriseId(req);
        const grupoId = (0, serverUtils_1.parseIdParam)(req.params.groupId);
        const usuarioId = (0, serverUtils_1.parseIdParam)(req.params.usuarioId);
        if (!grupoId || !usuarioId) {
            return (0, serverUtils_1.sendError)(res, 400, "MISSING_IDS", "IDs são obrigatórios");
        }
        const usuario = await prisma_1.default.usuario.findFirst({ where: { id: usuarioId, empresaId: enterpriseId, grupoId } });
        if (!usuario) {
            return (0, serverUtils_1.sendError)(res, 404, "USER_NOT_IN_GROUP", "Usuário não está no grupo");
        }
        await prisma_1.default.usuario.update({ where: { id: usuarioId }, data: { grupoId: null } });
        return (0, serverUtils_1.sendSuccess)(res, null, "Usuário removido do grupo!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error, "Erro ao remover usuário do grupo");
    }
};
exports.removerUsuarioGrupo = removerUsuarioGrupo;
