"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Llena una cuenta con actividad de los últimos N días, para que el dashboard,
 * las estadísticas y el calendario de Seguimiento se vean con datos reales al
 * hacer la demo. Solo AGREGA registros de "completado"; nunca borra ni toca
 * tus hábitos, ni borra registros que ya existan.
 *
 * Uso (dentro de habit-tracker-backend):
 *   npx ts-node scripts/seed-demo.ts tu-correo@ejemplo.com
 *   npx ts-node scripts/seed-demo.ts tu-correo@ejemplo.com 45   (45 días en vez de 30)
 *
 * Requiere que el .env con DATABASE_URL esté configurado y que ya hayas
 * corrido `npx prisma generate` al menos una vez.
 */
const client_1 = require("../src/generated/prisma/client");
const seed_demo_logic_1 = require("./seed-demo.logic");
const prisma = new client_1.PrismaClient();
async function main() {
    const correo = process.argv[2];
    const dias = Number(process.argv[3] ?? 30);
    if (!correo) {
        console.error('Uso: npx ts-node scripts/seed-demo.ts tu-correo@ejemplo.com [dias]');
        process.exit(1);
    }
    if (!Number.isInteger(dias) || dias < 1 || dias > 90) {
        console.error('El número de días debe ser un entero entre 1 y 90.');
        process.exit(1);
    }
    try {
        await (0, seed_demo_logic_1.sembrarDemo)(prisma, correo, dias, console.log);
    }
    catch (err) {
        console.error('\n' + (err instanceof Error ? err.message : String(err)));
        process.exit(1);
    }
}
main().finally(() => prisma.$disconnect());
