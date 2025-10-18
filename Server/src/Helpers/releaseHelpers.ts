import { NotaFiscal } from "../generated/prisma";
import prisma from "../Database/prisma/prisma";

export const criarNotaFiscal = async (
  nota: Partial<NotaFiscal> & { empresaId: number }
): Promise<NotaFiscal | null> => {
  try {
    const notaFiscal = await prisma.notaFiscal.create({
      data: {
        numero: nota.numero!,
        dataEmissao: new Date(nota.dataEmissao!),
        valor: nota.valor,
        xmlPath: nota.xmlPath,
        empresaId: nota.empresaId,
      },
    });

    return notaFiscal;
  } catch (error: any) {
    console.error("Erro ao criar nota fiscal:", error);
    return null;
  }
};