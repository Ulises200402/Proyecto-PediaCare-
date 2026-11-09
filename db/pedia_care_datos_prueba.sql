USE pedia_care;

START TRANSACTION;

-- =====================================================================
-- 1) USUARIOS
--    IDs fijos (5 al 34) para no pisar a los 4 usuarios que ya existen (1 al 4):
--      5-14  -> MEDICO
--      15-24 -> ENFERMERO
--      25-34 -> PADRE_MADRE (tutores)
--    contrasena_hash: mismo hash bcrypt para los 30 usuarios (solo para pruebas).
--    DNI: valores ficticios asignados debajo, nunca usar documentos reales.
-- =====================================================================
INSERT INTO usuario (id_usuario, nombre, email, contrasena_hash, rol) VALUES
-- Médicos
(5,  'Dr. Martín Giménez',      'martin.gimenez@pediacare.test',      '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(6,  'Dra. Laura Fernández',    'laura.fernandez@pediacare.test',     '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(7,  'Dr. Sebastián Ortiz',     'sebastian.ortiz@pediacare.test',     '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(8,  'Dra. Carolina Páez',      'carolina.paez@pediacare.test',       '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(9,  'Dr. Gustavo Molina',      'gustavo.molina@pediacare.test',      '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(10,  'Dra. Valeria Sosa',       'valeria.sosa@pediacare.test',        '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(11,  'Dr. Alejandro Ruiz',      'alejandro.ruiz@pediacare.test',      '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(12,  'Dra. Natalia Benítez',    'natalia.benitez@pediacare.test',     '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(13,  'Dr. Federico Aguirre',    'federico.aguirre@pediacare.test',    '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
(14, 'Dra. Mariana Castro',     'mariana.castro@pediacare.test',      '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'MEDICO'),
-- Enfermeros/as
(15, 'Lic. Sofía Herrera',      'sofia.herrera@pediacare.test',       '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(16, 'Lic. Camila Vega',        'camila.vega@pediacare.test',         '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(17, 'Lic. Daniela Romero',     'daniela.romero@pediacare.test',      '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(18, 'Lic. Florencia Acosta',   'florencia.acosta@pediacare.test',    '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(19, 'Lic. Agustina Medina',    'agustina.medina@pediacare.test',     '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(20, 'Lic. Romina Silva',       'romina.silva@pediacare.test',        '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(21, 'Lic. Julieta Ponce',      'julieta.ponce@pediacare.test',       '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(22, 'Lic. Micaela Rojas',      'micaela.rojas@pediacare.test',       '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(23, 'Lic. Brenda Navarro',     'brenda.navarro@pediacare.test',      '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
(24, 'Lic. Lucía Domínguez',    'lucia.dominguez@pediacare.test',     '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'ENFERMERO'),
-- Tutores (padre/madre)
(25, 'Carlos Pereyra',          'carlos.pereyra@correo.test',         '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(26, 'Andrea López',            'andrea.lopez@correo.test',           '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(27, 'Diego Cabrera',           'diego.cabrera@correo.test',          '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(28, 'Gabriela Morales',        'gabriela.morales@correo.test',       '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(29, 'Pablo Quiroga',           'pablo.quiroga@correo.test',          '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(30, 'Verónica Suárez',         'veronica.suarez@correo.test',        '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(31, 'Hernán Díaz',             'hernan.diaz@correo.test',            '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(32, 'Silvana Ramírez',         'silvana.ramirez@correo.test',        '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(33, 'Leandro Flores',          'leandro.flores@correo.test',         '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE'),
(34, 'Paula Gutiérrez',         'paula.gutierrez@correo.test',        '$2b$12$5OwdEPzAfiue07SM24U7.OOvw7JkcF2nKx8LmYiul8sSV9ELBd3Xe', 'PADRE_MADRE');

UPDATE usuario
SET dni = LPAD(90000000 + id_usuario, 8, '0')
WHERE id_usuario BETWEEN 5 AND 34;

-- =====================================================================
-- 2) MEDICO (id_usuario 5-14)
-- =====================================================================
INSERT INTO medico (id_usuario, matricula, especialidad, activo) VALUES
(5,  'MP-10021', 'Pediatría general',        TRUE),
(6,  'MP-10034', 'Neonatología',             TRUE),
(7,  'MP-10047', 'Pediatría general',        TRUE),
(8,  'MP-10058', 'Alergia e inmunología',    TRUE),
(9,  'MP-10063', 'Cardiología infantil',    TRUE),
(10,  'MP-10079', 'Neumonología infantil',    TRUE),
(11,  'MP-10082', 'Gastroenterología infantil', TRUE),
(12,  'MP-10096', 'Endocrinología infantil',  TRUE),
(13,  'MP-10105', 'Infectología pediátrica',  TRUE),
(14, 'MP-10118', 'Dermatología pediátrica',  TRUE);

-- =====================================================================
-- 3) ENFERMERO (id_usuario 15-24)
-- =====================================================================
INSERT INTO enfermero (id_usuario, matricula, activo) VALUES
(15, 'ME-20011', TRUE),
(16, 'ME-20024', TRUE),
(17, 'ME-20037', TRUE),
(18, 'ME-20042', TRUE),
(19, 'ME-20055', TRUE),
(20, 'ME-20068', TRUE),
(21, 'ME-20073', TRUE),
(22, 'ME-20086', TRUE),
(23, 'ME-20099', TRUE),
(24, 'ME-20107', TRUE);

-- =====================================================================
-- 4) PADRE_MADRE (id_usuario 25-34)
-- =====================================================================
INSERT INTO padre_madre (id_usuario, telefono, recibe_notificaciones_app, recibe_notificaciones_email, recibe_notificaciones_sms) VALUES
(25, '+54 261 555-0101', TRUE,  TRUE,  FALSE),
(26, '+54 261 555-0102', TRUE,  TRUE,  TRUE),
(27, '+54 261 555-0103', TRUE,  FALSE, FALSE),
(28, '+54 261 555-0104', TRUE,  TRUE,  FALSE),
(29, '+54 261 555-0105', FALSE, TRUE,  TRUE),
(30, '+54 261 555-0106', TRUE,  TRUE,  FALSE),
(31, '+54 261 555-0107', TRUE,  TRUE,  FALSE),
(32, '+54 261 555-0108', TRUE,  FALSE, TRUE),
(33, '+54 261 555-0109', TRUE,  TRUE,  FALSE),
(34, '+54 261 555-0110', TRUE,  TRUE,  FALSE);

-- =====================================================================
-- 5) PACIENTE (10 pacientes, cada uno con un tutor principal distinto)
--    id_tutor_2 es opcional: algunos pacientes tienen segundo tutor
--    (siempre distinto de id_tutor_1, por el CHECK de la tabla).
-- =====================================================================
INSERT INTO paciente (nombre, fecha_nacimiento, sexo, alergias, enfermedades_cronicas, id_tutor_1, id_tutor_2) VALUES
('Mateo Pereyra',      '2021-03-14', 'Masculino',       'Penicilina',            NULL, 25, 26),
('Valentina López',    '2019-07-22', 'Femenino',        NULL,                    'Asma leve', 26, 25),
('Santino Cabrera',    '2023-01-09', 'Masculino',       'Proteína de leche de vaca', NULL, 27, NULL),
('Emma Morales',       '2020-11-30', 'Femenino',        NULL,                    NULL, 28, 29),
('Thiago Quiroga',     '2018-05-18', 'Masculino',       'Polen, ácaros',         'Rinitis alérgica', 29, 28),
('Martina Suárez',     '2022-09-05', 'Femenino',        NULL,                    NULL, 30, NULL),
('Benicio Díaz',       '2017-02-27', 'Masculino',       NULL,                    'Diabetes tipo 1', 31, 32),
('Catalina Ramírez',   '2024-04-12', 'Femenino',        'Huevo',                 NULL, 32, 31),
('Joaquín Flores',     '2016-12-03', 'Masculino',       NULL,                    NULL, 33, 34),
('Isabella Gutiérrez', '2021-08-19', 'No especificado', 'Amoxicilina',           'Dermatitis atópica', 34, 33);

UPDATE paciente
SET dni = CONCAT('92', LPAD(id_paciente, 6, '0'))
WHERE id_tutor_1 BETWEEN 25 AND 34;

-- =====================================================================
-- 6) HISTORIAS CLÍNICAS Y DATOS PARA PROBAR LOS FLUJOS DE LA APP
-- =====================================================================
INSERT INTO historial_clinico (id_paciente)
SELECT p.id_paciente
FROM paciente AS p
WHERE p.id_tutor_1 BETWEEN 25 AND 34
  AND NOT EXISTS (
    SELECT 1 FROM historial_clinico AS h WHERE h.id_paciente = p.id_paciente
  );

INSERT INTO consulta
    (id_historial, id_medico, fecha_consulta, motivo, diagnostico, tratamiento, observaciones,
     indicaciones_para_padres)
SELECT h.id_historial, 5, DATE_SUB(NOW(), INTERVAL 3 DAY),
       'Control pediátrico', 'Evolución general favorable', 'Continuar controles habituales',
       'Sin incidencias relevantes.', 'La evolución es favorable. Mantener los controles programados.'
FROM historial_clinico AS h
INNER JOIN paciente AS p ON p.id_paciente = h.id_paciente
WHERE p.nombre = 'Mateo Pereyra';

INSERT INTO consulta
    (id_historial, id_medico, fecha_consulta, motivo, diagnostico, tratamiento, observaciones,
     indicaciones_para_padres)
SELECT h.id_historial, 6, DATE_SUB(NOW(), INTERVAL 1 DAY),
       'Seguimiento respiratorio', 'Asma leve en seguimiento', 'Según indicación profesional',
       'Control de seguimiento.', 'Seguir las indicaciones del equipo médico y asistir al próximo control.'
FROM historial_clinico AS h
INNER JOIN paciente AS p ON p.id_paciente = h.id_paciente
WHERE p.nombre = 'Valentina López';

INSERT INTO medicacion
    (id_paciente, id_enfermero, nombre, dosis, via_administracion, frecuencia, horarios,
     indicaciones, fecha_inicio, fecha_fin)
SELECT p.id_paciente, 15, 'Medicamento de prueba', 'Dosis según indicación',
       'Oral', 'Cada 12 horas', JSON_ARRAY('09:00', '21:00'),
       'Registro ficticio para probar la interfaz.', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY)
FROM paciente AS p
WHERE p.nombre = 'Mateo Pereyra';

INSERT INTO medicacion
    (id_paciente, id_enfermero, nombre, dosis, via_administracion, frecuencia, horarios,
     indicaciones, fecha_inicio, fecha_fin)
SELECT p.id_paciente, 16, 'Tratamiento de demostración', 'Dosis de ejemplo',
       'Oral', 'Diaria (cada 24 horas)', JSON_ARRAY('12:00'),
       'Dato ficticio de demostración.', CURDATE(), NULL
FROM paciente AS p
WHERE p.nombre = 'Valentina López';

INSERT INTO vacuna
    (id_paciente, id_medico, nombre, dosis, fecha_aplicacion, proxima_dosis, estado, observaciones)
SELECT p.id_paciente, 5, 'Vacuna de ejemplo A', '1.ª dosis',
       DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 150 DAY),
       'Aplicada', 'Dato ficticio para validar el historial de vacunación.'
FROM paciente AS p
WHERE p.nombre = 'Mateo Pereyra';

INSERT INTO vacuna
    (id_paciente, id_enfermero, nombre, dosis, fecha_aplicacion, proxima_dosis, estado, observaciones)
SELECT p.id_paciente, 15, 'Vacuna de ejemplo B', 'Refuerzo',
       NULL, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Pendiente',
       'Dato ficticio para probar avisos de próximas dosis.'
FROM paciente AS p
WHERE p.nombre = 'Valentina López';

INSERT INTO turno (id_paciente, id_medico, fecha_hora, motivo, estado)
SELECT p.id_paciente, 5, DATE_ADD(NOW(), INTERVAL 2 DAY),
       'Control pediátrico de prueba', 'Programado'
FROM paciente AS p
WHERE p.nombre = 'Mateo Pereyra';

INSERT INTO turno (id_paciente, id_medico, fecha_hora, motivo, estado)
SELECT p.id_paciente, 6, DATE_ADD(NOW(), INTERVAL 4 DAY),
       'Seguimiento de prueba', 'Confirmado'
FROM paciente AS p
WHERE p.nombre = 'Valentina López';

INSERT INTO notificacion (id_usuario, id_paciente, canal, tipo, contenido, estado)
SELECT 25, p.id_paciente, 'APP', 'general',
       'Notificación ficticia: los datos de prueba están cargados correctamente.',
       'Enviada'
FROM paciente AS p
WHERE p.nombre = 'Mateo Pereyra';

COMMIT;

-- Verificación rápida
SELECT rol, COUNT(*) AS cantidad FROM usuario GROUP BY rol;
SELECT p.id_paciente, p.nombre AS paciente, t1.nombre AS tutor_1, t2.nombre AS tutor_2
FROM paciente p
JOIN usuario t1 ON t1.id_usuario = p.id_tutor_1
LEFT JOIN usuario t2 ON t2.id_usuario = p.id_tutor_2;
