import { pool } from "../db/mysql.js";

export const getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    let doctorQuery = `
      SELECT DISTINCT
        d.id AS doctor_id,
        u.name,
        u.email,
        u.telefono
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `;

    const params = [];

    if (specialty) {
      doctorQuery += `
        JOIN doctor_specialties ds ON d.id = ds.doctor_id
        WHERE ds.specialty_id = ?
      `;
      params.push(specialty);
    }

    doctorQuery += ' ORDER BY u.name ASC';

    const [doctors] = await pool.query(doctorQuery, params);

    if (doctors.length === 0) {
      return res.json([]);
    }

    // Especialidades
    const [specialtiesRows] = await pool.query(`
      SELECT 
        ds.doctor_id,
        s.name
      FROM doctor_specialties ds
      JOIN specialties s ON ds.specialty_id = s.id
    `);

    // Horarios
    const [scheduleRows] = await pool.query(`
      SELECT 
        doctor_id,
        day_of_week,
        start_time,
        end_time
      FROM doctor_schedules
    `);

    const result = doctors.map((doctor) => ({
      id: doctor.doctor_id,
      name: doctor.name,
      email: doctor.email,
      telefono: doctor.telefono,
      specialties: specialtiesRows
        .filter((s) => s.doctor_id === doctor.doctor_id)
        .map((s) => s.name),
      schedules: scheduleRows
        .filter((sch) => sch.doctor_id === doctor.doctor_id)
    }));

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.id;
    //  Doctor base
    const [doctorRows] = await pool.query(`
      SELECT 
        d.id AS doctor_id,
        u.name,
        u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [doctorId]);

    if (doctorRows.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const doctor = doctorRows[0];

    // Especialidades
    const [specialties] = await pool.query(`
      SELECT s.name
      FROM doctor_specialties ds
      JOIN specialties s ON ds.specialty_id = s.id
      WHERE ds.doctor_id = ?
    `, [doctorId]);

    // Horarios
    const [schedules] = await pool.query(`
      SELECT day_of_week, start_time, end_time
      FROM doctor_schedules
      WHERE doctor_id = ?
    `, [doctorId]);

    res.json({
      id: doctor.doctor_id,
      name: doctor.name,
      email: doctor.email,
      specialties: specialties.map((s) => s.name),
      schedules
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query;


    if (!date) {
      return res.status(400).json({
        message: 'La fecha es requerida'
      });
    }

    const dayMap = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const jsDay = new Date(date).getDay();
    const dayOfWeek = dayMap[jsDay];

  
    //  Obtener horario del doctor ese día
    const [scheduleRows] = await pool.query(
      `SELECT start_time, end_time
       FROM doctor_schedules
       WHERE doctor_id = ? AND day_of_week = ?`,
      [doctorId, dayOfWeek]
    );

    if (scheduleRows.length === 0) {
      return res.json({
        date,
        availableSlots: []
      });
    }

    const { start_time, end_time } = scheduleRows[0];

    // Obtener citas ya reservadas ese día
    const [appointments] = await pool.query(
      `SELECT TIME(appointment_date) as booked_time
       FROM appointments
       WHERE doctor_id = ?
       AND DATE(appointment_date) = ?`,
      [doctorId, date]
    );

    const bookedTimes = appointments.map(a => a.booked_time);

    // Generar bloques de 1 hora
    const slots = [];
    let current = start_time;

    while (current < end_time) {
      if (!bookedTimes.includes(current)) {
        slots.push(current);
      }

      // sumar 1 hora
      const [h, m] = current.split(':');
      const nextHour = String(parseInt(h) + 1).padStart(2, '0');
      current = `${nextHour}:${m}`;
    }

    res.json({
      date,
      availableSlots: slots
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const asignarEspecialidad = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { specialtyId } = req.body;

        // Verificar doctor
        const [doctor] = await pool.query(
            'SELECT id FROM doctors WHERE id = ?',
            [doctorId]
        );

        if (doctor.length === 0) {
            return res.status(404).json({ message: 'Doctor no encontrado' });
        }

        // Verificar especialidad
        const [specialty] = await pool.query(
            'SELECT id FROM specialties WHERE id = ?',
            [specialtyId]
        );

        if (specialty.length === 0) {
            return res.status(404).json({ message: 'Especialidad no encontrada' });
        }

        // Verificar que no esté duplicada
        const [existing] = await pool.query(
            `SELECT * FROM doctor_specialties
             WHERE doctor_id = ? AND specialty_id = ?`,
            [doctorId, specialtyId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'El doctor ya tiene esta especialidad'
            });
        }

        // Insertar
        await pool.query(
            `INSERT INTO doctor_specialties (doctor_id, specialty_id)
            VALUES (?, ?)`,
            [doctorId, specialtyId]
        );

        res.status(201).json({
            message: 'Especialidad asignada correctamente'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const crearHorario = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { dayOfWeek, startTime, endTime } = req.body;

        // Validar doctor
        const [doctor] = await pool.query(
            'SELECT id FROM doctors WHERE id = ?',
            [doctorId]
        );

        if (doctor.length === 0) {
            return res.status(404).json({ message: 'Doctor no encontrado' });
        }

        // Validar horario lógico
        if (startTime >= endTime) {
            return res.status(400).json({
                message: 'Hora de inicio debe ser menor que hora fin'
            });
        }

        // Verificar que no exista horario ese día
        const [existing] = await pool.query(
            `SELECT id FROM doctor_schedules
            WHERE doctor_id = ? AND day_of_week = ?`,
            [doctorId, dayOfWeek]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Ya existe horario para ese día'
            });
        }

        // Insertar
        await pool.query(
            `INSERT INTO doctor_schedules
            (doctor_id, day_of_week, start_time, end_time)
            VALUES (?, ?, ?, ?)`,
            [doctorId, dayOfWeek, startTime, endTime]
        );

        res.status(201).json({
            message: 'Horario creado correctamente'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const user = req.user;

    // Seguridad
    if (user.role === 'DOCTOR') {
      const [doctor] = await pool.query(
        'SELECT id FROM doctors WHERE user_id = ?',
        [user.id]
      );

      if (doctor.length === 0 || doctor[0].id != doctorId) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
    }

    const [appointments] = await pool.query(`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        u.name AS patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date, a.appointment_time
    `, [doctorId]);

    res.json(appointments);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

