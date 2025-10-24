import { Request, Response } from "express";
import { AuthService } from "../../Helpers/authservice";
import prisma from "../../Database/prisma/prisma";
import { UserPayloadLogin } from "../../@types/types";
import bcrypt from "bcrypt";
import { z } from "zod";
import { criarUsuarioInput, criarUsuarioSchema } from "../../libs/userSchemas";

const criarUsuario = async (req: Request, res: Response) => {
  try {
    const validatedUserData: criarUsuarioInput = criarUsuarioSchema.parse(
      req.body,
    );

    const hashedUserPassword = await bcrypt.hash(validatedUserData.senha, 12);

    const user = await prisma.usuario.create({
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
  } catch (error: unknown) {
    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Erro de constraint unique do Prisma (CPF duplicado)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
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
const loginUsuario = async (req: Request, res: Response) => {
  try {
    const { email, senha }: UserPayloadLogin = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios",
        code: "MISSING_CREDENTIALS",
      });
    }
    const user = await prisma.usuario.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Credenciais inválidas",
        code: "INVALID_CREDENTIALS",
      });
    }
    const isPasswordValid = await AuthService.verifyHash(user.senha, senha);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Credenciais inválidas",
        code: "INVALID_CREDENTIALS",
      });
    }
    // Gerar token
    const token = AuthService.generateToken("user", user.id);

    return res.json({
      success: true,
      message: "Login realizado com sucesso!",
      token: token, // Útil para debug e flexibilidade
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        admin: user.admin, // IMPORTANTE
        tipo: "user",
        cpf: user.cpf,
      },
    });
  } catch (error) {
    console.error("Erro no login do usuário:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor. Tente novamente.",
      code: "INTERNAL_ERROR",
    });
  }
};
const logoutUsuario = async (req: Request, res: Response) => {
  try {
    //Limpar o cookie para deslogar a seção
    res.clearCookie("auth-token", {
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao realizar logout:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao realizar logout. Tente novamente.",
      code: "LOGOUT_ERROR",
    });
  }
};

export { loginUsuario, logoutUsuario, criarUsuario };
