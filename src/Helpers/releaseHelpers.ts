import { NotaFiscal } from "@prisma/client";
import prisma from "../Database/prisma/prisma";

export const criarNotaFiscal = async (
  nota: Partial<NotaFiscal> & { empresaId: number },
): Promise<NotaFiscal> => {
  return prisma.notaFiscal.create({
    data: {
      numero: nota.numero!,
      dataEmissao: new Date(nota.dataEmissao!),
      valor: nota.valor,
      xmlPath: nota.xmlPath,
      xmlContent: nota.xmlContent,
      empresaId: nota.empresaId,
    },
  });
};
