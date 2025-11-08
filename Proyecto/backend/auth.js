// auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'TU_CLAVE_SUPER_SECRETA_Y_LARGA'; // Clave para firmar tokens
const SALT_ROUNDS = 10; 

async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function generateToken(userId, rut) {
    // Genera el token con el ID y RUT, válido por 24 horas
    return jwt.sign({ user_id: userId, rut: rut }, JWT_SECRET, { expiresIn: '24h' });
}

// Middleware para proteger rutas 
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
        req.user = user; 
        next();
    });
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    authenticateToken
};
