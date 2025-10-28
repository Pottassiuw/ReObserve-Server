import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || "";

if (!SUPABASE_JWT_SECRET) {
  throw new Error("SUPABASE_JWT_SECRET não definido no ambiente.");
}

export class AuthService {
  static async verifyHash(hashedPassword: string, password: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(type: "enterprise" | "user", id: number): string {
    if (!id || id <= 0) {
      throw new Error("ID inválido para geração de token");
    }

    const payload = {
      sub: String(id),
      role: "authenticated",
      type,
    };

    return jwt.sign(payload, SUPABASE_JWT_SECRET, {
      expiresIn: "7d",
      issuer: "nf-system",
    });
  }

  static verifyToken(
    token: string,
  ): { type: "enterprise" | "user"; id: number } | null {
    try {
      if (!token?.trim()) return null;

      const decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as any;

      if (!decoded.sub || !decoded.type)
        throw new Error("Token inválido ou incompleto.");

      const id = parseInt(decoded.sub, 10);
      if (isNaN(id) || id <= 0) throw new Error("sub inválido no token.");

      if (decoded.type !== "enterprise" && decoded.type !== "user")
        throw new Error("Tipo de token inválido.");

      return { type: decoded.type, id };
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      return null;
    }
  }
}
