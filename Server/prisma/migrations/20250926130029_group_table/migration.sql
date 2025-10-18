/*
  Warnings:

  - A unique constraint covering the columns `[grupoId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `grupoId` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Permissoes" AS ENUM ('admin', 'lancamento', 'periodo', 'verLancamentos', 'editarLancamentos', 'verPeriodos', 'editarPeriodos', 'deletarLancamentos', 'deletarPeriodos');

-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "grupoId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Grupo" (
    "id" SERIAL NOT NULL,
    "permissoes" "public"."Permissoes"[],
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_grupoId_key" ON "public"."Usuario"("grupoId");

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "public"."Grupo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Grupo" ADD CONSTRAINT "Grupo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
