import { pool } from '../db/mysql.js';

export const crearCita = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    const userId = req.user.id;

    // Obtener patient_id
    const [patientRows] = await pool.query(
      'SELECT id FROM patients WHERE user_id = ?',
      [userId]
    );

    if (patientRows.length === 0) {
      return res.status(403).json({ message: 'No es un paciente válido' });
    }

    const patientId = patientRows[0].id;

    // Verificar que el doctor exista
    const [doctorRows] = await pool.query(
      'SELECT id FROM doctors WHERE id = ?',
      [doctorId]
    );

    if (doctorRows.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    // Validar fecha no pasada
    const today = new Date();
    const selectedDate = new Date(appointmentDate);

    if (selectedDate < new Date(today.toISOString().split('T')[0])) {
      return res.status(400).json({ message: 'Fecha inválida' });
    }

    // Validar que el doctor trabaje ese día
    const dayMap = ['MON','TUE','WED','THU','FRI','SAT', 'SUN'];
    const dayOfWeek = dayMap[selectedDate.getDay()];

  
    const [scheduleRows] = await pool.query(
      `SELECT * FROM doctor_schedules
       WHERE doctor_id = ? AND day_of_week = ?`,
      [doctorId, dayOfWeek]
    );

    if (scheduleRows.length === 0) {
      return res.status(400).json({ message: 'El doctor no trabaja ese día' });
    }

    const schedule = scheduleRows[0];

    // Validar que hora esté dentro del rango
    if (
      appointmentTime < schedule.start_time ||
      appointmentTime > schedule.end_time
    ) {
      return res.status(400).json({
        message: 'Hora fuera del horario del doctor'
      });
    }

    //  Validar que no exista otra cita en ese horario
    const [existingAppointment] = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = ?
       AND appointment_date = ?
       AND appointment_time = ?
       AND status IN ('PENDING','CONFIRMED')`,
      [doctorId, appointmentDate, appointmentTime]
    );

    if (existingAppointment.length > 0) {
      return res.status(409).json({
        message: 'Ya existe una cita en ese horario'
      });
    }

    // Crear cita
    await pool.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, appointment_time, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, doctorId, appointmentDate, appointmentTime, reason]
    );

    res.status(201).json({ message: 'Cita creada correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateStatusCita = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Estado inválido'
      });
    }

    // Verificar que exista
    const [appointmentRows] = await pool.query(
      'SELECT * FROM appointments WHERE id = ?',
      [appointmentId]
    );

    if (appointmentRows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appointment = appointmentRows[0];

    // Si es DOCTOR, validar que sea su cita
    if (req.user.role === 'DOCTOR') {
      const [doctor] = await pool.query(
        'SELECT id FROM doctors WHERE user_id = ?',
        [req.user.id]
      );

      if (doctor.length === 0 || doctor[0].id !== appointment.doctor_id) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
    }

    await pool.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, appointmentId]
    );

    res.json({ message: 'Estado actualizado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const cancelCita = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Obtener patient_id
    const [patientRows] = await pool.query(
      'SELECT id FROM patients WHERE user_id = ?',
      [req.user.id]
    );

    if (patientRows.length === 0) {
      return res.status(403).json({ message: 'No es paciente válido' });
    }

    const patientId = patientRows[0].id;

    // Verificar cita
    const [appointmentRows] = await pool.query(
      'SELECT * FROM appointments WHERE id = ?',
      [appointmentId]
    );

    if (appointmentRows.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appointment = appointmentRows[0];

    if (appointment.patient_id !== patientId) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        message: 'No se puede cancelar una cita completada'
      });
    }

    await pool.query(
      'UPDATE appointments SET status = "CANCELLED" WHERE id = ?',
      [appointmentId]
    );

    res.json({ message: 'Cita cancelada correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const citasPaciente = async (req, res) => {
  try {
    const [patientRows] = await pool.query(
      'SELECT id FROM patients WHERE user_id = ?',
      [req.user.id]
    );

    if (patientRows.length === 0) {
      return res.status(403).json({ message: 'No es paciente válido' });
    }

    const patientId = patientRows[0].id;

    const [appointments] = await pool.query(`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        u.name AS doctor_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `, [patientId]);

    res.json(appointments);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const user = req.user;

    let query = `
      SELECT 
        a.id,
        a.doctor_id AS doctor_id,
        p_user.name AS patient,
        d_user.name AS doctor,
        DATE(a.appointment_date) AS date,
        TIME(a.appointment_time) AS time,
        a.status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users p_user ON p.user_id = p_user.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users d_user ON d.user_id = d_user.id
    `;

    const values = [];

    if (user.role === 'PATIENT') {
      query += ` WHERE p.user_id = ?`;
      values.push(user.id);
    }

    if (user.role === 'DOCTOR') {
      query += ` WHERE d.user_id = ?`;
      values.push(user.id);
    }

    query += ` ORDER BY a.appointment_date DESC`;

    const [rows] = await pool.query(query, values);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};



