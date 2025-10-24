import { Request, Response } from "express";
import { AuthService } from "../../Helpers/authservice";
import prisma from "../../Database/prisma/prisma";
import type { EnterprisePayloadLogin } from "../../@types/types";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  CriarEmpresaInput,
  criarEmpresaSchema,
} from "../../libs/enterpriseSchemas";

const criarEmpresa = async (req: Request, res: Response) => {
  try {
    const validatedData: CriarEmpresaInput = criarEmpresaSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(validatedData.senha, 12);
    const empresa = await prisma.empresa.create({
      data: {
        cnpj: validatedData.cnpj,
        senha: hashedPassword,
        nomeFantasia: validatedData.nomeFantasia,
        razaoSocial: validatedData.razaoSocial,
        endereco: validatedData.endereco,
        situacaoCadastral: validatedData.situacaoCadastral,
        naturezaJuridica: validatedData.naturezaJuridica,
        CNAES: validatedData.CNAES,
      },
    });

    // Resposta sem retornar a senha
    const { senha: _, ...empresaResponse } = empresa;

    return res.status(201).json({
      success: true,
      data: empresaResponse,
      message: "Empresa criada com sucesso!",
    });
  } catch (error: unknown) {
    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
      });
    }

    // Erro de constraint unique do Prisma (CNPJ duplicado)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "CNPJ já está cadastrado",
      });
    }

    // Erro genérico
    console.error("Erro ao criar empresa:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const loginEmpresa = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { cnpj, senha }: EnterprisePayloadLogin = req.body;

    if (!cnpj || !senha) {
      return res.status(400).json({
        success: false,
        error: "CNPJ e senha são obrigatórios",
        code: "MISSING_CREDENTIALS",
      });
    }
    const cnpjFiltrado = cnpj.replace(/[^\d]+/g, "");
    const empresa = await prisma.empresa.findUnique({
      where: { cnpj: cnpjFiltrado },
    });
    if (!empresa) {
      return res.status(401).json({
        success: false,
        error: "Credenciais inválidas",
        code: "INVALID_CREDENTIALS",
      });
    }
    const isPasswordValid = await AuthService.verifyHash(empresa.senha, senha);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Credenciais inválidas",
        code: "INVALID_CREDENTIALS",
      });
    }
    const token = AuthService.generateToken("enterprise", empresa.id);

    return res.json({
      success: true,
      message: "Login realizado com sucesso!",
      token: token, // Útil para debug e flexibilidade
      empresa: {
        id: empresa.id,
        nome: empresa.nomeFantasia,
        naturezaJuridica: empresa.naturezaJuridica,
        tipo: "empresa",
        cnpj: empresa.cnpj,
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

const logoutEmpresa = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
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

export { loginEmpresa, logoutEmpresa, criarEmpresa };
