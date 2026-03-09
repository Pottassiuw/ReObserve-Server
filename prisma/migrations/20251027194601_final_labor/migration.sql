/*
  Warnings:

  - Added the required column `dataAtualizacao` to the `Periodo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `Periodo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Imagem" DROP CONSTRAINT "Imagem_lancamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lancamento" DROP CONSTRAINT "Lancamento_notaFiscalId_fkey";

-- AlterTable
ALTER TABLE "Periodo" ADD COLUMN     "dataAtualizacao" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataFechamento" TIMESTAMP(3),
ADD COLUMN     "empresaId" INTEGER NOT NULL,
ADD COLUMN     "observacoes" TEXT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imagem" ADD CONSTRAINT "Imagem_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Periodo" ADD CONSTRAINT "Periodo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
