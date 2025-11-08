import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    // 1. Obtenemos el token desde nuestro "cerebro"
    const { token } = useAuth();

    if (!token) {
        // 2. Si NO hay token, redirigimos al login
        return <Navigate to="/login" replace />;
    }

    // 3. Si HAY token, mostramos el componente hijo (la página protegida)
    return children;
};

export default ProtectedRoute;