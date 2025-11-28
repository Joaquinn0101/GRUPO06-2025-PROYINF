import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importamos todas nuestras páginas
import Landing from './pages/Landing.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoanRequestView from "./LoanRequestView";
import ProtectedRoute from './components/ProtectedRoute.jsx';

// 🔹 Nuevo: portal de pagos
import PaymentPortalPage from './pages/PaymentPortalPage.jsx';

const Navbar = () => {
    const { token, logout } = useAuth();

    return (
        <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40 backdrop-blur bg-white/80">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-emerald-400" />
                    <span className="text-sm font-semibold tracking-tight">Banco INF</span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/loan" className="text-sm text-zinc-600 hover:text-zinc-900">
                        Simulador
                    </Link>

                    {token ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="text-sm text-zinc-600 hover:text-zinc-900"
                            >
                                Mi Dashboard
                            </Link>
                            <button
                                onClick={logout}
                                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:shadow-sm"
                            >
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm text-zinc-600 hover:text-zinc-900">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow"
                            >
                                Registro
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

function App() {
    return (
        <div className="App">
            <Navbar />
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/loan" element={<LoanRequestView />} />

                {/* Rutas Protegidas */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* 🔹 Nuevo: Portal de pagos protegido */}
                <Route
                    path="/portal-pagos/:loanId"
                    element={
                        <ProtectedRoute>
                            <PaymentPortalPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
            </Routes>
        </div>
    );
}

export default App;
