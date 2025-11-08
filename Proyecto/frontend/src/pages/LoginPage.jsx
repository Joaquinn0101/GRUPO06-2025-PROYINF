import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react'; // Importamos los íconos

const LoginPage = () => {
    const [rut, setRut] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Estado para ver contraseña
    
    const navigate = useNavigate();
    const auth = useAuth();

    // No necesitamos 'normalizeRut' aquí porque el
    // 'LoginSchema' del backend ya lo hace con z.transform()
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/loans/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rut, password }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }
            
            auth.login(data);
            navigate('/dashboard');

        } catch (err) {
            if (err.name === 'SyntaxError') {
                setError('Error grave del servidor. Contacte a soporte.');
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-zinc-200">
                <h2 className="text-3xl font-semibold text-center text-zinc-900 mb-6">Iniciar Sesión</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-600">RUT</label>
                        <input 
                            type="text" 
                            value={rut} 
                            onChange={(e) => setRut(e.target.value)} 
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ej: 12.345.678-5"
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-zinc-600">Contraseña</label>
                        <div className="relative mt-1">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                                required 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-800"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    
                    <button 
                        type="submit"
                        className="w-full py-2 px-4 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    >
                        Entrar
                    </button>
                </form>

                <p className="text-sm text-center text-zinc-600 mt-6">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;