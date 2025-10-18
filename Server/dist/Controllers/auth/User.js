"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarUsuario = exports.logoutUsuario = exports.loginUsuario = void 0;
const authservice_1 = require("../../Helpers/authservice");
const prisma_1 = __importDefault(require("../../Database/prisma/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const userSchemas_1 = require("../../libs/userSchemas");
const criarUsuario = async (req, res) => {
    try {
        const validatedUserData = userSchemas_1.criarUsuarioSchema.parse(req.body);
        const hashedUserPassword = await bcrypt_1.default.hash(validatedUserData.senha, 12);
        const user = await prisma_1.default.usuario.create({
            data: {
                nome: validatedUserData.nome,
                senha: hashedUserPassword,
                email: validatedUserData.email,
                cpf: validatedUserData.cpf,
                empresaId: validatedUserData.empresaId,
                grupoId: validatedUserData.grupoId,
            },
        });
        const { senha: _, ...userResponse } = user;
        return res.status(200).json({
            success: true,
            data: userResponse,
            message: "Usuário criado com sucesso!",
        });
    }
    catch (error) {
        // Erro de validação do Zod
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
                errors: error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        // Erro de constraint unique do Prisma (CPF duplicado)
        if (error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "CPF já está cadastrado",
            });
        }
        // Erro genérico
        console.error("Erro ao criar Usuário:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
        });
    }
};
exports.criarUsuario = criarUsuario;
const loginUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                error: "Email e senha são obrigatórios",
                code: "MISSING_CREDENTIALS",
            });
        }
        const user = await prisma_1.default.usuario.findUnique({
            where: { email: email },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Credenciais inválidas",
                code: "INVALID_CREDENTIALS",
            });
        }
        const isPasswordValid = await authservice_1.AuthService.VerifyHash(user.senha, senha);
        console.log(isPasswordValid);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "Credenciais inválidas",
                code: "INVALID_CREDENTIALS",
            });
        }
        // Gerar token
        const token = authservice_1.AuthService.generateToken("user", user.id);
        res.cookie("auth-token", token, {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Dias
            sameSite: "strict", // Proteção CSRF
        });
        return res.json({
            success: true,
            message: "Login realizado com sucesso!",
            token_debug: token, // Útil para debug e flexibilidade
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                admin: user.admin, // IMPORTANTE
                tipo: "user",
                cpf: user.cpf,
            },
        });
    }
    catch (error) {
        console.error("Erro no login do usuário:", error);
        return res.status(500).json({
            success: false,
            error: "Erro interno do servidor. Tente novamente.",
            code: "INTERNAL_ERROR",
        });
    }
};
exports.loginUsuario = loginUsuario;
const logoutUsuario = async (req, res) => {
    try {
        //Limpar o cookie para deslogar a seção
        res.clearCookie("auth-token", {
            sameSite: "strict",
        });
        return res.status(200).json({
            success: true,
            message: "Logout realizado com sucesso!",
        });
    }
    catch (error) {
        console.error("Erro ao realizar logout:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao realizar logout. Tente novamente.",
            code: "LOGOUT_ERROR",
        });
    }
};
exports.logoutUsuario = logoutUsuario;
