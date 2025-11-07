const { calcularCuotaMensual, obtenerTasaMock } = require('./calculadora');

/**
 * Calcula un puntaje de Scoring basado en los datos del cliente y del préstamo.
 * @param {number} ingresoMensual - Ingreso mensual del solicitante.  <-- ¡AGREGADO!
 * @param {number} monto - Monto del préstamo solicitado.
 * @param {number} plazoMeses - Plazo en meses.
 * @returns {number} Puntaje de Scoring [1, 100].
 */
function calcularScoring(ingresoMensual, monto, plazoMeses) {
    if (ingresoMensual <= 0) return 1; // Mínimo puntaje si no hay ingresos

    // 1. Obtener la tasa para el préstamo solicitado
    const tasaAnual = obtenerTasaMock(plazoMeses);

    // 2. Calcular la cuota mensual del préstamo solicitado
    const cuota = calcularCuotaMensual(monto, tasaAnual, plazoMeses);

    // 3. Aplicar la Regla de Riesgo (Cuota como % del Ingreso)
    const porcentajeCuotaIngreso = (cuota / ingresoMensual) * 100;

    // 4. Determinar el Score (Lógica Mock)
    let score;
    const MAX_RIESGO_PCT = 30; // Usaremos 30% como umbral conservador

    if (porcentajeCuotaIngreso > MAX_RIESGO_PCT) {
        // Riesgo alto: Cuota supera el 30% del ingreso
        score = Math.max(1, 50 - (porcentajeCuotaIngreso - MAX_RIESGO_PCT));
    } else {
        // Riesgo bajo/medio: Score basado en la solvencia
        score = Math.min(100, 50 + (MAX_RIESGO_PCT - porcentajeCuotaIngreso));
    }

    // El scoring final debe ser un número entero.
    return Math.round(score);
}

module.exports = {
    calcularScoring
};