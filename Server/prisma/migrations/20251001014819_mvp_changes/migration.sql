/*
  Warnings:

  - You are about to drop the column `chaveAcesso` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `cnpj` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `lancamentoId` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `nome_emitente` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `numero_nota` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the `_LancamentoToUsuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[notaFiscalId]` on the table `Lancamento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numero]` on the table `NotaFiscal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `notaFiscalId` to the `Lancamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `Lancamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `NotaFiscal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `NotaFiscal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."NotaFiscal" DROP CONSTRAINT "NotaFiscal_lancamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_LancamentoToUsuario" DROP CONSTRAINT "_LancamentoToUsuario_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_LancamentoToUsuario" DROP CONSTRAINT "_LancamentoToUsuario_B_fkey";

-- DropIndex
DROP INDEX "public"."NotaFiscal_lancamentoId_key";

-- DropIndex
DROP INDEX "public"."NotaFiscal_numero_nota_key";

-- AlterTable
ALTER TABLE "public"."Lancamento" ADD COLUMN     "notaFiscalId" INTEGER NOT NULL,
ADD COLUMN     "usuarioId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."NotaFiscal" DROP COLUMN "chaveAcesso",
DROP COLUMN "cnpj",
DROP COLUMN "cpf",
DROP COLUMN "descricao",
DROP COLUMN "lancamentoId",
DROP COLUMN "nome_emitente",
DROP COLUMN "numero_nota",
ADD COLUMN     "empresaId" INTEGER NOT NULL,
ADD COLUMN     "numero" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Periodo" ADD COLUMN     "valorTotal" DOUBLE PRECISION;

-- DropTable
DROP TABLE "public"."_LancamentoToUsuario";

-- CreateIndex
CREATE UNIQUE INDEX "Lancamento_notaFiscalId_key" ON "public"."Lancamento"("notaFiscalId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_numero_key" ON "public"."NotaFiscal"("numero");

-- AddForeignKey
ALTER TABLE "public"."Lancamento" ADD CONSTRAINT "Lancamento_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "public"."NotaFiscal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lancamento" ADD CONSTRAINT "Lancamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotaFiscal" ADD CONSTRAINT "NotaFiscal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
