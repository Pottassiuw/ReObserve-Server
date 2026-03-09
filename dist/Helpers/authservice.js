"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || "";
if (!SUPABASE_JWT_SECRET) {
    throw new Error("SUPABASE_JWT_SECRET não definido no ambiente.");
}
class AuthService {
    static async verifyHash(hashedPassword, password) {
        return await bcrypt_1.default.compare(password, hashedPassword);
    }
    static generateToken(type, id) {
        if (!id || id <= 0) {
            throw new Error("ID inválido para geração de token");
        }
        const payload = {
            sub: String(id),
            role: "authenticated",
            type,
        };
        return jsonwebtoken_1.default.sign(payload, SUPABASE_JWT_SECRET, {
            expiresIn: "7d",
            issuer: "nf-system",
        });
    }
    static verifyToken(token) {
        try {
            if (!token?.trim())
                return null;
            const decoded = jsonwebtoken_1.default.verify(token, SUPABASE_JWT_SECRET);
            if (!decoded.sub || !decoded.type)
                throw new Error("Token inválido ou incompleto.");
            const id = parseInt(decoded.sub, 10);
            if (isNaN(id) || id <= 0)
                throw new Error("sub inválido no token.");
            if (decoded.type !== "enterprise" && decoded.type !== "user")
                throw new Error("Tipo de token inválido.");
            return { type: decoded.type, id };
        }
        catch (error) {
            console.error("Erro ao verificar token:", error);
            return null;
        }
    }
}
exports.AuthService = AuthService;
