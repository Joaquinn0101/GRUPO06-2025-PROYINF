import { createContext, useContext, useState, useEffect } from 'react';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos un "hook" personalizado para usar el contexto fácilmente
//    En lugar de importar useContext y AuthContext en cada archivo,
//    solo importaremos useAuth()
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Creamos el Proveedor (el componente que envolverá nuestra app)
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    // Este Efecto se ejecuta UNA VEZ cuando la app carga
    // Revisa si ya tenemos un token guardado en el navegador
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Función para Iniciar Sesión
    const login = (data) => {
        // data viene de la API de /login O /register
        setToken(data.token);
        
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Extraemos los datos del usuario (que ahora sí vienen completos)
        const userData = { 
            id: data.user_id, 
            name: data.full_name, // <-- data.full_name ahora existe
            rut: data.rut          // <-- data.rut ahora existe
        };
        setUser(userData);

        // Guardamos en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // Función para Cerrar Sesión
    const logout = () => {
        setToken(null);
        setUser(null);
        
        // Limpiamos localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // El "valor" que compartiremos con toda la app
    const value = {
        token,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};