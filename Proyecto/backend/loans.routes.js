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
    if (!rut || typeof rut !== 'string') return "";
    return rut.replace(/[\.\-\s]/g, '').toUpperCase();
}

/* =============== Esquemas de validación request =============== */
// Esquemas NUEVOS para Registro/Login
const RegisterSchema = z.object({
    rut: z.string().min(3)
        // 1. Transformamos (limpiamos) el RUT apenas llega
        .transform(normalizeRut) 
        // 2. Validamos el RUT ya limpio
        .refine((v) => validarRut(v), { message: "RUT inválido" }),
    full_name: z.string().min(3, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La clave debe tener al menos 6 caracteres."), 
});

const LoginSchema = z.object({
    // --- AÑADE ESTA CORRECCIÓN ---
    rut: z.string().min(3, "RUT requerido")
        .transform(normalizeRut), // Limpia el RUT antes de usarlo
    
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


/* =============== DDL: asegurar tablas (CON TABLA USERS) =============== */
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

    // 2. NUEVA TABLA: USERS (ID, EMAIL, CONTRASEÑA CIFRADA)
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

    // Columna phone por si viene de antes sin ella
    await pool.query(`ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS phone TEXT;`);

    // Constraint
    try {
        await pool.query(`
            ALTER TABLE loan_requests
                ADD CONSTRAINT chk_phone_cl
                    CHECK (phone IS NULL OR phone ~ '^\\+?569 ?[0-9]{8}$');
        `);
    } catch (_) { /* ya existe */ }
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
             VALUES ($1, $2, $3, $4) RETURNING user_id, rut, full_name, email`, // Pedimos que devuelva más datos
            [rut, email, passwordHash, full_name]
        );

        const user = rows[0];
        const token = generateToken(user.user_id, user.rut);

        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Ahora devolvemos toda la info que el frontend necesita para el auth.login()
        res.status(201).json({ 
            token, 
            user_id: user.user_id, 
            full_name: user.full_name, // <-- Añadido
            rut: user.rut,             // <-- Añadido
            message: "Registro exitoso." 
        });

    } catch (e) {
        if (e.code === '23505') { 
            return res.status(409).json({ error: "El RUT o Email ya se encuentra registrado." });
        }
        if (e.issues) {
            // ¡Esta es la corrección para el "RUT INVÁLIDO"!
            // Manda un mensaje de error claro en lugar de solo "validation_error"
            const firstError = e.issues[0]?.message || "Datos inválidos.";
            return res.status(400).json({ error: firstError });
        }
        console.error(e);
        res.status(500).json({ error: "registration_failed" });
    }
});

// POST /loans/login
// POST /loans/login
router.post("/login", async (req, res) => {
    try {
        const parsed = LoginSchema.parse(req.body);
        const { rut, password } = parsed; // 'rut' aquí ya vendrá limpio

        // 1. Buscar usuario
        const { rows } = await pool.query(`SELECT * FROM users WHERE rut = $1`, [rut]);
        
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        const user = rows[0]; // Definimos 'user' desde la respuesta

        // 2. Primero, verificar si el usuario EXISTE
        if (!user) {
            // Si 'user' es undefined, devolvemos el error
            return res.status(401).json({ error: "RUT o clave inválida." });
        }

        // 3. SI EXISTE, comparar la clave
        const isPasswordValid = await comparePassword(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "RUT o clave inválida." });
        }

        // 4. Si todo es válido, generar token
        const token = generateToken(user.user_id, user.rut);

        // Devolvemos los mismos datos que en el registro
        res.json({ 
            token, 
            user_id: user.user_id, 
            full_name: user.full_name,
            rut: user.rut
        });

    } catch (e) {
        if (e.issues) {
            const firstError = e.issues[0]?.message || "Datos inválidos.";
            return res.status(400).json({ error: firstError });
        }
        console.error("Error en POST /login:", e); // Log de error
        res.status(500).json({ error: "login_failed" });
    }
});

/* =============== Rutas bajo /loans (Existente) =============== */

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

// --- NUEVA RUTA PROTEGIDA: GET /loans/dashboard ---
router.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        // req.user fue establecido por authenticateToken y contiene { user_id, rut }
        const { rut } = req.user;

        // 1. Obtener solicitudes del usuario (HU 4)
        const { rows: loanRequests } = await pool.query(
            `SELECT id, amount, term_months, status, created_at, scoring 
             FROM loan_requests 
             WHERE rut = $1 
             ORDER BY created_at DESC`,
            [rut]
        );

        // 2. Mock de cuotas pendientes (Integración HU 3 - Pagos)
        // Esto asume una cuota simple si el préstamo está 'aprobada'.
        const pendingPayments = loanRequests.filter(r => r.status === 'aprobada').map(r => ({
            loan_id: r.id,
            amount: r.amount / r.term_months, // Cuota simplificada (Monto / Plazo)
            due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
        }));


        res.json({
            rut,
            latest_status: loanRequests[0]?.status || "No hay solicitudes",
            loan_requests: loanRequests,
            pending_payments: pendingPayments,
            message: "Acceso autorizado al dashboard."
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "dashboard_failed" });
    }
});

module.exports = router;