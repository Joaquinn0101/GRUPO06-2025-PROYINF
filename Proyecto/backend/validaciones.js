/**
 * Valida un RUT (Rol Único Tributario) chileno.
 * @param {string} rutCompleto - El RUT con o sin puntos, guión, espacios y con dígito verificador.
 * @returns {boolean} - True si el RUT es válido, false en caso contrario.
 */
function validarRut(rutCompleto) {
    // 1. Validar que la entrada sea un string y no esté vacía
    if (!rutCompleto || typeof rutCompleto !== 'string') return false;

    // 2. Sanitizar y limpiar: Eliminar puntos, guiones y espacios, convertir a mayúsculas.
    let valor = rutCompleto.replace(/[\.\-\s]/g, '').toUpperCase();

    // 3. Comprobar el formato básico
    // Debe ser uno o más dígitos, seguido de un dígito (0-9) o 'K'.
    if (!/^[0-9]+[0-9K]$/.test(valor)) return false;

    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1);

    // 4. Implementación de la FÓRMULA DEL DV (Algoritmo Módulo 11)
    let suma = 0;
    let multiplo = 2;

    // Iterar desde el final del cuerpo hacia el principio
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
        
        // El múltiplo se reinicia a 2 después de llegar a 7
        multiplo = (multiplo < 7) ? multiplo + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);

    // 5. Determinar el DV final basado en los casos especiales
    let dvFinal = (dvEsperado === 11) ? '0' : (dvEsperado === 10) ? 'K' : String(dvEsperado);

    // 6. Comparar el DV calculado con el DV recibido
    return dvFinal === dv;
}

/**
 * Valida un número de teléfono móvil chileno en formato internacional (+569) o (569).
 *
 * @param {string} telefono - El número de teléfono a validar.
 * @returns {boolean} - True si el formato es válido, false en caso contrario.
 */
function validarTelefonoChileno(telefono) {
    // Validar que la entrada sea un string y no esté vacía
    if (!telefono || typeof telefono !== 'string') return false;

    const regex = /^\+?569\s?[0-9]{8}$/;

    return regex.test(telefono.trim());
}

module.exports = {
    validarRut,
    validarTelefonoChileno
};