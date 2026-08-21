import { pool } from '../db/mysql.js';

export const crearEspecialidad = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const formattedName =
            name.trim().charAt(0).toUpperCase() +
            name.trim().slice(1).toLowerCase();

        // Verificar si ya existe
        const [existing] = await pool.query(
            'SELECT id FROM specialties WHERE name = ?',
            [formattedName]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'La especialidad ya existe'
            });
        }

        // Insertar
        const [result] = await pool.query(
            'INSERT INTO specialties (name) VALUES (?)',
            [formattedName]
        );

        res.status(201).json({
            message: 'Especialidad creada correctamente',
            specialty: {
                id: result.insertId,
                name: formattedName
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getEspecialidades = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name FROM specialties ORDER BY name ASC'
    );

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

