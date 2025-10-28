"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requirePermissions = exports.authSession = void 0;
// authMiddleware.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../Database/prisma/prisma"));
const client_1 = require("@prisma/client");
const authSession = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Token não fornecido",
                success: false,
                code: "NO_TOKEN",
            });
        }
        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || "");
        }
        catch (jwtError) {
            if (jwtError.name === "TokenExpiredError") {
                return res.status(401).json({
                    error: "Token expirado",
                    success: false,
                    code: "TOKEN_EXPIRED",
                });
            }
            if (jwtError.name === "JsonWebTokenError") {
                return res.status(401).json({
                    error: "Token inválido",
                    success: false,
                    code: "INVALID_TOKEN",
                });
            }
            throw jwtError;
        }
        // Extrai o ID do campo 'sub' (como está no authservice.ts)
        const userId = parseInt(decoded.sub, 10);
        req.auth = {
            type: decoded.type,
            id: userId,
        };
        if (decoded.type === "user") {
            const usuario = await prisma_1.default.usuario.findUnique({
                where: { id: userId },
                include: {
                    empresa: true,
                    grupo: true,
                },
            });
            if (!usuario) {
                return res.status(401).json({
                    error: "Usuário não encontrado",
                    success: false,
                    code: "USER_NOT_FOUND",
                });
            }
            req.auth.user = usuario;
            req.auth.isSuperAdmin = usuario.admin;
            req.auth.permissoes = usuario.grupo?.permissoes || [];
        }
        else if (decoded.type === "enterprise") {
            const empresa = await prisma_1.default.empresa.findUnique({
                where: { id: userId },
                include: {
                    usuarios: true,
                    grupo: true,
                },
            });
            if (!empresa) {
                return res.status(401).json({
                    error: "Empresa não encontrada",
                    success: false,
                    code: "ENTERPRISE_NOT_FOUND",
                });
            }
            req.auth.enterprise = empresa;
            req.auth.isSuperAdmin = false;
            req.auth.permissoes = Object.values(client_1.Permissoes);
        }
        next();
    }
    catch (error) {
        console.error("Erro na autenticação:", error);
        return res.status(500).json({
            error: "Erro interno do servidor",
            success: false,
            code: "AUTH_ERROR",
            errorType: error.constructor.name,
        });
    }
};
exports.authSession = authSession;
const requirePermissions = (...permissoes) => {
    return (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                error: "Usuário não autenticado",
                success: false,
                code: "NOT_AUTHENTICATED",
            });
        }
        const userPermissoes = req.auth.permissoes || [];
        if (userPermissoes.includes(client_1.Permissoes.admin)) {
            return next();
        }
        const hasAll = permissoes.every((p) => userPermissoes.includes(p));
        if (!hasAll) {
            return res.status(403).json({
                error: "Permissão negada",
                success: false,
                code: "FORBIDDEN",
            });
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
const requireSuperAdmin = (req, res, next) => {
    if (!req.auth) {
        return res.status(401).json({
            error: "Usuário não autenticado",
            success: false,
            code: "NOT_AUTHENTICATED",
        });
    }
    if (!req.auth.isSuperAdmin) {
        return res.status(403).json({
            error: "Acesso negado. Apenas super administradores.",
            success: false,
            code: "SUPER_ADMIN_REQUIRED",
        });
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
