DROP DATABASE IF EXISTS pedia_care;
CREATE DATABASE pedia_care;
USE pedia_care;

-- TABLA 1: pacientes
CREATE TABLE pacientes (
    id_paciente INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    edad_meses INT,
    sexo ENUM('Masculino','Femenino') NOT NULL,
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    direccion VARCHAR(150),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 2: profesionales
CREATE TABLE profesionales (
    id_profesional INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    matricula VARCHAR(30) UNIQUE NOT NULL,
    especialidad VARCHAR(50) NOT NULL,
    cargo ENUM('Pediatra','Enfermero/a') NOT NULL,
    correo VARCHAR(100) UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- TABLA 3: familiares
CREATE TABLE familiares (
    id_familiar INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100),
    relacion ENUM('Madre','Padre','Tutor/a','Otro') NOT NULL,
    id_paciente INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
);

-- TABLA 4: historial clinico
CREATE TABLE historial_clinico (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_profesional INT NOT NULL,
    fecha_consulta DATETIME NOT NULL,
    motivo_consulta TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_profesional) REFERENCES profesionales(id_profesional) ON DELETE RESTRICT
);

-- TABLA 5: vacunas
CREATE TABLE vacunas (
    id_vacuna INT PRIMARY KEY AUTO_INCREMENT,
    nombre_vacuna VARCHAR(100) NOT NULL,
    dosis VARCHAR(20) NOT NULL,
    fecha_aplicacion DATE,
    proxima_dosis DATE,
    estado ENUM('Pendiente','Aplicada','Atrasada') DEFAULT 'Pendiente',
    id_paciente INT NOT NULL,
    id_profesional INT,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_profesional) REFERENCES profesionales(id_profesional) ON DELETE SET NULL
);

-- TABLA 6: turnos
CREATE TABLE turnos (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_profesional INT NOT NULL,
    fecha_turno DATETIME NOT NULL,
    especialidad VARCHAR(50) DEFAULT 'Pediatría',
    estado ENUM('Programado','Confirmado','Asistió','Ausente','Cancelado') DEFAULT 'Programado',
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    fecha_recordatorio DATETIME,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_profesional) REFERENCES profesionales(id_profesional) ON DELETE RESTRICT
);

-- TABLA 7: mensajes_recordatorios
CREATE TABLE mensajes_recordatorios (
    id_mensaje INT PRIMARY KEY AUTO_INCREMENT,
    id_turno INT NOT NULL,
    id_familiar INT NOT NULL,
    tipo ENUM('SMS','WhatsApp','Correo') NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_envio ENUM('Pendiente','Enviado','Fallido') DEFAULT 'Pendiente',
    FOREIGN KEY (id_turno) REFERENCES turnos(id_turno) ON DELETE CASCADE,
    FOREIGN KEY (id_familiar) REFERENCES familiares(id_familiar) ON DELETE CASCADE
);

SHOW TABLES;