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
    
    // Recomendación del sistema
    const [recommendation, setRecommendation] = useState(null);
    const [simulatedProb, setSimulatedProb] = useState(null);
    const [loadingRec, setLoadingRec] = useState(false);

    // Pre-llenar datos si el usuario ya está logueado (Opcional, pero buena UX)
    const [data, setData] = useState({
        rut: user?.rut ? formatRut(user.rut) : "", // Si hay usuario, usamos su RUT
        fullName: user?.name || "",
        email: "",
        phone: "",
        income: "",
        seniority: "", // <-- NUEVO
        existingDebt: "", // <-- NUEVO
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
            Number(data.income) > 0 &&
            data.seniority !== "" &&
            data.existingDebt !== ""
        );
    }, [data]);

    const canNext2 = useMemo(() => Number(data.amount) > 0 && Number(data.term) > 0, [data]);

    const monthlyPayment = useMemo(() => {
        return estimateMonthlyPayment(Number(data.amount) || 0, Number(data.term) || 0, 0.019);
    }, [data.amount, data.term]);

    // Obtener recomendación al pasar al paso 2
    async function getRecommendation() {
        setLoadingRec(true);
        try {
            const res = await fetch(`/api/loans/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    income: Number(data.income),
                    seniority: Number(data.seniority),
                    existing_debt: Number(data.existingDebt)
                }),
            });
            if (res.ok) {
                const rec = await res.json();
                setRecommendation(rec);
                setSimulatedProb(rec.probabilidad);
                // Sugerimos los valores al usuario
                setData(prev => ({
                    ...prev,
                    amount: rec.monto,
                    term: rec.plazo
                }));
            }
        } catch (e) {
            console.error("Rec failed", e);
        } finally {
            setLoadingRec(false);
        }
    }

    // Simular dinámicamente
    async function simulate(amount, term) {
        try {
            const res = await fetch(`/api/loans/simulate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    income: Number(data.income),
                    amount: Number(amount),
                    term: Number(term),
                    seniority: Number(data.seniority),
                    existing_debt: Number(data.existingDebt)
                }),
            });
            if (res.ok) {
                const result = await res.json();
                setSimulatedProb(result.probabilidad);
            }
        } catch (e) {
            console.error("Simulation failed", e);
        }
    }

    const handleStep1Next = () => {
        getRecommendation();
        setStep(2);
    };

    const handleAmountChange = (val) => {
        setData({ ...data, amount: val });
        simulate(val, data.term);
    };

    const handleTermChange = (val) => {
        setData({ ...data, term: val });
        simulate(data.amount, val);
    };

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
                seniority: payload.seniority ?? undefined,
                existing_debt: payload.existing_debt ?? undefined,
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
                seniority: Number(data.seniority),
                existing_debt: Number(data.existingDebt),
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
                                        </Field>
                                        <Field label="Ingreso mensual (CLP)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.income}
                                                onChange={(e) => setData({ ...data, income: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Antigüedad laboral (años)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.seniority}
                                                onChange={(e) => setData({ ...data, seniority: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Deuda financiera mensual (CLP)" required>
                                            <input
                                                type="number" min={0}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                value={data.existingDebt}
                                                placeholder="Suma de cuotas de otros créditos"
                                                onChange={(e) => setData({ ...data, existingDebt: e.target.value })}
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
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-6">
                                    {loadingRec && (
                                        <div className="flex items-center justify-center py-10">
                                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                            <span className="ml-3 text-sm text-zinc-400">Calculando tu oferta óptima...</span>
                                        </div>
                                    )}

                                    {!loadingRec && recommendation && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                            <Card className="bg-indigo-500/10 border-indigo-500/20">
                                                <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">Oferta Recomendada</h4>
                                                <div className="mt-3 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-zinc-400">Monto sugerido</p>
                                                        <p className="text-lg font-bold">${recommendation.monto.toLocaleString("es-CL")}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-zinc-400">Plazo sugerido</p>
                                                        <p className="text-lg font-bold">{recommendation.plazo} meses</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setData({...data, amount: recommendation.monto, term: recommendation.plazo});
                                                        setSimulatedProb(recommendation.probabilidad);
                                                    }}
                                                    className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    USAR RECOMENDACIÓN
                                                </button>
                                            </Card>
                                        </motion.div>
                                    )}

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-zinc-300">Monto solicitado</span>
                                                <span className="text-lg font-bold text-white">${Number(data.amount).toLocaleString("es-CL")}</span>
                                            </div>
                                            <input 
                                                type="range" min="500000" max="20000000" step="100000"
                                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                value={data.amount}
                                                onChange={(e) => handleAmountChange(e.target.value)}
                                            />
                                            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                                <span>$500.000</span>
                                                <span>$20.000.000</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-zinc-300">Plazo</span>
                                                <span className="text-lg font-bold text-white">{data.term} meses</span>
                                            </div>
                                            <input 
                                                type="range" min="6" max="60" step="6"
                                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                value={data.term}
                                                onChange={(e) => handleTermChange(e.target.value)}
                                            />
                                            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                                <span>6 meses</span>
                                                <span>60 meses</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Card className="bg-white/5 border-white/5">
                                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                                                <CalendarClock className="h-3 w-3" /> Cuota mensual
                                            </div>
                                            <div className="text-xl font-bold">${monthlyPayment.toLocaleString("es-CL")}</div>
                                        </Card>
                                        <Card className="bg-white/5 border-white/5">
                                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                                                <CheckCircle2 className="h-3 w-3" /> Probabilidad
                                            </div>
                                            <div className={`text-xl font-bold ${simulatedProb > 70 ? "text-emerald-400" : simulatedProb > 40 ? "text-amber-400" : "text-red-400"}`}>
                                                {simulatedProb}%
                                            </div>
                                        </Card>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3 */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                                    <Card>
                                        <h4 className="font-medium text-white">Revisión Final</h4>
                                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-300">
                                            <div><dt className="text-zinc-400">Nombre</dt><dd>{data.fullName || "—"}</dd></div>
                                            <div><dt className="text-zinc-400">Ingreso</dt><dd>${Number(data.income || 0).toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-zinc-400">Antigüedad</dt><dd>{data.seniority} años</dd></div>
                                            <div><dt className="text-zinc-400">Deuda actual</dt><dd>${Number(data.existingDebt || 0).toLocaleString("es-CL")}</dd></div>
                                            <div className="col-span-2 border-t border-white/5 pt-2 mt-1"></div>
                                            <div><dt className="text-zinc-400">Monto</dt><dd className="text-white font-semibold">${Number(data.amount || 0).toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-zinc-400">Plazo</dt><dd className="text-white font-semibold">{data.term} meses</dd></div>
                                            <div><dt className="text-zinc-400">Cuota</dt><dd className="text-white font-semibold">${monthlyPayment.toLocaleString("es-CL")}</dd></div>
                                            <div><dt className="text-zinc-400">Probabilidad</dt><dd className="text-emerald-400 font-bold">{simulatedProb}%</dd></div>
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

                                {step === 1 ? (
                                    <button
                                        disabled={!canNext1 || !data.accept}
                                        onClick={handleStep1Next}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-40 hover:bg-zinc-200"
                                    >
                                        Ver recomendación <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : step === 2 ? (
                                    <button
                                        disabled={!canNext2}
                                        onClick={() => setStep(3)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-40 hover:bg-zinc-200"
                                    >
                                        Revisar solicitud <ArrowRight className="h-4 w-4" />
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