import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight, ShieldCheck, Calculator, FileText, CheckCircle2,
    CreditCard, Banknote, HandCoins, Sparkles
} from "lucide-react";

/* ====== Componentes auxiliares ====== */
function Benefit({ icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-700">{icon}</span>
                {title}
            </div>
            <p className="mt-2 text-sm text-zinc-600">{desc}</p>
        </div>
    );
}

function ProductCard({ icon, title, desc, bullets = [], ctaLabel = "Conocer", to = "#" }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="absolute right-[-40%] top-[-40%] h-40 w-40 rounded-full bg-gradient-to-tr from-indigo-200/40 to-emerald-200/40 blur-2xl transition-transform group-hover:scale-125" />
            <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-700">
                    {icon}<span className="text-sm font-semibold">{title}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{desc}</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                    {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600"/><span>{b}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4">
                    {to === "#" ? (
                        <button className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800">{ctaLabel}</button>
                    ) : (
                        <Link to={to} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">{ctaLabel}</Link>
                    )}
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, title, children }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-sm">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-700">{icon}</div>
                <div className="font-semibold">{title}</div>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{children}</p>
        </div>
    );
}

function Step({ number, title, children }) {
    return (
        <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-800">{number}</div>
                <div className="font-semibold">{title}</div>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{children}</p>
        </li>
    );
}

function Faq({ q, a }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="font-medium">{q}</div>
            <p className="mt-2 text-sm text-zinc-600">{a}</p>
        </div>
    );
}

function FooterCol({ title, links = [] }) {
    return (
        <div>
            <div className="text-sm font-semibold">{title}</div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                {links.map((l, i) => (
                    <li key={i}><a href="#" className="hover:text-zinc-900">{l}</a></li>
                ))}
            </ul>
        </div>
    );
}

/* ====== Landing page ====== */
export default function Landing() {
    return (
        <div className="min-h-screen bg-white text-zinc-900">
            {/* Promo strip */}
            <div className="relative z-50 border-b border-zinc-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs text-zinc-700">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5"/>
            Tasas preferentes para clientes con pago automático.
          </span>
                    <Link to="/loan" className="font-medium underline-offset-2 hover:underline">Simula tu crédito</Link>
                </div>
            </div>

            {/* Top bar */}
            <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-emerald-400" />
                        <span className="text-sm font-semibold tracking-tight">Banco INF</span>
                    </div>
                    <nav className="hidden items-center gap-6 md:flex">
                        <a href="#productos" className="text-sm text-zinc-600 hover:text-zinc-900">Productos</a>
                        <a href="#beneficios" className="text-sm text-zinc-600 hover:text-zinc-900">Beneficios</a>
                        <a href="#faq" className="text-sm text-zinc-600 hover:text-zinc-900">Ayuda</a>
                        <Link to="/loan" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Simular crédito</Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="relative isolate overflow-hidden">
                <div className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/70 via-sky-200/60 to-emerald-200/70 blur-3xl" />
                <div className="mx-auto max-w-6xl px-4 py-14 md:py-18">
                    <div className="grid items-center gap-10 md:grid-cols-2">
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.4}}>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5"/> Seguridad nivel bancario
              </span>
                            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                                Finanzas claras, decisiones simples.
                            </h1>
                            <p className="mt-4 max-w-prose text-[15px] text-zinc-600">
                                Simula tu <span className="font-medium text-zinc-900">préstamo de consumo</span> en segundos, con una experiencia transparente.
                                Sin papeleos. 100% online.
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Link to="/loan" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow">
                                    Comenzar simulación <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a href="#productos" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-800">
                                    Ver productos
                                </a>
                            </div>
                            <div className="mt-6 flex items-center gap-6 text-xs text-zinc-500">
                                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> Sin costos ocultos</div>
                                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Datos cifrados</div>
                            </div>
                        </motion.div>

                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.05}}>
                            <div className="relative">
                                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-400/20 via-emerald-300/10 to-blue-400/20 blur-2xl" />
                                <div className="relative rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-500">Simulador</span>
                                        <Calculator className="h-5 w-5 text-zinc-500"/>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                            <div className="text-zinc-500">Monto</div>
                                            <div className="text-lg font-semibold text-zinc-900">$1.500.000</div>
                                        </div>
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                            <div className="text-zinc-500">Plazo</div>
                                            <div className="text-lg font-semibold text-zinc-900">24 meses</div>
                                        </div>
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                            <div className="text-zinc-500">Cuota estimada</div>
                                            <div className="text-lg font-semibold text-emerald-600">$62.500</div>
                                        </div>
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                                            <div className="text-zinc-500">Estado</div>
                                            <div className="text-lg font-semibold text-emerald-600">Pre-aprobado</div>
                                        </div>
                                    </div>
                                    <Link to="/loan" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
                                        Ir al simulador
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Banda de beneficios */}
            <section id="beneficios" className="border-y border-zinc-200 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-3">
                    <Benefit icon={<ShieldCheck className="h-5 w-5"/>} title="Protección avanzada" desc="Autenticación fuerte y monitoreo de fraude 24/7."/>
                    <Benefit icon={<HandCoins className="h-5 w-5"/>} title="Mejores condiciones" desc="Tasas preferentes con pago automático y buen comportamiento."/>
                    <Benefit icon={<FileText className="h-5 w-5"/>} title="100% digital" desc="Solicita, evalúa y firma desde cualquier dispositivo."/>
                </div>
            </section>

            {/* Productos destacados */}
            <section id="productos" className="mx-auto max-w-6xl px-4 py-14">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">Elige el producto que necesitas</h2>
                        <p className="mt-1 text-sm text-zinc-600">Diseñados para acompañar tu día a día.</p>
                    </div>
                    <Link to="/loan" className="hidden rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 sm:inline-flex">Ver simulador</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <ProductCard
                        icon={<CreditCard className="h-6 w-6"/>}
                        title="Tarjeta de Crédito"
                        desc="Compras en cuotas y beneficios exclusivos."
                        bullets={["Cuotas sin interés en comercios adheridos","Tecnología contactless","Gestión desde la app"]}
                        ctaLabel="Conocer más"
                    />
                    <ProductCard
                        icon={<Banknote className="h-6 w-6"/>}
                        title="Préstamo de Consumo"
                        desc="Financia tus proyectos con cuotas fijas."
                        bullets={["Simulación en segundos","Respuesta rápida","Firma digital"]}
                        ctaLabel="Simular ahora"
                        to="/loan"
                    />
                    <ProductCard
                        icon={<ShieldCheck className="h-6 w-6"/>}
                        title="Cuenta Corriente"
                        desc="Administra tu dinero con seguridad y flexibilidad."
                        bullets={["Transferencias instantáneas","Tarjeta débito incluida","Atención 24/7"]}
                        ctaLabel="Abrir cuenta"
                    />
                </div>
            </section>

            {/* Franja de confianza (logos placeholder) */}
            <section className="border-t border-zinc-200 bg-zinc-50">
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">Confían en nuestros servicios</p>
                    <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs text-zinc-500">Logo {i + 1}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mx-auto max-w-6xl px-4 py-14">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold">Preguntas frecuentes</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Faq q="¿Puedo simular sin crear una cuenta?" a="Sí. La simulación es 100% abierta. Solo pedimos tus datos si decides postular."/>
                    <Faq q="¿Qué requisitos mínimos existen?" a="Ser mayor de edad, contar con cédula vigente y demostrar ingresos."/>
                    <Faq q="¿Cuánto tarda la evaluación?" a="En general, minutos. Si necesitamos más antecedentes, te lo notificaremos."/>
                    <Faq q="¿Mi información está segura?" a="Sí. Aplicamos cifrado TLS y controles de acceso estrictos."/>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-200 bg-white">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-blue-500 to-emerald-400" />
                            <span className="text-sm font-semibold tracking-tight">Banco INF</span>
                        </div>
                        <p className="mt-3 text-sm text-zinc-600">Soluciones financieras simples y seguras.</p>
                    </div>
                    <FooterCol title="Productos" links={["Cuenta Corriente","Tarjeta de Crédito","Préstamo de Consumo","Inversiones"]} />
                    <FooterCol title="Soporte" links={["Centro de ayuda","Seguridad","Canales de atención","Reclamos"]} />
                    <FooterCol title="Legal" links={["Términos y condiciones","Política de privacidad","Cookies"]} />
                </div>
                <div className="border-t border-zinc-200">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-zinc-500">
                        <span>© {new Date().getFullYear()} Banco INF</span>
                        <Link to="/loan" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-800">Simulador</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
