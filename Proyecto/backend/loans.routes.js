// backend/loans.routes.js
const express = require("express");
const { z } = require("zod");
const pool = require("./db");

// Lógica de negocio
const { calcularScoring } = require("./scoring"); // usa calculadora.js internamente
const { validarRut, validarTelefonoChileno } = require("./validaciones");

const router = express.Router();

/* =============== Utilidades locales =============== */
function normalizarTelefonoCL(input = "") {
    if (!input) return "";
    const raw = String(input).trim().replace(/\s+/g, "");
    let digits = raw.replace(/^\+/, "");
    if (digits.startsWith("569")) {
        // ok
    } else if (digits.startsWith("9")) {
        digits = "569" + digits;
    }
    if (!/^\d+$/.test(digits)) return input;
    const rest = digits.slice(3);
    if (!digits.startsWith("569") || rest.length !== 8) return input;
    return `+569${rest}`; // canónico sin espacio
}

/* =============== Esquema de validación request =============== */
const ApplySchema = z.object({
    rut: z.string().min(3).refine((v) => validarRut(v), { message: "RUT inválido" }),
    full_name: z.string().min(3, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    phone: z
        .string()
        .optional()
        .transform((v) => (v ? normalizarTelefonoCL(v) : v))
        .refine((v) => (v ? validarTelefonoChileno(v) : true), {
            message: "Teléfono inválido. Usa +569 12345678",
        }),
    amount: z.number().int().positive("Monto > 0"),
    term_months: z.number().int().positive("Plazo > 0"),
    income: z.number().int().nonnegative().optional(),
});

/* =============== DDL: asegurar tabla =============== */
async function ensureTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS loan_requests (
                                                     id SERIAL PRIMARY KEY,
                                                     rut TEXT NOT NULL,
                                                     full_name TEXT NOT NULL,
                                                     email TEXT NOT NULL,
                                                     phone TEXT,
                                                     amount INTEGER NOT NULL,
                                                     term_months INTEGER NOT NULL,
                                                     income INTEGER,
                                                     status TEXT NOT NULL DEFAULT 'pendiente',
                                                     scoring INTEGER,
                                                     created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
    `);

    // Columna phone por si viene de antes sin ella
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS phone TEXT;`);

    // Constraint (PG15 no soporta IF NOT EXISTS en constraints; ignoramos si ya existe)
    try {
        await pool.query(`
            ALTER TABLE loan_requests
                ADD CONSTRAINT chk_phone_cl
                    CHECK (phone IS NULL OR phone ~ '^\\+?569 ?[0-9]{8}$');
        `);
    } catch (_) { /* ya existe */ }
}

/* =============== Rutas bajo /loans =============== */

// Salud del router
router.get("/health", (_req, res) => res.json({ ok: true, scope: "loans" }));

// POST /loans/apply → inserta, calcula scoring y devuelve {id,status,scoring}
router.post("/apply", async (req, res) => {
    try {
        await ensureTables();

        // 1) Validar body
        const parsed = ApplySchema.parse({
            rut: req.body?.rut,
            full_name: req.body?.full_name,
            email: req.body?.email,
            phone: req.body?.phone,
            amount: Number(req.body?.amount),
            term_months: Number(req.body?.term_months),
            income: req.body?.income == null ? undefined : Number(req.body?.income),
        });

        const { rut, full_name, email, phone, amount, term_months, income } = parsed;

        // 2) Insertar como pendiente
        const insertQ = `
            INSERT INTO loan_requests (rut, full_name, email, phone, amount, term_months, income, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente')
                RETURNING *;
        `;
        const { rows: insertedRows } = await pool.query(insertQ, [
            rut, full_name, email, phone ?? null, amount, term_months, income ?? null,
        ]);
        const reqRow = insertedRows[0];

        // 3) Calcular scoring inmediato (usa scoring.js)
        const ingreso = income ?? 0;
        const score = calcularScoring(ingreso, amount, term_months); // entero [1..100]

        // 4) Reglas de decisión (mock): >= 60 aprueba, < 60 rechaza
        const finalStatus = score >= 60 ? "aprobada" : "rechazada";

        // 5) Persistir status + scoring
        const updateQ = `
            UPDATE loan_requests
            SET status = $2, scoring = $3
            WHERE id = $1
                RETURNING id, status, scoring;
        `;
        const { rows: updatedRows } = await pool.query(updateQ, [reqRow.id, finalStatus, score]);

        // 6) Responder lo que tu frontend espera
        return res.status(201).json({
            id: updatedRows[0].id,
            status: updatedRows[0].status,
            scoring: updatedRows[0].scoring,
        });
    } catch (err) {
        if (err?.issues) {
            return res.status(400).json({ error: "validation_error", issues: err.issues });
        }
        console.error(err);
        return res.status(500).json({ error: "apply_failed" });
    }
});

// GET /loans/:id/status → consulta rápida para polling si lo usas
router.get("/:id/status", async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, status, scoring FROM loan_requests WHERE id = $1`,
            [Number(req.params.id)]
        );
        if (!rows.length) return res.status(404).json({ error: "not_found" });
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "internal_error" });
    }
});

module.exports = router;
