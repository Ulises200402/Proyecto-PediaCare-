import { pool } from '../config/database.js'

const medicationSelect = `
  SELECT
    m.id_medicacion AS id,
    m.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    p.dni,
    m.id_enfermero AS idEnfermero,
    u.nombre AS enfermeroNombre,
    m.nombre AS medicamento,
    m.dosis,
    m.via_administracion AS via,
    m.frecuencia,
    m.horarios,
    m.indicaciones,
    m.fecha_inicio AS fechaInicio,
    m.fecha_fin AS fechaFin,
    m.activa
  FROM medicacion AS m
  INNER JOIN paciente AS p ON p.id_paciente = m.id_paciente
  INNER JOIN usuario AS u ON u.id_usuario = m.id_enfermero`

const reminderSelect = `
  SELECT
    r.id_recordatorio AS id,
    m.id_medicacion AS idMedicacion,
    p.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    p.dni,
    m.nombre AS medicamento,
    m.dosis,
    m.via_administracion AS via,
    TIME_FORMAT(r.fecha_hora_programada, '%H:%i') AS horario,
    r.fecha_hora_programada AS fechaHoraProgramada,
    r.estado,
    r.fecha_hora_administrada AS fechaHoraAdministrada,
    COALESCE(eu.nombre, 'Sin asignar') AS enfermero,
    r.id_enfermero_asignado AS idEnfermeroAsignado,
    COALESCE(au.nombre, 'Sin asignar') AS enfermeroAsignado,
    r.observaciones
  FROM recordatorio AS r
  INNER JOIN medicacion AS m ON m.id_medicacion = r.id_medicacion
  INNER JOIN paciente AS p ON p.id_paciente = m.id_paciente
  LEFT JOIN usuario AS eu ON eu.id_usuario = r.id_enfermero
  LEFT JOIN usuario AS au ON au.id_usuario = r.id_enfermero_asignado`

const vaccineSelect = `
  SELECT
    v.id_vacuna AS id,
    v.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    p.dni AS pacienteDni,
    v.id_medico AS idMedico,
    v.id_enfermero AS idEnfermero,
    COALESCE(mu.nombre, eu.nombre) AS profesional,
    v.nombre,
    v.dosis,
    v.fecha_aplicacion AS fechaAplicacion,
    v.proxima_dosis AS proximaDosis,
    v.estado,
    v.observaciones
  FROM vacuna AS v
  INNER JOIN paciente AS p ON p.id_paciente = v.id_paciente
  LEFT JOIN usuario AS mu ON mu.id_usuario = v.id_medico
  LEFT JOIN usuario AS eu ON eu.id_usuario = v.id_enfermero`

function patientScope(user, patientAlias = 'p') {
  if (user.role !== 'PADRE_MADRE') return { sql: '', values: [] }
  return {
    sql: `AND (${patientAlias}.id_tutor_1 = ? OR ${patientAlias}.id_tutor_2 = ?)`,
    values: [user.id, user.id],
  }
}

async function ensureReminderWindow() {
  const connection = await pool.getConnection()
  let hasGenerationLock = false
  let transactionStarted = false
  try {
    const [lockRows] = await connection.execute(
      'SELECT GET_LOCK(?, 10) AS acquired',
      ['pedia_care_reminder_window'],
    )
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw new Error('No se pudo bloquear la generación de recordatorios.')
    }
    hasGenerationLock = true
    await connection.beginTransaction()
    transactionStarted = true
    const [nurses] = await connection.execute(
      `SELECT id_usuario AS id
       FROM enfermero
       WHERE activo = TRUE
       ORDER BY id_usuario`,
    )
    const [medications] = await connection.execute(
      `SELECT id_medicacion, horarios
       FROM medicacion
       WHERE activa = TRUE AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
         AND fecha_inicio <= DATE_ADD(CURDATE(), INTERVAL 29 DAY)
       ORDER BY id_medicacion
       FOR UPDATE`,
    )

    for (const medication of medications) {
      const times = Array.isArray(medication.horarios)
        ? medication.horarios
        : JSON.parse(medication.horarios || '[]')
      for (const time of times) {
        await connection.execute(
          `INSERT IGNORE INTO recordatorio (id_medicacion, fecha_hora_programada)
           SELECT ?, CONCAT(DATE_ADD(CURDATE(), INTERVAL day_offset DAY), ' ', ?)
           FROM (
             SELECT 0 AS day_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
             SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
             SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL
             SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL
             SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL
             SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL
             SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL
             SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
           ) AS days
           INNER JOIN medicacion AS current_med ON current_med.id_medicacion = ?
           WHERE current_med.fecha_inicio <= DATE_ADD(CURDATE(), INTERVAL day_offset DAY)
             AND (current_med.fecha_fin IS NULL OR current_med.fecha_fin >=
               DATE_ADD(CURDATE(), INTERVAL day_offset DAY))`,
          [medication.id_medicacion, time, medication.id_medicacion],
        )
      }
    }

    await connection.execute(
      `UPDATE recordatorio AS r
       LEFT JOIN enfermero AS assigned
         ON assigned.id_usuario = r.id_enfermero_asignado AND assigned.activo = TRUE
       SET r.id_enfermero_asignado = NULL
       WHERE r.estado = 'Pendiente'
         AND r.id_enfermero_asignado IS NOT NULL
         AND assigned.id_usuario IS NULL
         AND r.fecha_hora_programada >= NOW()
         AND r.fecha_hora_programada < DATE_ADD(NOW(), INTERVAL 30 DAY)`,
    )

    if (nurses.length) {
      const [loadRows] = await connection.execute(
        `SELECT r.id_enfermero_asignado AS id, COUNT(*) AS workload
         FROM recordatorio AS r
         INNER JOIN enfermero AS e
           ON e.id_usuario = r.id_enfermero_asignado AND e.activo = TRUE
         WHERE r.id_enfermero_asignado IS NOT NULL
           AND r.estado = 'Pendiente'
           AND r.fecha_hora_programada >= NOW()
           AND r.fecha_hora_programada < DATE_ADD(NOW(), INTERVAL 30 DAY)
         GROUP BY r.id_enfermero_asignado`,
      )
      const workload = new Map(
        loadRows.map((row) => [Number(row.id), Number(row.workload)]),
      )
      const [unassigned] = await connection.execute(
        `SELECT r.id_recordatorio AS id
         FROM recordatorio AS r
         INNER JOIN medicacion AS m ON m.id_medicacion = r.id_medicacion
         WHERE r.id_enfermero_asignado IS NULL
           AND r.estado = 'Pendiente'
           AND r.fecha_hora_programada >= NOW()
           AND r.fecha_hora_programada < DATE_ADD(NOW(), INTERVAL 30 DAY)
           AND m.activa = TRUE
         ORDER BY r.fecha_hora_programada, r.id_recordatorio`,
      )

      for (const reminder of unassigned) {
        const nurse = nurses.reduce((leastBusy, current) => (
          (workload.get(Number(current.id)) || 0) <
            (workload.get(Number(leastBusy.id)) || 0)
            ? current
            : leastBusy
        ))
        await connection.execute(
          `UPDATE recordatorio
           SET id_enfermero_asignado = ?
           WHERE id_recordatorio = ? AND id_enfermero_asignado IS NULL`,
          [nurse.id, reminder.id],
        )
        workload.set(Number(nurse.id), (workload.get(Number(nurse.id)) || 0) + 1)
      }
    }

    await connection.commit()
    transactionStarted = false
  } catch (error) {
    if (transactionStarted) await connection.rollback()
    throw error
  } finally {
    try {
      if (hasGenerationLock) {
        await connection.execute(
          'SELECT RELEASE_LOCK(?)',
          ['pedia_care_reminder_window'],
        )
      }
    } finally {
      connection.release()
    }
  }
}

export async function listMedicationsForUser(user) {
  const scope = user.role === 'PADRE_MADRE'
    ? 'WHERE (p.id_tutor_1 = ? OR p.id_tutor_2 = ?)'
    : ''
  const values = user.role === 'PADRE_MADRE' ? [user.id, user.id] : []
  const [rows] = await pool.execute(`${medicationSelect} ${scope} ORDER BY m.fecha_carga DESC`, values)
  return rows.map((row) => ({
    ...row,
    horarios: Array.isArray(row.horarios) ? row.horarios : JSON.parse(row.horarios || '[]'),
    estado: row.activa ? 'Activa' : 'Finalizada',
  }))
}

export async function createMedication(medication) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `INSERT INTO medicacion
        (id_paciente, id_enfermero, nombre, dosis, via_administracion, frecuencia,
         horarios, indicaciones, fecha_inicio, fecha_fin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medication.idPaciente,
        medication.idEnfermero,
        medication.medicamento,
        medication.dosis,
        medication.via,
        medication.frecuencia,
        JSON.stringify(medication.horarios),
        medication.indicaciones || null,
        medication.fechaInicio,
        medication.fechaFin || null,
      ],
    )
    await notifyPatientTutors(connection, medication.idPaciente, {
      tipo: 'medicacion',
      mensaje: `Se registró el plan de medicación ${medication.medicamento} (${medication.dosis}).`,
    })
    await connection.commit()
    return result.insertId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function findMedicationById(medicationId) {
  const [rows] = await pool.execute(`${medicationSelect} WHERE m.id_medicacion = ?`, [medicationId])
  const row = rows[0]
  return row
    ? {
        ...row,
        horarios: Array.isArray(row.horarios) ? row.horarios : JSON.parse(row.horarios || '[]'),
        estado: row.activa ? 'Activa' : 'Finalizada',
      }
    : null
}

export async function updateMedication(medicationId, nurseId, medication) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [existingRows] = await connection.execute(
      `SELECT id_paciente, nombre, dosis FROM medicacion
       WHERE id_medicacion = ? AND id_enfermero = ? FOR UPDATE`,
      [medicationId, nurseId],
    )
    if (!existingRows[0]) {
      await connection.rollback()
      return null
    }
    await connection.execute(
      `UPDATE medicacion SET
         nombre = ?, dosis = ?, via_administracion = ?, frecuencia = ?,
         horarios = ?, indicaciones = ?, fecha_inicio = ?, fecha_fin = ?, activa = ?
       WHERE id_medicacion = ? AND id_enfermero = ?`,
      [
        medication.medicamento,
        medication.dosis,
        medication.via,
        medication.frecuencia,
        JSON.stringify(medication.horarios),
        medication.indicaciones || null,
        medication.fechaInicio,
        medication.fechaFin || null,
        medication.activa,
        medicationId,
        nurseId,
      ],
    )
    if (!medication.activa) {
      await connection.execute(
        `UPDATE recordatorio
         SET estado = 'Omitida', observaciones = 'Plan de medicación finalizado.'
         WHERE id_medicacion = ? AND estado = 'Pendiente'
           AND fecha_hora_programada >= NOW()`,
        [medicationId],
      )
    } else {
      await connection.execute(
        `DELETE FROM recordatorio
         WHERE id_medicacion = ? AND estado = 'Pendiente'
           AND fecha_hora_programada >= NOW()`,
        [medicationId],
      )
    }
    await notifyPatientTutors(connection, existingRows[0].id_paciente, {
      tipo: 'medicacion',
      mensaje: `Se actualizó el plan de medicación ${medication.medicamento} (${medication.dosis})${
        medication.activa ? '' : ' y se finalizó el tratamiento'
      }.`,
    })
    await connection.commit()
    return findMedicationById(medicationId)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function listRemindersForUser(user) {
  await ensureReminderWindow()
  const scope = patientScope(user)
  const nurseScope = user.role === 'ENFERMERO'
    ? 'AND (r.id_enfermero_asignado = ? OR r.id_enfermero_asignado IS NULL)'
    : ''
  const [rows] = await pool.execute(
    `${reminderSelect}
     WHERE r.fecha_hora_programada >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ${scope.sql} ${nurseScope}
     ORDER BY r.fecha_hora_programada
     LIMIT 1000`,
    user.role === 'ENFERMERO' ? [...scope.values, user.id] : scope.values,
  )
  return rows
}

export async function updateReminderStatus(reminderId, userId, estado, observaciones) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [existingRows] = await connection.execute(
      `SELECT r.id_recordatorio, m.id_paciente, m.nombre, m.dosis, p.nombre AS paciente
       FROM recordatorio AS r
       INNER JOIN medicacion AS m ON m.id_medicacion = r.id_medicacion
       INNER JOIN paciente AS p ON p.id_paciente = m.id_paciente
       WHERE r.id_recordatorio = ? AND r.estado = 'Pendiente'
         AND (r.id_enfermero_asignado = ? OR r.id_enfermero_asignado IS NULL)
       FOR UPDATE`,
      [reminderId, userId],
    )
    const existing = existingRows[0]
    if (!existing) {
      await connection.rollback()
      return null
    }

    await connection.execute(
      `UPDATE recordatorio SET estado = ?,
         fecha_hora_administrada = IF(? = 'Administrada', NOW(), NULL),
         id_enfermero = IF(? = 'Administrada', ?, NULL),
         id_enfermero_asignado = COALESCE(id_enfermero_asignado, ?),
         observaciones = ?
       WHERE id_recordatorio = ? AND estado = 'Pendiente'`,
      [estado, estado, estado, userId, userId, observaciones || null, reminderId],
    )
    await notifyPatientTutors(connection, existing.id_paciente, {
      tipo: 'medicacion',
      mensaje: estado === 'Administrada'
        ? `Se registró la administración de ${existing.nombre} (${existing.dosis}) para ${existing.paciente}.`
        : `Se registró una dosis omitida de ${existing.nombre} (${existing.dosis}) para ${existing.paciente}.`,
    })
    const [rows] = await connection.execute(
      `${reminderSelect} WHERE r.id_recordatorio = ?`,
      [reminderId],
    )
    await connection.commit()
    return rows[0] ?? null
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function listActiveNurses() {
  const [rows] = await pool.execute(
    `SELECT e.id_usuario AS id, u.nombre
     FROM enfermero AS e
     INNER JOIN usuario AS u ON u.id_usuario = e.id_usuario
     WHERE e.activo = TRUE
     ORDER BY u.nombre
     LIMIT 100`,
  )
  return rows
}

export async function assignReminderToNurse(reminderId, nurseId, user) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const nurseScope = user.role === 'ENFERMERO'
      ? 'AND (id_enfermero_asignado = ? OR id_enfermero_asignado IS NULL)'
      : ''
    const values = user.role === 'ENFERMERO' ? [reminderId, user.id] : [reminderId]
    const [reminders] = await connection.execute(
      `SELECT id_recordatorio
       FROM recordatorio
       WHERE id_recordatorio = ? AND estado = 'Pendiente' ${nurseScope}
       FOR UPDATE`,
      values,
    )
    if (!reminders[0]) {
      await connection.rollback()
      return null
    }

    const [nurses] = await connection.execute(
      `SELECT id_usuario
       FROM enfermero
       WHERE id_usuario = ? AND activo = TRUE
       FOR UPDATE`,
      [nurseId],
    )
    if (!nurses[0]) {
      await connection.rollback()
      return { error: 'nurse' }
    }

    await connection.execute(
      'UPDATE recordatorio SET id_enfermero_asignado = ? WHERE id_recordatorio = ?',
      [nurseId, reminderId],
    )
    const [rows] = await connection.execute(
      `${reminderSelect} WHERE r.id_recordatorio = ?`,
      [reminderId],
    )
    await connection.commit()
    return rows[0] ?? null
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function notifyPatientTutors(connection, patientId, notification) {
  const [tutors] = await connection.execute(
    `SELECT pm.id_usuario
     FROM paciente AS p
     INNER JOIN padre_madre AS pm
       ON pm.id_usuario = p.id_tutor_1 OR pm.id_usuario = p.id_tutor_2
     WHERE p.id_paciente = ? AND pm.recibe_notificaciones_app = TRUE`,
    [patientId],
  )
  const preferenceColumn = ({
    consulta: 'consultas',
    turno: 'turnos',
    medicacion: 'medicacion',
    vacuna: 'vacunas',
  })[notification.tipo]
  for (const tutor of tutors) {
    if (preferenceColumn) {
      const [preferenceRows] = await connection.execute(
        'SELECT preferencias_notificacion FROM padre_madre WHERE id_usuario = ?',
        [tutor.id_usuario],
      )
      const preferences = preferenceRows[0]?.preferencias_notificacion
      const types = typeof preferences === 'string'
        ? JSON.parse(preferences || '{}')
        : preferences
      if (types?.[preferenceColumn] === false) continue
    }
    await connection.execute(
      `INSERT INTO notificacion (id_usuario, id_paciente, canal, tipo, contenido, estado)
       VALUES (?, ?, 'APP', ?, ?, 'Enviada')`,
      [tutor.id_usuario, patientId, notification.tipo, notification.mensaje],
    )
  }
}

export async function listVaccinesForUser(user) {
  const scope = patientScope(user)
  const [rows] = await pool.execute(
    `${vaccineSelect} WHERE 1 = 1 ${scope.sql}
     ORDER BY COALESCE(v.proxima_dosis, v.fecha_aplicacion) DESC, v.nombre`,
    scope.values,
  )
  return rows
}

export async function createVaccine(vaccine, user) {
  const professionalColumn = user.role === 'MEDICO' ? 'id_medico' : 'id_enfermero'
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `INSERT INTO vacuna
         (id_paciente, ${professionalColumn}, nombre, dosis, fecha_aplicacion,
          proxima_dosis, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vaccine.idPaciente,
        user.id,
        vaccine.nombre,
        vaccine.dosis,
        vaccine.fechaAplicacion || null,
        vaccine.proximaDosis || null,
        vaccine.estado,
        vaccine.observaciones || null,
      ],
    )
    await notifyPatientTutors(connection, vaccine.idPaciente, {
      tipo: 'vacuna',
      mensaje: `Se registró ${vaccine.nombre} (${vaccine.dosis}), con estado ${vaccine.estado}.`,
    })
    const [rows] = await connection.execute(
      `${vaccineSelect} WHERE v.id_vacuna = ?`,
      [result.insertId],
    )
    await connection.commit()
    return rows[0] ?? null
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function updateVaccine(vaccineId, vaccine) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [previousRows] = await connection.execute(
      `SELECT id_paciente, nombre, dosis
       FROM vacuna WHERE id_vacuna = ? FOR UPDATE`,
      [vaccineId],
    )
    const previous = previousRows[0]
    if (!previous) {
      await connection.rollback()
      return null
    }
    await connection.execute(
      `UPDATE vacuna SET
         id_paciente = ?, nombre = ?, dosis = ?, fecha_aplicacion = ?, proxima_dosis = ?,
         estado = ?, observaciones = ?
       WHERE id_vacuna = ?`,
      [
        vaccine.idPaciente,
        vaccine.nombre,
        vaccine.dosis,
        vaccine.fechaAplicacion || null,
        vaccine.proximaDosis || null,
        vaccine.estado,
        vaccine.observaciones || null,
        vaccineId,
      ],
    )
    const vaccineChangeMessage = `Se actualizó ${vaccine.nombre} (${vaccine.dosis}); estado: ${vaccine.estado}.`
    await notifyPatientTutors(connection, previous.id_paciente, {
      tipo: 'vacuna',
      mensaje: vaccineChangeMessage,
    })
    if (Number(previous.id_paciente) !== Number(vaccine.idPaciente)) {
      await notifyPatientTutors(connection, vaccine.idPaciente, {
        tipo: 'vacuna',
        mensaje: vaccineChangeMessage,
      })
    }
    const [rows] = await connection.execute(`${vaccineSelect} WHERE v.id_vacuna = ?`, [vaccineId])
    await connection.commit()
    return rows[0] ?? null
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteVaccine(vaccineId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(
      `SELECT id_paciente, nombre, dosis
       FROM vacuna WHERE id_vacuna = ? FOR UPDATE`,
      [vaccineId],
    )
    const vaccine = rows[0]
    if (!vaccine) {
      await connection.rollback()
      return false
    }
    await notifyPatientTutors(connection, vaccine.id_paciente, {
      tipo: 'vacuna',
      mensaje: `Se eliminó el registro de ${vaccine.nombre} (${vaccine.dosis}).`,
    })
    await connection.execute('DELETE FROM vacuna WHERE id_vacuna = ?', [vaccineId])
    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
