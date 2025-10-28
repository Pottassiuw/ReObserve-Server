/*
  Warnings:

  - Added the required column `nome` to the `Grupo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Grupo" ADD COLUMN     "nome" TEXT NOT NULL;
