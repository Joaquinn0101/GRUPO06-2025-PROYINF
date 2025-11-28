// backend/loans.routes.js
const express = require("express");
const { z } = require("zod");
const pool = require("./db");

// Lógica de negocio
const { calcularScoring } = require("./scoring");
const { validarRut, validarTelefonoChileno } = require("./validaciones");
// IMPORTAR LÓGICA DE SEGURIDAD (auth.js)
const { hashPassword, comparePassword, generateToken, authenticateToken } = require("./auth");

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

const normalizeRut = (rut = "") => {
    if (!rut || typeof rut !== "string") return "";
    return rut.replace(/[\.\-\s]/g, "").toUpperCase();
};

/* =============== Esquemas de validación request =============== */
// Esquemas NUEVOS para Registro/Login
const RegisterSchema = z.object({
    rut: z
        .string()
        .min(3)
        .transform(normalizeRut)
        .refine((v) => validarRut(v), { message: "RUT inválido" }),
    full_name: z.string().min(3, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La clave debe tener al menos 6 caracteres."),
});

const LoginSchema = z.object({
    rut: z
        .string()
        .min(3, "RUT requerido")
        .transform(normalizeRut),
    password: z.string().min(1, "Clave requerida"),
});

// Esquema de Aplicación de Préstamo (Existente)
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

/* =============== DDL: asegurar tablas =============== */
async function ensureTables() {
    // 1. Tabla loan_requests (Préstamos)
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

    // 2. Tabla USERS
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
                                             user_id SERIAL PRIMARY KEY,
                                             rut VARCHAR(12) UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        CREATE INDEX IF NOT EXISTS idx_users_rut ON users(rut);
    `);

    // Columna phone
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS phone TEXT;`);

    // 🔹 NUEVO: columna de saldo pendiente
    await pool.query(`
        ALTER TABLE loan_requests 
        ADD COLUMN IF NOT EXISTS remaining_balance INTEGER;
    `);

    // 🔹 NUEVO: tabla de pagos
    await pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            loan_id INTEGER NOT NULL REFERENCES loan_requests(id) ON DELETE CASCADE,
            amount INTEGER NOT NULL,
            method TEXT,
            paid_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // 🔹 Inicializar remaining_balance en préstamos antiguos
    await pool.query(`
        UPDATE loan_requests
        SET remaining_balance = amount
        WHERE remaining_balance IS NULL;
    `);

    // Constraint teléfono
    try {
        await pool.query(`
            ALTER TABLE loan_requests
                ADD CONSTRAINT chk_phone_cl
                    CHECK (phone IS NULL OR phone ~ '^\\+?569 ?[0-9]{8}$');
        `);
    } catch (_) {
        // ya existe
    }
}

/* =============== RUTAS DE AUTENTICACIÓN (HU 5) =============== */

// POST /loans/register
router.post("/register", async (req, res) => {
    try {
        await ensureTables();
        const parsed = RegisterSchema.parse(req.body);
        const { rut, email, password, full_name } = parsed;

        const passwordHash = await hashPassword(password);

        const { rows } = await pool.query(
            `INSERT INTO users (rut, email, password_hash, full_name)
             VALUES ($1, $2, $3, $4)
                 RETURNING user_id, rut, full_name, email`,
            [rut, email, passwordHash, full_name]
        );

        const user = rows[0];
        const token = generateToken(user.user_id, user.rut);

        res.status(201).json({
            token,
            user_id: user.user_id,
            full_name: user.full_name,
            rut: user.rut,
            message: "Registro exitoso.",
        });
    } catch (e) {
        if (e.code === "23505") {
            return res.status(409).json({ error: "El RUT o Email ya se encuentra registrado." });
        }
        if (e.issues) {
            const firstError = e.issues[0]?.message || "Datos inválidos.";
            return res.status(400).json({ error: firstError });
        }
        console.error(e);
        res.status(500).json({ error: "registration_failed" });
    }
});

// POST /loans/login
router.post("/login", async (req, res) => {
    try {
        const parsed = LoginSchema.parse(req.body);
        const { rut, password } = parsed;

        const { rows } = await pool.query(`SELECT * FROM users WHERE rut = $1`, [rut]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: "RUT o clave inválida." });
        }

        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "RUT o clave inválida." });
        }

        const token = generateToken(user.user_id, user.rut);

        res.json({
            token,
            user_id: user.user_id,
            full_name: user.full_name,
            rut: user.rut,
        });
    } catch (e) {
        if (e.issues) {
            const firstError = e.issues[0]?.message || "Datos inválidos.";
            return res.status(400).json({ error: firstError });
        }
        console.error("Error en POST /login:", e);
        res.status(500).json({ error: "login_failed" });
    }
});

/* =============== Rutas bajo /loans =============== */

// Salud del router
router.get("/health", (_req, res) => res.json({ ok: true, scope: "loans" }));

// POST /loans/apply → inserta, calcula scoring y devuelve {id,status,scoring}
router.post("/apply", async (req, res) => {
    try {
        await ensureTables();

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

        // Insertar como pendiente (incluyendo remaining_balance)
        const insertQ = `
            INSERT INTO loan_requests
            (rut, full_name, email, phone, amount, term_months, income, status, remaining_balance)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente',$5)
                RETURNING *;
        `;
        const { rows: insertedRows } = await pool.query(insertQ, [
            rut,
            full_name,
            email,
            phone ?? null,
            amount,
            term_months,
            income ?? null,
        ]);
        const reqRow = insertedRows[0];

        const ingreso = income ?? 0;
        const score = calcularScoring(ingreso, amount, term_months);

        const finalStatus = score >= 60 ? "aprobada" : "rechazada";

        const updateQ = `
            UPDATE loan_requests
            SET status = $2, scoring = $3
            WHERE id = $1
            RETURNING id, status, scoring;
        `;
        const { rows: updatedRows } = await pool.query(updateQ, [reqRow.id, finalStatus, score]);

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

// --- RUTA PROTEGIDA: GET /loans/dashboard ---
router.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const { rut } = req.user;

        const { rows: loanRequests } = await pool.query(
            `SELECT id, amount, term_months, status, created_at, scoring, remaining_balance
             FROM loan_requests
             WHERE rut = $1
             ORDER BY created_at DESC`,
            [rut]
        );

        const pendingPayments = loanRequests
            .filter((r) => r.status === "aprobada" && r.remaining_balance > 0)
            .map((r) => ({
                loan_id: r.id,
                amount: Math.round(r.amount / r.term_months),
                due_date: new Date(
                    new Date().setMonth(new Date().getMonth() + 1)
                )
                    .toISOString()
                    .split("T")[0],
            }));

        res.json({
            rut,
            latest_status: loanRequests[0]?.status || "No hay solicitudes",
            loan_requests: loanRequests,
            pending_payments: pendingPayments,
            message: "Acceso autorizado al dashboard.",
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "dashboard_failed" });
    }
});

// 🔹 GET /loans/:id → detalle de un préstamo (para el portal de pagos)
// 🔹 GET /loans/:id → detalle de un préstamo (para el portal de pagos)
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const loanId = Number(req.params.id);

        if (Number.isNaN(loanId)) {
            return res.status(400).json({ error: "id_invalido" });
        }

        // 🔥 Arreglo: buscamos solo por id (simplificado para el ramo)
        const { rows } = await pool.query(
            `SELECT id, rut, full_name, amount, term_months, status, scoring, created_at, remaining_balance
             FROM loan_requests
             WHERE id = $1`,
            [loanId]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "not_found" });
        }

        return res.json(rows[0]);
    } catch (e) {
        console.error("Error en GET /loans/:id", e);
        return res.status(500).json({ error: "internal_error" });
    }
});


// 🔹 POST /loans/:id/payments → registrar un pago (simulado)
router.post("/:id/payments", authenticateToken, async (req, res) => {
    try {
        await ensureTables();

        const loanId = Number(req.params.id);
        const { amount, method } = req.body;

        if (Number.isNaN(loanId)) {
            return res.status(400).json({ message: "ID de préstamo inválido." });
        }

        const pago = Number(amount);
        if (!pago || pago <= 0) {
            return res.status(400).json({ message: "Monto inválido." });
        }

        // 🔥 Arreglo: buscamos solo por id
        const { rows: loanRows } = await pool.query(
            `SELECT id, rut, amount, term_months, status, remaining_balance
             FROM loan_requests
             WHERE id = $1`,
            [loanId]
        );

        const loan = loanRows[0];
        if (!loan) {
            return res.status(404).json({ message: "Crédito no encontrado." });
        }

        if (loan.remaining_balance <= 0) {
            return res.status(400).json({ message: "El crédito ya está pagado." });
        }

        const { rows: paymentRows } = await pool.query(
            `INSERT INTO payments (loan_id, amount, method)
             VALUES ($1, $2, $3)
                 RETURNING id, loan_id, amount, method, paid_at`,
            [loan.id, pago, method || null]
        );

        const newBalance = Math.max(loan.remaining_balance - pago, 0);

        const { rows: updatedLoanRows } = await pool.query(
            `UPDATE loan_requests
             SET remaining_balance = $1
             WHERE id = $2
                 RETURNING id, rut, full_name, amount, term_months, status, scoring, created_at, remaining_balance`,
            [newBalance, loan.id]
        );

        return res.status(201).json({
            message: "Pago registrado correctamente (simulado).",
            loan: updatedLoanRows[0],
            payment: paymentRows[0],
        });
    } catch (e) {
        console.error("Error en POST /loans/:id/payments", e);
        return res.status(500).json({ message: "Error procesando pago." });
    }
});


module.exports = router;
