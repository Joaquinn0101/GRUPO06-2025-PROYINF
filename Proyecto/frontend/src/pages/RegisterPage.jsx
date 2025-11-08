import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react'; // 1. Importamos los íconos

// Función simple para limpiar el RUT
const normalizeRut = (rut = "") => {
    if (!rut || typeof rut !== 'string') return "";
    return rut.replace(/[\.\-\s]/g, '').toUpperCase();
}

const RegisterPage = () => {
    const [rut, setRut] = useState('');
    const [full_name, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // 2. Añadimos estado para la visibilidad de la contraseña
    const [showPassword, setShowPassword] = useState(false); 

    const navigate = useNavigate();
    const auth = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const cleanRut = normalizeRut(rut); 

        try {
            const response = await fetch('/api/loans/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    rut: cleanRut, 
                    full_name, 
                    email, 
                    password 
                }),
            });
            
            // Primero, intentamos leer la respuesta como JSON
            const data = await response.json();

            // Si la respuesta NO es 201 (OK), lanzamos el error que vino de la API
            if (!response.ok) {
                // data.error ahora será "RUT inválido" o "El RUT... ya existe"
                throw new Error(data.error || 'Error al registrar la cuenta.');
            }

            // Si todo está OK (201), logueamos y redirigimos
            auth.login(data);
            navigate('/dashboard');

        } catch (err) {
            // Este catch ahora recibe el "Unexpected end of JSON" O el error de la API
            
            // Si el error es el "Unexpected end..." significa que el backend CRASHEÓ
            if (err.name === 'SyntaxError') {
                setError('Error grave del servidor. Contacte a soporte.');
            } else {
                // Si no, es un error de negocio (ej. "RUT inválido")
                setError(err.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-zinc-200">
                <h2 className="text-3xl font-semibold text-center text-zinc-900 mb-6">Crear Cuenta</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ... (Campos de RUT, Nombre, Email) ... */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600">RUT</label>
                        <input 
                            type="text" 
                            value={rut}
                            onChange={(e) => setRut(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required 
                            placeholder="Ej: 12.345.678-K"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-600">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={full_name}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-600">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required 
                        />
                    </div>

                    {/* --- 3. CAMPO DE CONTRASEÑA MODIFICADO --- */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600">Contraseña</label>
                        {/* Envolvemos el input y el botón para posicionamiento */}
                        <div className="relative mt-1">
                            <input 
                                // El tipo cambia dinámicamente
                                type={showPassword ? 'text' : 'password'} 
                                value={password}
                                // ¡AQUÍ ESTÁ EL ARREGLO! (target en vez of targe)
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10" // pr-10 para dar espacio al ícono
                                minLength={6}
                                required 
                            />
                            {/* Este es el botón para ver/ocultar */}
                            <button
                                type="button" // Previene que envíe el formulario
                                onClick={() => setShowPassword(!showPassword)} // Cambia el estado
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
                        Crear cuenta
                    </button>
                </form>

                <p className="text-sm text-center text-zinc-600 mt-6">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;