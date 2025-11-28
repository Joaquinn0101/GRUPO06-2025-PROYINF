import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileDown, FileText, AlertCircle } from 'lucide-react'; // Nuevos íconos

const DashboardPage = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            
            setLoading(true);
            try {
                const response = await fetch('/api/loans/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('No se pudo cargar la información del dashboard.');
                }
                
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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper para "traducir" el estado crudo a texto amigable
    const getStatusLabel = (status) => {
        if (status === 'aprobada') return 'Lista para firma digital';
        if (status === 'pendiente') return 'En evaluación';
        if (status === 'rechazada') return 'No cumple requisitos';
        return status;
    };

    // Helper para el color del estado
    const getStatusColor = (status) => {
        if (status === 'aprobada') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === 'rechazada') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-amber-100 text-amber-700 border-amber-200'; // Pendiente
    };

    if (!user) return <div className="p-8 text-center text-zinc-500">Cargando sesión...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-zinc-900">Bienvenido, {user.name}</h2>
                        <p className="text-zinc-500">Este es el resumen de tu cuenta.</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 font-medium rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {loading && <p className="text-center py-10 text-zinc-500">Cargando tus datos...</p>}
                {error && <p className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">{error}</p>}

                {dashboardData && (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100">
                            <h3 className="text-xl font-semibold text-zinc-900">Mis Solicitudes</h3>
                            <p className="text-sm text-zinc-500 mt-1">RUT asociado: {dashboardData.rut}</p>
                        </div>

                        <div className="p-6">
                            {dashboardData.loan_requests?.length > 0 ? (
                                <ul className="space-y-4">
                                    {dashboardData.loan_requests.map(loan => (
                                        <li key={loan.id} className="group relative bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                
                                                {/* Info Principal */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                            Solicitud #{loan.id}
                                                        </span>
                                                        <span className="text-zinc-300">•</span>
                                                        <span className="text-xs text-zinc-500">
                                                            {new Date(loan.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-zinc-900">
                                                        ${new Intl.NumberFormat('es-CL').format(loan.amount)}
                                                    </div>
                                                    <div className="text-sm text-zinc-500">
                                                        a {loan.term_months} meses
                                                    </div>
                                                </div>

                                                {/* Estado y Acciones */}
                                                <div className="flex flex-col items-end gap-3">
                                                    {/* Badge de Estado */}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(loan.status)}`}>
                                                        {getStatusLabel(loan.status)}
                                                    </span>

                                                    {/* Botón de Contrato (Solo si aprobada) */}
                                                    {loan.status === 'aprobada' && (
                                                        <button 
                                                            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
                                                            onClick={() => alert("Simulación: Descargando contrato PDF...")}
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                            Descargar contrato pre-aprobado
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mx-auto h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                                        <FileText className="h-6 w-6 text-zinc-400" />
                                    </div>
                                    <h3 className="text-zinc-900 font-medium">No tienes solicitudes activas</h3>
                                    <p className="text-zinc-500 text-sm mt-1">Simula un crédito para comenzar.</p>
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