import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { user, logout, token } = useAuth(); // Obtenemos el token
    const navigate = useNavigate();
    
    // Estado para guardar los datos del dashboard
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Hook para llamar a la API del dashboard cuando la página carga
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return; // Salir si no hay token
            
            setLoading(true);
            try {
                const response = await fetch('/api/loans/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}` // <- Enviamos el token
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
    }, [token]); // El efecto se ejecuta cada vez que el token cambie

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // 'user' viene del login (localStorage), 'dashboardData' viene del fetch
    if (!user) {
        return <div>Cargando...</div>; // Estado de carga inicial
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-semibold text-zinc-900">Bienvenido, {user.name}</h2>
                        <p className="text-zinc-600">Este es el resumen de tu cuenta.</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {/* Sección de carga y errores */}
                {loading && <p>Cargando datos del dashboard...</p>}
                {error && <p className="text-red-600">{error}</p>}

                {/* Sección de datos del Dashboard */}
                {dashboardData && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-4">Tus Préstamos</h3>
                        <p className="text-sm text-zinc-600 mb-2">RUT: {dashboardData.rut}</p>
                        <p className="text-sm text-zinc-600 mb-4">Estado último préstamo: 
                            <span className="font-medium text-indigo-600 ml-1">{dashboardData.latest_status}</span>
                        </p>

                        {dashboardData.loan_requests?.length > 0 ? (
                            <ul className="space-y-3">
                                {dashboardData.loan_requests.map(loan => (
                                    <li key={loan.id} className="p-4 border border-zinc-200 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">Préstamo ID: {loan.id}</p>
                                            <p className="text-sm text-zinc-500">Monto: ${new Intl.NumberFormat('es-CL').format(loan.amount)}</p>
                                        </div>
                                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                            loan.status === 'aprobada' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                                        }`}>
                                            {loan.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-center text-zinc-500 py-4">No tienes solicitudes de préstamo.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;