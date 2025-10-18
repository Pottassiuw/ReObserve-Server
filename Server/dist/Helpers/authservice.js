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
const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET não foi criado");
}
class AuthService {
    static async VerifyHash(hashedPassword, password) {
        return await bcrypt_1.default.compare(password, hashedPassword);
    }
    static generateToken(type, id) {
        if (!id || id <= 0) {
            throw new Error("ID inválido para geração de token");
        }
        return jsonwebtoken_1.default.sign({ type, id }, process.env.JWT_SECRET ?? "", {
            expiresIn: "7d",
            issuer: "nf-system"
        });
    }
    static verifyToken(token) {
        try {
            if (!token || token.trim() === "") {
                return null;
            }
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET ?? "");
            if (!decoded.type || !decoded.id) {
                throw new Error("Token com estrutura totalmente inválida!");
                return null;
            }
            if (decoded.type !== "enterprise" || decoded.type !== "user") {
                throw new Error("Tipo de token inválido: ", decoded.type);
                return null;
            }
            if (typeof decoded.id !== "number" || decoded.id <= 0) {
                throw new Error("Id inválido dentro do token: ", decoded.id);
                return null;
            }
            return { type: decoded.type, id: decoded.id };
        }
        catch (error) {
            console.error("Error: ", error);
            return null;
        }
    }
}
exports.AuthService = AuthService;
