USE pedia_care;

START TRANSACTION;

-- =====================================================================
-- Borra SOLO los datos de prueba: usuarios con id 5 al 34 y los
-- pacientes asociados a los tutores 25 al 34.
-- Los 4 usuarios que ya existian (id 1 al 4) NO se tocan.
-- No modifica la estructura de las tablas.
-- =====================================================================

-- 1) Pacientes primero: la FK paciente -> padre_madre es ON DELETE RESTRICT,
--    asi que hay que borrarlos antes que a los tutores.
--    Por ON DELETE CASCADE tambien se eliminan sus historiales, consultas,
--    medicaciones, recordatorios, turnos y vacunas.
DELETE FROM paciente
WHERE id_tutor_1 BETWEEN 25 AND 34;

-- 2) Usuarios de prueba: por ON DELETE CASCADE se eliminan tambien las filas
--    de medico, enfermero, padre_madre y sus notificaciones.
--    El filtro por email es una segunda barrera de seguridad.
DELETE FROM usuario
WHERE id_usuario BETWEEN 5 AND 34
  AND (email LIKE '%@pediacare.test' OR email LIKE '%@correo.test');

COMMIT;

-- Verificacion
SELECT COUNT(*) AS usuarios_de_prueba_restantes
FROM usuario WHERE id_usuario BETWEEN 5 AND 34;          -- debe dar 0
SELECT COUNT(*) AS pacientes_de_prueba_restantes
FROM paciente WHERE id_tutor_1 BETWEEN 25 AND 34;        -- debe dar 0
SELECT id_usuario, nombre, rol FROM usuario;             -- deben quedar solo los ids 1 al 4

-- =====================================================================
-- OPCIONAL: reiniciar el AUTO_INCREMENT de usuario para que el proximo
-- usuario nuevo vuelva a ser el id 5 (MySQL lo ajusta a max(id)+1).
-- (Descomenta la linea si lo necesitas.)
-- =====================================================================
-- ALTER TABLE usuario AUTO_INCREMENT = 1;
