require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares base
app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:5173", // Vite dev
        "http://localhost:4173", // Vite preview
    ],
}));

// Logger simple
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Healthcheck simple del servidor/app (sin DB)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Rutas de negocio bajo /loans
app.use("/loans", require("./loans.routes"));

// 404 + error handler
app.use((_req, res) => res.status(404).json({ error: "not_found" }));
app.use((err, _req, res, _next) => {
    console.error("Unhandled", err);
    res.status(500).json({ error: "internal_error" });
});

// Para diagnosticar crashes inesperados
process.on("unhandledRejection", (r) => console.error("UNHANDLED REJECTION", r));
process.on("uncaughtException", (e) => console.error("UNCAUGHT EXCEPTION", e));

// ⬇️ IMPORTANTE: esto faltaba y por eso el contenedor salía con code 0
app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});
