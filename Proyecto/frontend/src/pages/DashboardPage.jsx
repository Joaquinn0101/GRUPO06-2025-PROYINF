import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FileDown, FileText } from "lucide-react";

const DashboardPage = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;

            setLoading(true);
            try {
                const response = await fetch("/api/loans/dashboard", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("No se pudo cargar el dashboard");

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [token]);

    const handleGoToPayment = (loanId) => {
        navigate(`/portal-pagos/${loanId}`);
    };

    if (!user) return <div className="p-8 text-center text-zinc-500">Cargando sesión...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold">Bienvenido, {user.name}</h2>
                        <p className="text-zinc-500">Resumen de tu cuenta</p>
                    </div>

                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 shadow-sm"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {loading && <p className="text-center py-10 text-zinc-500">Cargando...</p>}
                {error && <p className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl">{error}</p>}

                {dashboardData && (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200">
                        <div className="p-6 border-b border-zinc-100">
                            <h3 className="text-xl font-semibold">Mis Solicitudes</h3>
                            <p className="text-sm text-zinc-500 mt-1">RUT asociado: {dashboardData.rut}</p>
                        </div>

                        <div className="p-6">
                            {dashboardData.loan_requests?.length > 0 ? (
                                <ul className="space-y-4">
                                    {dashboardData.loan_requests.map((loan) => (
                                        <li key={loan.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">

                                                <div>
                                                    <div className="text-xs text-zinc-500 mb-1">
                                                        Solicitud #{loan.id} • {new Date(loan.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-2xl font-bold">
                                                        ${new Intl.NumberFormat("es-CL").format(loan.amount)}
                                                    </div>
                                                    <p className="text-sm text-zinc-500">a {loan.term_months} meses</p>
                                                </div>

                                                <div className="flex flex-col items-end gap-3">
                                                    <button
                                                        onClick={() => handleGoToPayment(loan.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                                                    >
                                                        Ir a portal de pagos
                                                    </button>
                                                </div>

                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
                                    <h3 className="font-medium">No tienes solicitudes activas.</h3>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
