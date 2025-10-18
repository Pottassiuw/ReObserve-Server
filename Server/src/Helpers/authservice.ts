import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET não foi criado");
}

export class AuthService {
    static async VerifyHash (hashedPassword: string, password: string){
	return await bcrypt.compare(password, hashedPassword);
    }

    static generateToken(type: "enterprise" | "user", id: number):  string {
	if (!id || id <= 0) {
	    throw new Error("ID inválido para geração de token");
	} 
	return jwt.sign({type, id} , process.env.JWT_SECRET ?? "", {
	    expiresIn: "7d",
	    issuer: "nf-system"
	});
    }
    static verifyToken(token: string): {type: "enterprise" | "user" ; id: number} | null {
	try {
	    if (!token || token.trim() === "") {
		return null;
	    }
	    const decoded = jwt.verify(token, JWT_SECRET ?? "") as any;

	    if (!decoded.type || !decoded.id) {
		throw new Error("Token com estrutura totalmente inválida!")
		return null;
	    }

	    if (decoded.type !== "enterprise" || decoded.type !== "user") {
		throw new Error("Tipo de token inválido: ", decoded.type)
		return null;
	    }
	    if (typeof decoded.id !== "number" || decoded.id <= 0 ) {
		throw new Error("Id inválido dentro do token: ", decoded.id)
		return null;
	    }

	    return {type: decoded.type, id: decoded.id}

	} catch (error) {
	    console.error("Error: ",error);	  
	    return null;
	}
    }

}
