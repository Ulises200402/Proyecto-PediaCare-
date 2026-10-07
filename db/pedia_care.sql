CREATE DATABASE IF NOT EXISTS pedia_care
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE pedia_care;

CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol ENUM('MEDICO', 'ENFERMERO', 'PADRE_MADRE') NOT NULL,
    fecha_alta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE medico (
    id_usuario INT PRIMARY KEY,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    especialidad VARCHAR(80) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_medico_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE enfermero (
    id_usuario INT PRIMARY KEY,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_enfermero_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE padre_madre (
    id_usuario INT PRIMARY KEY,
    telefono VARCHAR(25),
    recibe_notificaciones_app BOOLEAN NOT NULL DEFAULT TRUE,
    recibe_notificaciones_email BOOLEAN NOT NULL DEFAULT TRUE,
    recibe_notificaciones_sms BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_padre_madre_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE paciente (
    id_paciente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo ENUM('Femenino', 'Masculino', 'Otro', 'No especificado') NOT NULL,
    alergias TEXT,
    enfermedades_cronicas TEXT,
    id_tutor_1 INT NOT NULL,
    id_tutor_2 INT,
    fecha_alta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_paciente_tutores_distintos CHECK
        (id_tutor_2 IS NULL OR id_tutor_1 <> id_tutor_2),
    CONSTRAINT fk_paciente_tutor_1 FOREIGN KEY (id_tutor_1)
        REFERENCES padre_madre(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_paciente_tutor_2 FOREIGN KEY (id_tutor_2)
        REFERENCES padre_madre(id_usuario) ON DELETE RESTRICT,
    INDEX idx_paciente_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE historial_clinico (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente(id_paciente) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE consulta (
    id_consulta INT PRIMARY KEY AUTO_INCREMENT,
    id_historial INT NOT NULL,
    id_medico INT NOT NULL,
    fecha_consulta DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    CONSTRAINT fk_consulta_historial FOREIGN KEY (id_historial)
        REFERENCES historial_clinico(id_historial) ON DELETE CASCADE,
    CONSTRAINT fk_consulta_medico FOREIGN KEY (id_medico)
        REFERENCES medico(id_usuario) ON DELETE RESTRICT,
    INDEX idx_consulta_historial_fecha (id_historial, fecha_consulta)
) ENGINE=InnoDB;

CREATE TABLE medicacion (
    id_medicacion INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_enfermero INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    dosis VARCHAR(100) NOT NULL,
    indicaciones TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_carga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_medicacion_fechas CHECK
        (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT fk_medicacion_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    CONSTRAINT fk_medicacion_enfermero FOREIGN KEY (id_enfermero)
        REFERENCES enfermero(id_usuario) ON DELETE RESTRICT,
    INDEX idx_medicacion_paciente_activa (id_paciente, activa)
) ENGINE=InnoDB;

CREATE TABLE recordatorio (
    id_recordatorio INT PRIMARY KEY AUTO_INCREMENT,
    id_medicacion INT NOT NULL,
    fecha_hora_programada DATETIME NOT NULL,
    estado ENUM('Pendiente', 'Administrada', 'Omitida') NOT NULL DEFAULT 'Pendiente',
    fecha_hora_administrada DATETIME,
    observaciones VARCHAR(500),
    CONSTRAINT chk_recordatorio_administracion CHECK
        (estado <> 'Administrada' OR fecha_hora_administrada IS NOT NULL),
    CONSTRAINT fk_recordatorio_medicacion FOREIGN KEY (id_medicacion)
        REFERENCES medicacion(id_medicacion) ON DELETE CASCADE,
    INDEX idx_recordatorio_programado_estado (fecha_hora_programada, estado)
) ENGINE=InnoDB;

CREATE TABLE notificacion (
    id_notificacion INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_paciente INT,
    canal ENUM('APP', 'EMAIL', 'SMS') NOT NULL,
    contenido TEXT NOT NULL,
    estado ENUM('Pendiente', 'Enviada', 'Fallida') NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio DATETIME,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente(id_paciente) ON DELETE SET NULL,
    INDEX idx_notificacion_usuario_fecha (id_usuario, fecha_creacion)
) ENGINE=InnoDB;

CREATE TABLE turno (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    motivo VARCHAR(255),
    estado ENUM('Programado', 'Confirmado', 'Atendido', 'Ausente', 'Cancelado')
        NOT NULL DEFAULT 'Programado',
    fecha_alta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_turno_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    CONSTRAINT fk_turno_medico FOREIGN KEY (id_medico)
        REFERENCES medico(id_usuario) ON DELETE RESTRICT,
    INDEX idx_turno_paciente_fecha (id_paciente, fecha_hora),
    INDEX idx_turno_medico_fecha (id_medico, fecha_hora)
) ENGINE=InnoDB;

CREATE TABLE vacuna (
    id_vacuna INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_medico INT,
    id_enfermero INT,
    nombre VARCHAR(100) NOT NULL,
    dosis VARCHAR(50) NOT NULL,
    fecha_aplicacion DATE,
    proxima_dosis DATE,
    estado ENUM('Pendiente', 'Aplicada', 'Atrasada') NOT NULL DEFAULT 'Pendiente',
    observaciones VARCHAR(500),
    CONSTRAINT chk_vacuna_un_profesional CHECK
        (id_medico IS NULL OR id_enfermero IS NULL),
    CONSTRAINT chk_vacuna_aplicada CHECK
        (estado <> 'Aplicada' OR (fecha_aplicacion IS NOT NULL
            AND (id_medico IS NOT NULL OR id_enfermero IS NOT NULL))),
    CONSTRAINT fk_vacuna_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    CONSTRAINT fk_vacuna_medico FOREIGN KEY (id_medico)
        REFERENCES medico(id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_vacuna_enfermero FOREIGN KEY (id_enfermero)
        REFERENCES enfermero(id_usuario) ON DELETE SET NULL,
    INDEX idx_vacuna_paciente_fecha (id_paciente, proxima_dosis)
) ENGINE=InnoDB;

SHOW TABLES;