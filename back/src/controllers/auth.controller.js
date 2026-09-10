import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/mysql.js';

export const register = async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role || !phone) {
        return res.status(400).json({ message: 'Datos incompletos' });
    }

    const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );

    if (existing.length > 0) {
        return res.status(409).json({ message: 'Email ya registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, phone)
     VALUES (?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, role, phone]
    );

    const userId = result.insertId;

    // Crear perfil según rol
    if (role === 'PATIENT') {
        await pool.query(
            'INSERT INTO patients (user_id) VALUES (?)',
            [userId]
        );
    }

    if (role === 'DOCTOR') {
        await pool.query(
            'INSERT INTO doctors (user_id) VALUES (?)',
            [userId]
        );
    }

    res.status(201).json({ message: 'Usuario creado correctamente' });
};


export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id; // Del token decodificado

        // Obtener datos completos del usuario
        const [rows] = await pool.query(
            'SELECT id, name, role FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        let doctorID = null;

        if (user.role === 'DOCTOR') {
            const [doctor] = await pool.query(
                'SELECT id FROM doctors WHERE user_id = ?',
                [user.id]
            );
            doctorID = doctor[0]?.id;
        }

        res.json({
            id: user.id,
            name: user.name,
            role: user.role,
            doctorID
        });
    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;
    let doctorID = null;

    if (!email || !password) {
        return res.status(400).json({ message: 'Datos incompletos' });
    }

    const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    if (rows.length === 0) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (user.role === 'DOCTOR') {
      const [doctor] = await pool.query(
        'SELECT id FROM doctors WHERE user_id = ?',
        [user.id]
      );

      doctorID = doctor[0].id;
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
            doctorID
        }
    });
};

export const desactUser = async (req, res) => {
    console.log(req.params.id)
  try {
    const [rows] = await pool.query(
      'UPDATE users SET activo = 0 WHERE id  = ?', [req.params.id]
    );

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
