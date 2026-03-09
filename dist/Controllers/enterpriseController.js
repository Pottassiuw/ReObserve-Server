"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupCNPJEndpoint = exports.atualizarEmpresa = exports.deletarTodasEmpresas = exports.deletarEmpresa = exports.deletarUsuario = exports.deletarTodosUsuariosEmpresa = exports.retornarUsuariosEmpresa = exports.retornarEmpresasId = exports.retornarEmpresas = void 0;
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const enterpriseSchemas_1 = require("../libs/enterpriseSchemas");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const cnpjLookup_1 = require("../Helpers/cnpjLookup");
const serverUtils_1 = require("../Helpers/serverUtils");
const retornarEmpresas = async (req, res) => {
    try {
        const enterprises = await prisma_1.default.empresa.findMany();
        return (0, serverUtils_1.sendSuccess)(res, enterprises, "Empresas encontradas!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.retornarEmpresas = retornarEmpresas;
const retornarEmpresasId = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!id) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const empresa = await prisma_1.default.empresa.findFirst({ where: { id } });
        if (!empresa) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Empresa não encontrada");
        }
        return (0, serverUtils_1.sendSuccess)(res, empresa, "Empresa encontrada!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.retornarEmpresasId = retornarEmpresasId;
const retornarUsuariosEmpresa = async (req, res) => {
    try {
        const empresaId = (0, serverUtils_1.parseIdParam)(req.params.empresaId);
        if (!empresaId) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID da empresa inválido");
        }
        const users = await prisma_1.default.usuario.findMany({
            where: { empresaId },
            include: { grupo: true, empresa: true },
        });
        return (0, serverUtils_1.sendSuccess)(res, users, "Usuários encontrados!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.retornarUsuariosEmpresa = retornarUsuariosEmpresa;
const deleteUserData = async (tx, userIds, empresaId) => {
    const lancamentos = await tx.lancamento.findMany({
        where: { usuarioId: { in: userIds }, empresaId },
        include: { imagens: true, notaFiscal: true },
    });
    if (lancamentos.length > 0) {
        const lancamentoIds = lancamentos.map((l) => l.id);
        await tx.imagem.deleteMany({ where: { lancamentoId: { in: lancamentoIds } } });
        const notaFiscalIds = lancamentos
            .map((l) => l.notaFiscalId)
            .filter((id) => id !== null);
        if (notaFiscalIds.length > 0) {
            await tx.notaFiscal.deleteMany({ where: { id: { in: notaFiscalIds } } });
        }
        await tx.lancamento.deleteMany({ where: { id: { in: lancamentoIds } } });
    }
    await tx.usuario.deleteMany({ where: { id: { in: userIds } } });
};
const deletarTodosUsuariosEmpresa = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!id) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const usuarios = await prisma_1.default.usuario.findMany({ where: { empresaId: id } });
        if (!usuarios.length) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Não há usuários para deletar");
        }
        let userIdToExclude = null;
        if (req.auth?.type === "user" && req.auth.user) {
            userIdToExclude = req.auth.user.id;
        }
        const userFilter = userIdToExclude
            ? { empresaId: id, id: { not: userIdToExclude } }
            : { empresaId: id };
        const usersToDelete = await prisma_1.default.usuario.findMany({ where: userFilter, select: { id: true } });
        const userIds = usersToDelete.map((u) => u.id);
        if (userIds.length === 0) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Não há usuários para deletar");
        }
        await prisma_1.default.$transaction(async (tx) => deleteUserData(tx, userIds, id));
        return (0, serverUtils_1.sendSuccess)(res, null, userIdToExclude
            ? "Usuários deletados! (Você não foi deletado)"
            : "Todos os usuários deletados!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.deletarTodosUsuariosEmpresa = deletarTodosUsuariosEmpresa;
const deletarUsuario = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        const idUser = (0, serverUtils_1.parseIdParam)(req.params.userId);
        if (!id || !idUser) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "IDs inválidos");
        }
        if (req.auth?.type === "user" && req.auth.user?.id === idUser) {
            return (0, serverUtils_1.sendError)(res, 403, "FORBIDDEN", "Você não pode deletar a si mesmo");
        }
        const usuario = await prisma_1.default.usuario.findUnique({ where: { id: idUser, empresaId: id } });
        if (!usuario) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Usuário não encontrado");
        }
        await prisma_1.default.$transaction(async (tx) => deleteUserData(tx, [idUser], id));
        return (0, serverUtils_1.sendSuccess)(res, null, "Usuário deletado com sucesso!");
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.deletarUsuario = deletarUsuario;
const deletarEmpresa = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!id) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const empresa = await prisma_1.default.empresa.findFirst({ where: { id } });
        if (!empresa) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Empresa não encontrada");
        }
        await prisma_1.default.empresa.delete({ where: { id } });
        return (0, serverUtils_1.sendSuccess)(res, null, `Empresa ${empresa.nomeFantasia} deletada!`);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.deletarEmpresa = deletarEmpresa;
const deletarTodasEmpresas = async (req, res) => {
    try {
        const empresas = await prisma_1.default.empresa.findMany();
        if (!empresas.length) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Nenhuma empresa encontrada");
        }
        await prisma_1.default.empresa.deleteMany();
        return (0, serverUtils_1.sendSuccess)(res, null, `${empresas.length} empresas deletadas!`);
    }
    catch (error) {
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.deletarTodasEmpresas = deletarTodasEmpresas;
const atualizarEmpresa = async (req, res) => {
    try {
        const id = (0, serverUtils_1.parseIdParam)(req.params.id);
        if (!id) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "ID inválido");
        }
        const empresaExistente = await prisma_1.default.empresa.findUnique({ where: { id } });
        if (!empresaExistente) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "Empresa não encontrada");
        }
        const validatedData = enterpriseSchemas_1.atualizarEmpresaSchema.parse(req.body);
        const updateData = {};
        const fields = ["razaoSocial", "nomeFantasia", "endereco", "situacaoCadastral", "naturezaJuridica", "CNAES"];
        for (const field of fields) {
            if (validatedData[field] !== undefined) {
                updateData[field] = validatedData[field];
            }
        }
        if (validatedData.senha) {
            updateData.senha = await bcrypt_1.default.hash(validatedData.senha, 12);
        }
        if (Object.keys(updateData).length === 0) {
            return (0, serverUtils_1.sendError)(res, 400, "NO_DATA", "Nenhum dado fornecido para atualização");
        }
        const empresaAtualizada = await prisma_1.default.empresa.update({
            where: { id },
            data: updateData,
            select: {
                id: true, cnpj: true, razaoSocial: true, nomeFantasia: true,
                endereco: true, situacaoCadastral: true, naturezaJuridica: true, CNAES: true,
            },
        });
        return (0, serverUtils_1.sendSuccess)(res, empresaAtualizada, "Empresa atualizada!");
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, serverUtils_1.sendError)(res, 400, "VALIDATION_ERROR", "Dados inválidos", {
                errors: error.issues.map((err) => ({ field: err.path.join("."), message: err.message })),
            });
        }
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.atualizarEmpresa = atualizarEmpresa;
const lookupCNPJEndpoint = async (req, res) => {
    try {
        const { cnpj } = req.params;
        if (!cnpj) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_ID", "CNPJ é obrigatório");
        }
        const cleanedCNPJ = (0, cnpjLookup_1.cleanCNPJ)(cnpj);
        if (!(0, cnpjLookup_1.isValidCNPJ)(cleanedCNPJ)) {
            return (0, serverUtils_1.sendError)(res, 400, "INVALID_CNPJ", "CNPJ com formato inválido");
        }
        const enterpriseData = await (0, cnpjLookup_1.lookupCNPJ)(cleanedCNPJ);
        if (!enterpriseData) {
            return (0, serverUtils_1.sendError)(res, 404, "NOT_FOUND", "CNPJ não encontrado na receita federal");
        }
        return (0, serverUtils_1.sendSuccess)(res, enterpriseData, "Dados da empresa encontrados!");
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("CNPJ")) {
            return (0, serverUtils_1.sendError)(res, 400, "VALIDATION_ERROR", errorMessage);
        }
        if (errorMessage.includes("timeout")) {
            return (0, serverUtils_1.sendError)(res, 504, "TIMEOUT", "Timeout ao buscar dados do CNPJ");
        }
        return (0, serverUtils_1.handleControllerError)(res, error);
    }
};
exports.lookupCNPJEndpoint = lookupCNPJEndpoint;
