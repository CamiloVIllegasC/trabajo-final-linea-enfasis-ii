import { pool } from "../db/mysql.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const [[totalUsers]] = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE activo = 1",
    );

    const [[totalDoctors]] = await pool.query(
      "SELECT COUNT(*) AS total FROM doctors d JOIN users u ON u.id = d.user_id WHERE u.activo = 1",
    );

    const [[totalPatients]] = await pool.query(
      "SELECT COUNT(*) AS total FROM patients p JOIN users u ON u.id = p.user_id WHERE u.activo = 1",
    );

    const [[totalAdmins]] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = "ADMIN" AND activo = 1',
    );

    const [[totalAppointments]] = await pool.query(
      "SELECT COUNT(*) as total FROM appointments",
    );

    const [[appointmentsToday]] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM appointments 
       WHERE appointment_date = CURDATE()`,
    );

    const [[pendingAppointments]] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM appointments 
       WHERE status = 'PENDING'`,
    );

    res.json({
      totalUsers: totalUsers.total,
      totalAdmins: totalAdmins.total,
      totalDoctors: totalDoctors.total,
      totalPatients: totalPatients.total,
      totalAppointments: totalAppointments.total,
      appointmentsToday: appointmentsToday.total,
      pendingAppointments: pendingAppointments.total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.telefono,
        GROUP_CONCAT(s.name) AS specialties
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      LEFT JOIN doctor_specialties ds ON d.id = ds.doctor_id
      LEFT JOIN specialties s ON ds.specialty_id = s.id
      WHERE u.activo = 1
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const rowsFormatted = rows.map((user) => ({
      ...user,
      specialties: user.specialties ? user.specialties.split(",") : [],
    }));

    res.json(rowsFormatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
