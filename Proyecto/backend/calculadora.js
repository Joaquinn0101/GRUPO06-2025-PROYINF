
function calcularCuotaMensual(montoPrestamo, tasaAnual, plazoMeses) {
    // Criterio 3 de HU2: Los límites. Los datos deben ser positivos.
    if (tasaAnual <= 0 || plazoMeses <= 0 || montoPrestamo <= 0) {
        return 0.0;
    }

    // Convertir la Tasa Anual Nominal (TAN) a Tasa Mensual (i)
    const tasaMensual = (tasaAnual / 100) / 12;

    if (tasaMensual === 0) {
        return parseFloat((montoPrestamo / plazoMeses).toFixed(2));
    }

    // Fórmula del Sistema Francés: C = P * i / (1 - (1 + i)^-n)
    const numerador = montoPrestamo * tasaMensual;
    const denominador = 1 - Math.pow(1 + tasaMensual, -plazoMeses);

    const cuota = numerador / denominador;

    return parseFloat(cuota.toFixed(2));
}

/**
 * Función mock para obtener la tasa de interés según el plazo.
 * Necesaria para el cálculo de la simulación y el scoring.
 */
function obtenerTasaMock(plazoMeses) {
    if (plazoMeses <= 12) return 5.5;
    if (plazoMeses <= 36) return 6.0;
    return 7.5;
}

module.exports = {
    calcularCuotaMensual,
    obtenerTasaMock // ¡Importante! Debe ser accesible para scoring.js y loans.routes.js
};