"use strict";
/**
 * Lógica del script de datos de demo, separada del acceso real a Prisma para
 * poder probarla. `Db` describe únicamente lo que el script usa, así que en las
 * pruebas se puede pasar una base de datos en memoria con la misma forma.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HABITOS_DEMO = void 0;
exports.inicioDelDia = inicioDelDia;
exports.sumarDias = sumarDias;
exports.aplicaEnDia = aplicaEnDia;
exports.generarPatron = generarPatron;
exports.sembrarDemo = sembrarDemo;
// ---------- Mismas reglas que statistics.utils, para que la demo sea consistente ----------
function inicioDelDia(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}
function sumarDias(fecha, dias) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}
function aplicaEnDia(habito, dia) {
    if (!habito.activo)
        return false;
    const d = inicioDelDia(dia);
    if (d < inicioDelDia(habito.fechaInicio))
        return false;
    if (habito.fechaFin && d > inicioDelDia(habito.fechaFin))
        return false;
    return true;
}
/**
 * Patrón de actividad: una racha reciente completa (termina hoy, para que
 * "racha actual" y "mejor racha" se vean bien) y, antes de eso, un patrón fijo
 * de ~65% de cumplimiento (no aleatorio, para que el script dé un resultado
 * parecido cada vez que se corre). patron[0] = hoy, patron[dias-1] = el día más antiguo.
 */
function generarPatron(dias, largoRacha) {
    const patron = [];
    for (let i = 0; i < dias; i++) {
        patron.push(i < largoRacha ? true : (i * 7 + 3) % 10 < 6.5);
    }
    return patron;
}
/** Hábitos de ejemplo para cuando se crea una cuenta de demo nueva. */
exports.HABITOS_DEMO = [
    { nombre: 'Leer 20 minutos', categoria: 'Estudio', frecuencia: 'diario', prioridad: 1 },
    { nombre: 'Hacer ejercicio', categoria: 'Salud', frecuencia: 'diario', prioridad: 1 },
    { nombre: 'Tomar agua', categoria: 'Salud', frecuencia: 'diario', prioridad: 2 },
    { nombre: 'Meditar', categoria: 'Bienestar', frecuencia: 'diario', prioridad: 2 },
    { nombre: 'Revisar finanzas', categoria: 'Finanzas', frecuencia: 'semanal', prioridad: 2 },
    { nombre: 'Ordenar el cuarto', categoria: 'Hogar', frecuencia: 'semanal', prioridad: 3 },
];
/**
 * Busca la cuenta por correo. Si no existe, la crea (con nombre, contraseña y
 * los hábitos de HABITOS_DEMO), lista para poblarse con actividad.
 */
async function obtenerOCrearCuenta(db, hash, correo, nombre, contrasena, hoy, log) {
    const existente = await db.usuario.findUnique({ where: { correo } });
    if (existente)
        return existente;
    log(`No existe una cuenta con "${correo}"; se crea una de demostración...`);
    const contrasenaHash = await hash(contrasena);
    const usuario = await db.usuario.create({ data: { nombre, correo, contrasena: contrasenaHash } });
    for (const h of exports.HABITOS_DEMO) {
        await db.habito.create({
            data: { ...h, fechaInicio: hoy, activo: true, usuarioId: usuario.id },
        });
    }
    log(`Cuenta creada con ${exports.HABITOS_DEMO.length} hábitos de ejemplo. Contraseña: ${contrasena}\n`);
    return usuario;
}
async function sembrarDemo(db, correo, dias, log = () => { }, opciones = {}) {
    const hoy = inicioDelDia(new Date());
    let usuario = await db.usuario.findUnique({ where: { correo } });
    let cuentaCreada = false;
    if (!usuario && opciones.crearSiNoExiste) {
        const { nombre, contrasena, hash } = opciones.crearSiNoExiste;
        usuario = await obtenerOCrearCuenta(db, hash, correo, nombre, contrasena, hoy, log);
        cuentaCreada = true;
    }
    if (!usuario) {
        throw new Error(`No existe ninguna cuenta con el correo "${correo}". Crea la cuenta primero (registrándote en la app), ` +
            'o corre el script con --crear-cuenta para que la genere automáticamente.');
    }
    const habitos = await db.habito.findMany({ where: { usuarioId: usuario.id } });
    if (habitos.length === 0) {
        throw new Error(`La cuenta "${correo}" no tiene hábitos todavía. Crea algunos primero.`);
    }
    const largoRacha = Math.min(dias, 4 + (habitos.length % 4)); // entre 4 y 7 días
    log(`Cuenta: ${usuario.nombre} <${correo}>`);
    log(`Hábitos encontrados: ${habitos.length}`);
    log(`Generando actividad de los últimos ${dias} días (racha reciente de ${largoRacha} días)...\n`);
    let creados = 0;
    let saltados = 0;
    for (const habito of habitos) {
        const patron = generarPatron(dias, largoRacha);
        let completadosHabito = 0;
        for (let i = 0; i < dias; i++) {
            const dia = sumarDias(hoy, -i);
            if (!aplicaEnDia(habito, dia))
                continue; // respeta activo/inactivo y fechas
            if (!patron[i])
                continue; // ese día no tocaba completarlo, según el patrón
            // No duplicar: mismo rango [00:00, 24:00) que usa habits.service.completar()
            const yaExiste = await db.registro.findFirst({
                where: {
                    habitoId: habito.id,
                    usuarioId: usuario.id,
                    completado: true,
                    fecha: { gte: dia, lt: sumarDias(dia, 1) },
                },
            });
            if (yaExiste) {
                saltados++;
                continue;
            }
            // Hora fija (10:00 a.m.) para que se vea una fecha "normal", ni medianoche ni futuro
            const fecha = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 10, 0, 0);
            await db.registro.create({
                data: { habitoId: habito.id, usuarioId: usuario.id, fecha, completado: true },
            });
            creados++;
            completadosHabito++;
        }
        const estado = habito.activo ? '' : ' (inactivo, no cuenta en las estadísticas)';
        log(`  ${habito.nombre}: +${completadosHabito} días completados${estado}`);
    }
    log(`\nListo. ${creados} registros creados, ${saltados} ya existían y se dejaron igual.`);
    log('Refresca el Dashboard, Estadísticas y Seguimiento en la app para verlos.');
    return { creados, saltados, cuentaCreada };
}
