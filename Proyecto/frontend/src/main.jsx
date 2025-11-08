import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; // Importamos nuestro AuthProvider
import App from './App.jsx'; // Componente App principal

import './index.css'; // CSS

// Llamamos a .createRoot 
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Envolvemos con el Router para manejar las URL */}
    <BrowserRouter>
      {/* 2. Envolvemos con nuestro AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);