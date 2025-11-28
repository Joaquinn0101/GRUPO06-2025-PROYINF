import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import {
    CheckCircle2,
    Circle,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    FileSignature,
    CalendarClock,
    UserPlus,
    LayoutDashboard // <--- Nuevo ícono para el dashboard
} from "lucide-react";

// ——— Utilidades ———
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function cleanRut(v = "") {
    return v.replace(/[.\-\s]/g, "").toUpperCase();
}
function formatRut(v = "") {
    const raw = cleanRut(v);
    if (!raw) return "";
    const cuerpo = raw.slice(0, -1).replace(/\D/g, "");
    const dv = raw.slice(-1);
    if (!cuerpo) return dv;
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${conPuntos}-${dv}`;
}
function validateRut(v = "") {
    const valor = cleanRut(v);
    if (!/^[0-9]+[0-9K]$/.test(valor)) return false;
    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1);
    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvFinal = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : String(dvEsperado);
    return dvFinal === dv;
}
function normalizePhoneCL(v = "") {
    const trimmed = v.replace(/\s+/g, "");
    let digits = trimmed.replace(/^\+/, "");
    if (digits.startsWith("569")) {
        // ok
    } else if (digits.startsWith("9")) {
        digits = "569" + digits;
    } else if (/^\d+$/.test(digits) && digits.length <= 11) {
        return v;
    }
    if (!digits.startsWith("569")) return v;
    const rest = digits.slice(3, 11);
    if (!rest) return "+569 ";
    if (rest.length > 8) return `+569 ${rest.slice(0, 8)}`;
    return `+569 ${rest}`;
}
function validatePhoneCL(v = "") {
    const s = v.trim();
    return /^\+?569\s?[0-9]{8}$/.test(s);
}

function estimateMonthlyPayment(capital, meses, tasaMensual = 0.019) {
    if (!capital || !meses) return 0;
    if (tasaMensual === 0) return Math.round(capital / meses);
    const r = tasaMensual;
    const cuota = (capital * r) / (1 - Math.pow(1 + r, -meses));
    return Math.round(cuota);
}

// ——— UI helpers ———
const Field = ({ label, required, children }) => (
    <label className="block">
    <span className="mb-1 block text-sm font-medium text-zinc-200">
      {label} {required && <span className="text-red-400">*</span>}
    </span>
        {children}
    </label>
);
const Card = ({ children, className = "" }) => (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur ${className}`}>{children}</div>
);

// ——— Vista principal ———
export default function LoanRequestView() {
    const navigate = useNavigate();
    const { token, user } = useAuth(); // <--- 2. Obtenemos el estado de autenticación
    
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [createdId, setCreatedId] = useState(null);
    const [status, setStatus] = useState(null);
    const [score, setScore] = useState(null);

    // Pre-llenar datos si el usuario ya está logueado (Opcional, pero buena UX)
    const [data, setData] = useState({
        rut: user?.rut ? formatRut(user.rut) : "", // Si hay usuario, usamos su RUT
        fullName: user?.name || "",
        email: "",
        phone: "",
        income: "",
        amount: "",
        term: "24",
        accept: false,
    });

    const canNext1 = useMemo(() => {
        return (
            validateRut(data.rut) &&
            data.fullName.trim() &&
            /.+@.+\..+/.test(data.email) &&
            validatePhoneCL(data.phone) &&
            Number(data.income) > 0
        );
    }, [data]);

    const canNext2 = useMemo(() => Number(data.amount) > 0 && Number(data.term) > 0, [data]);

    const monthlyPayment = useMemo(() => {
        return estimateMonthlyPayment(Number(data.amount) || 0, Number(data.term) || 0, 0.019);
    }, [data.amount, data.term]);

    async function createLoan(payload) {
        const res = await fetch(`/api/loans/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rut: payload.rut,
                full_name: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                amount: payload.amount,
                term_months: payload.term,
                income: payload.income ?? undefined,
            }),
        });
        if (!res.ok) throw new Error(`apply_failed_${res.status}`);
        return res.json();
    }

    async function handleSubmitReal() {
        setSubmitting(true);
        try {
            const payload = {
                rut: cleanRut(data.rut), 
                fullName: data.fullName.trim(),
                email: data.email.trim(),
                phone: data.phone.trim(),
                amount: Number(data.amount),
                term: Number(data.term),
                income: Number(data.income),
            };
            const applied = await createLoan(payload);
            setCreatedId(String(applied.id));
            setStatus(applied.status);
            setScore(applied.scoring ?? null);
        } catch (e) {
            console.error(e);
            alert("Error al enviar solicitud. Revisa los datos.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(800px_400px_at_100%_0%,rgba(59,130,246,0.15),transparent),radial-gradient(800px_400px_at_0%_0%,rgba(99,102,241,0.12),transparent)] bg-zinc-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-400 via-indigo-500 to-emerald-400" />
                        <span className="text-sm font-semibold tracking-tight">Préstamo de Consumo</span>
                    </Link>
                    <nav className="hidden gap-6 md:flex">
                        <Link to="/" className="text-sm text-zinc-300 hover:text-white">Inicio</Link>
                        {/* Ocultamos Login si ya hay token */}
                        {!token && <Link to="/login" className="text-sm text-zinc-300 hover:text-white">Login</Link>}
                    </nav>
                </div>
            </header>

            {/* Formulario */}
            <section id="form" className="mx-auto max-w-6xl px-4 py-10 pb-16">
                <div className="grid items-start gap-6 md:grid-cols-5">
                    <div className="md:col-span-3">
                        <Card>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Solicitud de Préstamo</h3>
                                <div className="text-xs text-zinc-400">Paso {step} de 3</div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                {["Datos", "Simulación", "Revisión"].map((t, i) => (
                                    <div key={t} className={`rounded-lg px-3 py-2 text-center ${i + 1 <= step ? "bg-white/20" : "bg-white/5"}`}>{t}</div>
                                ))}
                            </div>

                            {/* STEP 1 */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="RUT" required>
                                            <input
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.rut}
                                                inputMode="text"
                                                placeholder="12.345.678-5"
                                                onChange={(e) => setData({ ...data, rut: formatRut(e.target.value) })}
                                                // Si el usuario está logueado, podríamos bloquear el RUT para que coincida con su cuenta
                                                // readOnly={!!token} 
                                            />
                                            {!validateRut(data.rut) && data.rut && (
                                                <p className="mt-1 text-xs text-amber-300">RUT inválido (usa formato 12.345.678-5).</p>
                                            )}
                                        </Field>
                                        <Field label="Nombre completo" required>
                                            <input
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.fullName}
                                                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Email" required>
                                            <input
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.email}
                                                inputMode="email"
                                                placeholder="tucorreo@dominio.cl"
                                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Teléfono" required>
                                            <input
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.phone}
                                                inputMode="tel"
                                                placeholder="+569 12345678"
                                                maxLength={14}
                                                onChange={(e) => setData({ ...data, phone: normalizePhoneCL(e.target.value) })}
                                            />
                                            {!validatePhoneCL(data.phone) && data.phone && (
                                                <p className="mt-1 text-xs text-amber-300">Usa formato +569 12345678.</p>
                                            )}
                                        </Field>
                                        <Field label="Ingreso mensual (CLP)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.income}
                                                onChange={(e) => setData({ ...data, income: e.target.value })}
                                            />
                                        </Field>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <input
                                            id="acc" type="checkbox"
                                            className="h-4 w-4 rounded border-white/20 bg-zinc-900"
                                            checked={data.accept}
                                            onChange={(e) => setData({ ...data, accept: e.target.checked })}
                                        />
                                        <label htmlFor="acc" className="text-zinc-300">Acepto términos y condiciones.</label>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2 */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Monto solicitado (CLP)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.amount}
                                                onChange={(e) => setData({ ...data, amount: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Plazo (meses)" required>
                                            <input
                                                type="number" min={1}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.term}
                                                onChange={(e) => setData({ ...data, term: e.target.value })}
                                            />
                                        </Field>
                                    </div>
                                    <Card className="bg-white/10">
                                        <div className="flex items-center gap-3 text-sm text-zinc-200">
                                            <CalendarClock className="h-4 w-4" /> Estimación cuota mensual
                                        </div>
                                        <div className="mt-2 text-2xl font-semibold">${monthlyPayment.toLocaleString("es-CL")}</div>
                                    </Card>
                                </motion.div>
                            )}

                            {/* STEP 3 */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                                    <Card>
                                        <h4 className="font-medium text-white">Revisión</h4>
                                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-300">
                                            <div><dt className="text-zinc-400">RUT</dt><dd>{data.rut || "—"}</dd></div>
                                            <div><dt className="text-zinc-400">Nombre</dt><dd>{data.fullName || "—"}</dd></div>
                                            <div><dt className="text-zinc-400">Email</dt><dd>{data.email || "—"}</dd></div>
                                            <div><dt className="text-zinc-400">Teléfono</dt><dd>{data.phone || "—"}</dd></div>
                                            <div><dt className="text-zinc-400">Ingreso mensual</dt><dd>${Number(data.income || 0).toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-zinc-400">Monto solicitado</dt><dd>${Number(data.amount || 0).toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-zinc-400">Plazo</dt><dd>{data.term} meses</dd></div>
                                            <div><dt className="text-zinc-400">Cuota estimada</dt><dd>${monthlyPayment.toLocaleString("es-CL")}</dd></div>
                                        </dl>
                                    </Card>
                                    {!data.accept && (
                                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">
                                            <AlertTriangle className="h-4 w-4" /> Debes aceptar términos para enviar.
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Navegación */}
                            <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {!createdId && (
                                    <button
                                        disabled={step === 1}
                                        onClick={() => setStep((s) => (s > 1 ? s - 1 : s))}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-40 hover:bg-white/10"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Atrás
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        disabled={(step === 1 && (!canNext1 || !data.accept)) || (step === 2 && !canNext2)}
                                        onClick={() => setStep((s) => (s < 3 ? s + 1 : s))}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-40 hover:bg-zinc-200"
                                    >
                                        Siguiente <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : !createdId ? (
                                    <button
                                        disabled={!data.accept || submitting}
                                        onClick={handleSubmitReal}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-40 hover:bg-zinc-200"
                                    >
                                        {submitting ? "Enviando…" : "Enviar solicitud"}
                                    </button>
                                ) : (
                                    <div className="text-emerald-400 text-sm font-medium animate-pulse">
                                        ¡Solicitud enviada exitosamente!
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Columna derecha: estado */}
                    <div className="space-y-6 md:col-span-2" id="estado">
                        <Card>
                            <h4 className="text-lg font-semibold">Estado de la solicitud</h4>
                            <div className="mt-3 grid gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    {createdId ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-zinc-400" />}
                                    <span>Registrada {createdId && <span className="text-zinc-400">(ID {createdId})</span>}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {status === "inadmisible" || status === "rechazada" || status === "aprobada" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    ) : (<Circle className="h-4 w-4 text-zinc-400" />)}
                                    <span>Admisibilidad</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {status === "rechazada" || status === "aprobada" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    ) : (<Circle className="h-4 w-4 text-zinc-400" />)}
                                    <span>Evaluación de riesgo</span>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                                {!status && <div className="text-sm text-zinc-300">Aún sin evaluación.</div>}
                                {status === "inadmisible" && (<div className="text-sm text-amber-300">La solicitud no cumple criterios mínimos.</div>)}
                                {status === "rechazada" && (<div className="text-sm text-red-300">Solicitud rechazada tras evaluación de riesgo.</div>)}
                                {status === "aprobada" && (
                                    <div className="text-sm text-emerald-300">
                                        ¡Aprobada! Puntaje: <span className="font-semibold text-white">{score}</span>
                                    </div>
                                )}
                            </div>

                            {/* --- 4. LÓGICA DE BOTONES: SI HAY TOKEN VS NO HAY TOKEN --- */}
                            {createdId && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-6 p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-center"
                                >
                                    {token ? (
                                        /* CASO: USUARIO LOGUEADO */
                                        <>
                                            <p className="text-sm text-indigo-200 mb-3">
                                                Solicitud guardada. Revisa el detalle en tu panel.
                                            </p>
                                            <button 
                                                onClick={() => navigate('/dashboard')}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                                            >
                                                <LayoutDashboard className="h-4 w-4" />
                                                Ir a mi Dashboard
                                            </button>
                                        </>
                                    ) : (
                                        /* CASO: USUARIO NO LOGUEADO */
                                        <>
                                            <p className="text-sm text-indigo-200 mb-3">
                                                Para hacer seguimiento a esta solicitud, crea tu cuenta ahora.
                                            </p>
                                            <button 
                                                onClick={() => navigate('/register')}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Crear Cuenta
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </Card>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/10 bg-zinc-950/60 py-8 text-center text-xs text-zinc-500">
                © {new Date().getFullYear()} Préstamo de Consumo · Vista.
            </footer>
        </div>
    );
}