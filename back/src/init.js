import { pool } from "./db/mysql.js";

const createTables = async () => {
  try {
    console.log("Iniciando creación de tablas...");

    // Tabla users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) DEFAULT NULL,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('PATIENT','DOCTOR','ADMIN') NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
      )
    `);
    console.log('Tabla "users" verificada/creada.');

    // Tabla patients
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        document_number VARCHAR(50) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        birth_date DATE DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY user_id (user_id),
        CONSTRAINT patients_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    console.log('Tabla "patients" verificada/creada.');

    // Tabla specialties
    await pool.query(`
      CREATE TABLE IF NOT EXISTS specialties (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY unique_specialty_name (name)
      )
    `);
    console.log('Tabla "specialties" verificada/creada.');

    // Tabla doctors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        license_number VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY user_id (user_id),
        CONSTRAINT doctors_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    console.log('Tabla "doctors" verificada/creada.');

    // Tabla doctor_specialties
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_specialties (
        doctor_id INT NOT NULL,
        specialty_id INT NOT NULL,
        PRIMARY KEY (doctor_id, specialty_id),
        KEY specialty_id (specialty_id),
        CONSTRAINT doctor_specialties_ibfk_1 FOREIGN KEY (doctor_id) REFERENCES doctors (id),
        CONSTRAINT doctor_specialties_ibfk_2 FOREIGN KEY (specialty_id) REFERENCES specialties (id)
      )
    `);
    console.log('Tabla "doctor_specialties" verificada/creada.');

    // Tabla doctor_schedules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id INT NOT NULL AUTO_INCREMENT,
        doctor_id INT DEFAULT NULL,
        day_of_week ENUM('MON','TUE','WED','THU','FRI','SAT') DEFAULT NULL,
        start_time TIME DEFAULT NULL,
        end_time TIME DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY unique_schedule (doctor_id, day_of_week),
        CONSTRAINT doctor_schedules_ibfk_1 FOREIGN KEY (doctor_id) REFERENCES doctors (id)
      )
    `);
    console.log('Tabla "doctor_schedules" verificada/creada.');

    // Tabla appointments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT NOT NULL AUTO_INCREMENT,
        patient_id INT DEFAULT NULL,
        doctor_id INT DEFAULT NULL,
        appointment_date DATE DEFAULT NULL,
        appointment_time TIME DEFAULT NULL,
        status ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED') DEFAULT 'PENDING',
        reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_doctor_slot (doctor_id, appointment_date, appointment_time),
        KEY patient_id (patient_id),
        CONSTRAINT appointments_ibfk_1 FOREIGN KEY (patient_id) REFERENCES patients (id),
        CONSTRAINT appointments_ibfk_2 FOREIGN KEY (doctor_id) REFERENCES doctors (id)
      )
    `);
    console.log('Tabla "appointments" verificada/creada.');

    console.log("Inicialización de base de datos completada exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear las tablas:", error);
    process.exit(1);
  }
};

createTables();