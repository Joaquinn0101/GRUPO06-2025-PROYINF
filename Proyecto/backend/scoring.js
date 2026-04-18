const { calcularCuotaMensual, obtenerTasaMock } = require('./calculadora');

/**
 * Calcula la probabilidad de aprobación basada en el scoring.
 * @param {number} score - Puntaje de scoring [1, 100].
 * @returns {number} Probabilidad [0, 100].
 */
function calcularProbabilidad(score) {
    // Mapeo simple: score 60 es el mínimo para aprobar (umbral en routes).
    // Si score < 50, probabilidad baja drásticamente.
    if (score >= 60) return Math.min(99, 70 + (score - 60) * 0.75);
    if (score >= 40) return 40 + (score - 40) * 1;
    return Math.max(5, score);
}

/**
 * Calcula un puntaje de Scoring basado en los datos del cliente y del préstamo.
 * @param {number} ingresoMensual - Ingreso mensual del solicitante.
 * @param {number} monto - Monto del préstamo solicitado.
 * @param {number} plazoMeses - Plazo en meses.
 * @param {number} antiguedad - Años de antigüedad laboral (opcional).
 * @param {number} deudaMensual - Deuda mensual actual en el sistema (opcional).
 * @returns {number} Puntaje de Scoring [1, 100].
 */
function calcularScoring(ingresoMensual, monto, plazoMeses, antiguedad = 0, deudaMensual = 0) {
    if (ingresoMensual <= 0) return 1;

    const tasaAnual = obtenerTasaMock(plazoMeses);
    const cuota = calcularCuotaMensual(monto, tasaAnual, plazoMeses);

    // Regla de Riesgo: (Cuota + Deuda Existente) / Ingreso
    const cargaFinancieraTotal = cuota + deudaMensual;
    const porcentajeCargaIngreso = (cargaFinancieraTotal / ingresoMensual) * 100;

    let score;
    const MAX_RIESGO_PCT = 35; // Umbral de carga financiera aceptable

    if (porcentajeCargaIngreso > MAX_RIESGO_PCT) {
        score = Math.max(1, 60 - (porcentajeCargaIngreso - MAX_RIESGO_PCT) * 2);
    } else {
        score = Math.min(100, 60 + (MAX_RIESGO_PCT - porcentajeCargaIngreso) * 1.5);
    }

    // Bonus por antigüedad
    if (antiguedad >= 2) score += 5;
    if (antiguedad >= 5) score += 5;

    return Math.min(100, Math.round(score));
}

/**
 * Genera una recomendación de préstamo óptima basada en el perfil financiero.
 */
function obtenerRecomendacion(ingresoMensual, antiguedad = 0, deudaMensual = 0) {
    const MAX_CARGA_RECOMENDADA = 0.25; // 25% del ingreso para la cuota del nuevo crédito
    const cuotaMaxima = Math.max(0, (ingresoMensual * MAX_CARGA_RECOMENDADA) - (deudaMensual * 0.1)); // Descontamos un poco por deuda externa
    
    // Plazo recomendado estándar: 24 meses o 36 si el monto es alto
    const plazoRecomendado = 24;
    const tasa = obtenerTasaMock(plazoRecomendado);
    const tasaMensual = (tasa / 100) / 12;

    // Despejar Monto de la fórmula de cuota: P = C * (1 - (1 + i)^-n) / i
    let montoRecomendado = 0;
    if (tasaMensual > 0) {
        montoRecomendado = cuotaMaxima * (1 - Math.pow(1 + tasaMensual, -plazoRecomendado)) / tasaMensual;
    } else {
        montoRecomendado = cuotaMaxima * plazoRecomendado;
    }

    // Redondear a miles
    montoRecomendado = Math.floor(montoRecomendado / 10000) * 10000;
    if (montoRecomendado < 500000) montoRecomendado = 500000; // Mínimo
    if (montoRecomendado > 20000000) montoRecomendado = 20000000; // Máximo sugerido

    const score = calcularScoring(ingresoMensual, montoRecomendado, plazoRecomendado, antiguedad, deudaMensual);
    const probabilidad = calcularProbabilidad(score);

    return {
        monto: montoRecomendado,
        plazo: plazoRecomendado,
        cuota: Math.round(calcularCuotaMensual(montoRecomendado, tasa, plazoRecomendado)),
        probabilidad,
        score
    };
}

module.exports = {
    calcularScoring,
    calcularProbabilidad,
    obtenerRecomendacion
};