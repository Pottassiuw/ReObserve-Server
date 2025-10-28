/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `Empresa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `senha` to the `Empresa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Empresa" ADD COLUMN     "senha" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "public"."Empresa"("cnpj");
