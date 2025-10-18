const express = require("express");
const pool = require("./db");
const { z } = require("zod");

const router = express.Router();

<<<<<<< HEAD
// Crea la tabla si no existe
async function ensureTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS loan_requests (
                                                     id SERIAL PRIMARY KEY,
                                                     rut VARCHAR(12) NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
            term_months INT NOT NULL CHECK (term_months > 0),
            income NUMERIC(14,2),
            status VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente|inadmisible|rechazada|aprobada
            scoring INT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
=======
// --- IMPORTACIÓN DE MÓDULOS DE LÓGICA ---
// Asegúrate de que los archivos existan en la misma carpeta.
const { obtenerTasaMock, calcularCuotaMensual } = require('./calculadora');
const { calcularScoring } = require('./scoring');
const { validarRut, validarTelefonoChileno } = require('./validaciones');
// -------------------------------------------------------------------


// Crea la tabla si no existe (CORRECCIÓN CRÍTICA DE SQL)
async function ensureTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS loan_requests (
            id SERIAL PRIMARY KEY,
            rut VARCHAR(12) NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,             /* <- Columna PHONE agregada con tipo TEXT */
            amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
            term_months INT NOT NULL CHECK (term_months > 0),
            income NUMERIC(14,2),
            status VARCHAR(20) NOT NULL DEFAULT 'pendiente', 
            scoring INT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
>>>>>>> 2f67d2c (Versión inicial con validación de teléfono y RUT)
        CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON loan_requests(status);
    `);
}

<<<<<<< HEAD
// Validación del payload (el front ya manda números)
const ApplySchema = z.object({
    rut: z.string().min(3),
    full_name: z.string().min(3),
    email: z.string().email(),
=======
// -------------------------------------------------------------------
// --- ESQUEMAS DE VALIDACIÓN ZOD ---

const ApplySchema = z.object({
    rut: z.string().min(3)
        .refine(validarRut, { message: "El RUT ingresado no es válido." }),

    full_name: z.string().min(3),
    email: z.string().email(),

    // El campo 'phone' es opcional y se valida solo si está presente.
    phone: z.string().optional()
        .refine((val) => !val || validarTelefonoChileno(val), { message: "El formato de teléfono debe ser chileno (+569xxxxxxxx)." }),

>>>>>>> 2f67d2c (Versión inicial con validación de teléfono y RUT)
    amount: z.number().positive(),
    term_months: z.number().int().positive(),
    income: z.number().positive().optional()
});

<<<<<<< HEAD
// Reglas mock: admisibilidad + score
function isAdmissible({ income = 0, amount }) {
    if (!income) return false;
    return amount <= income * 20;
}

function computeScore({ income = 0, amount, term_months }) {
    const term = term_months || 24;
    const base = 60 + income / (amount / term);
    const s = Math.round(Math.max(1, Math.min(100, base))); // [1,100]
    return s;
}

// POST /loans/apply
router.post("/apply", async (req, res) => {
    try {
        await ensureTables();

        const parsed = ApplySchema.safeParse(req.body);
=======
const SimulateSchema = z.object({
    amount: z.number().positive(),
    term_months: z.number().int().positive()
});
// -------------------------------------------------------------------


// POST /loans/simular (RUTA HU 2 - Simulación)
router.post("/simular", async (req, res) => {
    try {
        const parsed = SimulateSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: "invalid_simulation_payload", details: parsed.error.flatten() });
        }

        const payload = parsed.data;
        const TASA_ANUAL_APLICADA = obtenerTasaMock(payload.term_months);

        const cuotaMensual = calcularCuotaMensual(
            payload.amount,
            TASA_ANUAL_APLICADA,
            payload.term_months
        );

        const ctc = cuotaMensual * payload.term_months;

        return res.json({
            cuota_mensual: cuotaMensual,
            costo_total_credito: ctc,
            tasa_anual_aplicada: TASA_ANUAL_APLICADA
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "internal_error" });
    }
});


// POST /loans/apply (RUTA HU 1 - Solicitud)
router.post("/apply", async (req, res) => {
    try {
        await ensureTables(); // Aseguramos que la tabla exista

        const parsed = ApplySchema.safeParse(req.body);

>>>>>>> 2f67d2c (Versión inicial con validación de teléfono y RUT)
        if (!parsed.success) {
            return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
        }
        const payload = parsed.data;

<<<<<<< HEAD
        // Registrar solicitud en estado pendiente
        const { rows } = await pool.query(
            `INSERT INTO loan_requests (rut, full_name, email, amount, term_months, income, status)
             VALUES ($1,$2,$3,$4,$5,$6,'pendiente') RETURNING *`,
            [payload.rut, payload.full_name, payload.email, payload.amount, payload.term_months, payload.income ?? null]
        );
        const reqRow = rows[0];

        // Decisión: admisibilidad + scoring
        let status = "inadmisible";
        let scoring = null;

        if (isAdmissible(payload)) {
            scoring = computeScore(payload);
            status = scoring >= 55 ? "aprobada" : "rechazada";
        }

        // Guardar resultado
=======
        // CORRECCIÓN CRÍTICA DE SQL: Preparamos los parámetros, incluyendo 'phone'
        const phoneToInsert = payload.phone ?? null;
        const incomeToInsert = payload.income ?? null;

        // 1. Registrar solicitud en estado pendiente
        // ¡Se agregaron las columnas 'phone' y el parámetro $4!
        const { rows } = await pool.query(
            `INSERT INTO loan_requests (rut, full_name, email, phone, amount, term_months, income, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente') RETURNING *`,
            [payload.rut, payload.full_name, payload.email, phoneToInsert, payload.amount, payload.term_months, incomeToInsert]
        );
        const reqRow = rows[0];

        // 2. Lógica de Scoring Automático
        let status = "inadmisible";
        let scoring = null;

        if (payload.income && payload.income > 0) {
            scoring = calcularScoring(
                payload.income,
                payload.amount,
                payload.term_months
            );

            // Decisión automática
            status = scoring >= 55 ? "aprobada" : "rechazada";
        }

        // 3. Guardar resultado
>>>>>>> 2f67d2c (Versión inicial con validación de teléfono y RUT)
        const { rows: updated } = await pool.query(
            `UPDATE loan_requests
             SET status=$1, scoring=$2, updated_at=NOW()
             WHERE id=$3
                 RETURNING id, status, scoring, updated_at`,
            [status, scoring, reqRow.id]
        );

        return res.status(201).json({
            id: reqRow.id,
            status: updated[0].status,
            scoring: updated[0].scoring
        });
    } catch (e) {
<<<<<<< HEAD
        console.error(e);
=======
        console.error(e); // Deja el log para ver el error real si persiste
>>>>>>> 2f67d2c (Versión inicial con validación de teléfono y RUT)
        res.status(500).json({ error: "internal_error" });
    }
});

<<<<<<< HEAD
// GET /loans/:id/status
router.get("/:id/status", async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query(
            `SELECT id, status, scoring, updated_at
             FROM loan_requests
             WHERE id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: "not_found" });
        return res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "internal_error" });
    }
});

module.exports = router;
=======

// ... (Tu ruta GET /loans/:id/status debe seguir aquí)

module.exports = router;
>>>>>>> 2f67d2c (Versión inicial con validación de teléfono y RUT)
