import { pool } from '../config/database.js'
import { notifyPatientTutors } from './clinical.repository.js'

const appointmentSelect = `
  SELECT
    t.id_turno AS id,
    t.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    p.dni AS pacienteDni,
    t.id_medico AS idMedico,
    mu.nombre AS medicoNombre,
    m.especialidad,
    t.fecha_hora AS fechaHora,
    t.motivo,
    t.estado,
    t.fecha_alta AS fechaAlta
  FROM turno AS t
  INNER JOIN paciente AS p ON p.id_paciente = t.id_paciente
  INNER JOIN medico AS m ON m.id_usuario = t.id_medico
  INNER JOIN usuario AS mu ON mu.id_usuario = m.id_usuario`

export async function findAppointmentsForUser(user) {
  if (user.role === 'PADRE_MADRE') {
    const [rows] = await pool.execute(
      `${appointmentSelect}
       WHERE p.id_tutor_1 = ? OR p.id_tutor_2 = ?
       ORDER BY t.fecha_hora DESC
       LIMIT 100`,
      [user.id, user.id],
    )
    return rows
  }

  if (user.role === 'MEDICO') {
    const [rows] = await pool.execute(
      `${appointmentSelect}
       WHERE t.id_medico = ?
       ORDER BY t.fecha_hora DESC
       LIMIT 100`,
      [user.id],
    )
    return rows
  }

  const [rows] = await pool.execute(
    `${appointmentSelect}
     ORDER BY t.fecha_hora DESC
     LIMIT 100`,
  )
  return rows
}

export async function updateAppointmentStatus(appointmentId, estado, user) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const ownerFilter = user.role === 'MEDICO' ? 'AND id_medico = ?' : ''
    const values = user.role === 'MEDICO' ? [appointmentId, user.id] : [appointmentId]
    const [existingRows] = await connection.execute(
      `SELECT id_paciente, estado FROM turno WHERE id_turno = ? ${ownerFilter} FOR UPDATE`,
      values,
    )
    const existing = existingRows[0]
    if (!existing) {
      await connection.rollback()
      return null
    }

    const allowedTransitions = {
      Programado: ['Confirmado', 'Cancelado'],
      Confirmado: ['Atendido', 'Ausente', 'Cancelado'],
      Atendido: [],
      Ausente: [],
      Cancelado: [],
    }
    if (!allowedTransitions[existing.estado]?.includes(estado)) {
      await connection.rollback()
      return { error: 'transition' }
    }

    await connection.execute(
      'UPDATE turno SET estado = ? WHERE id_turno = ?',
      [estado, appointmentId],
    )
    await notifyPatientTutors(connection, existing.id_paciente, {
      tipo: 'turno',
      mensaje: `El turno de ${existing.estado.toLowerCase()} cambió a ${estado.toLowerCase()}.`,
    })
    const [rows] = await connection.execute(
      `${appointmentSelect} WHERE t.id_turno = ? LIMIT 1`,
      [appointmentId],
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

export async function listAvailableDoctors() {
  const [rows] = await pool.execute(
    `SELECT m.id_usuario AS id, u.nombre, m.especialidad
     FROM medico AS m
     INNER JOIN usuario AS u ON u.id_usuario = m.id_usuario
     WHERE m.activo = TRUE
     ORDER BY u.nombre`,
  )
  return rows
}

export async function createAppointmentRequest(appointment, user) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [doctorRows] = await connection.execute(
      `SELECT m.id_usuario, u.nombre, m.especialidad
       FROM medico AS m
       INNER JOIN usuario AS u ON u.id_usuario = m.id_usuario
       WHERE m.id_usuario = ? AND m.activo = TRUE
       FOR UPDATE`,
      [appointment.idMedico],
    )
    if (!doctorRows[0]) {
      await connection.rollback()
      return { error: 'doctor' }
    }

    const parentScope = user.role === 'PADRE_MADRE'
      ? 'AND (p.id_tutor_1 = ? OR p.id_tutor_2 = ?)'
      : ''
    const patientParams = user.role === 'PADRE_MADRE'
      ? [appointment.idPaciente, user.id, user.id]
      : [appointment.idPaciente]
    const [patientRows] = await connection.execute(
      `SELECT p.id_paciente, p.nombre, p.id_tutor_1, p.id_tutor_2
       FROM paciente AS p
       WHERE p.id_paciente = ? ${parentScope}
       FOR UPDATE`,
      patientParams,
    )
    if (!patientRows[0]) {
      await connection.rollback()
      return { error: 'patient' }
    }

    const [conflicts] = await connection.execute(
      `SELECT id_turno FROM turno
       WHERE fecha_hora = ? AND estado <> 'Cancelado'
         AND (id_medico = ? OR id_paciente = ?)
       LIMIT 1`,
      [appointment.fechaHora, appointment.idMedico, appointment.idPaciente],
    )
    if (conflicts.length) {
      await connection.rollback()
      return { error: 'conflict' }
    }

    const [result] = await connection.execute(
      `INSERT INTO turno (id_paciente, id_medico, fecha_hora, motivo, estado)
       VALUES (?, ?, ?, ?, 'Programado')`,
      [
        appointment.idPaciente,
        appointment.idMedico,
        appointment.fechaHora,
        appointment.motivo,
      ],
    )
    const message = `Se solicitó un turno para ${patientRows[0].nombre} el ${
      appointment.fechaHora.replace('T', ' ')
    } con ${doctorRows[0].nombre}.`
    await connection.execute(
      `INSERT INTO notificacion (id_usuario, id_paciente, canal, tipo, contenido, estado)
       VALUES (?, ?, 'APP', 'turno', ?, 'Enviada')`,
      [doctorRows[0].id_usuario, appointment.idPaciente, message],
    )
    await notifyPatientTutors(connection, appointment.idPaciente, {
      tipo: 'turno',
      mensaje: message,
    })

    const [rows] = await connection.execute(
      `${appointmentSelect} WHERE t.id_turno = ? LIMIT 1`,
      [result.insertId],
    )
    await connection.commit()
    return { data: rows[0] ?? null }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function cancelFamilyAppointment(appointmentId, user) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [existingRows] = await connection.execute(
      `SELECT t.id_paciente, t.id_medico, t.estado
       FROM turno AS t
       INNER JOIN paciente AS p ON p.id_paciente = t.id_paciente
       WHERE t.id_turno = ? AND (p.id_tutor_1 = ? OR p.id_tutor_2 = ?)
       FOR UPDATE`,
      [appointmentId, user.id, user.id],
    )
    const existing = existingRows[0]
    if (!existing || !['Programado', 'Confirmado'].includes(existing.estado)) {
      await connection.rollback()
      return null
    }
    await connection.execute(
      "UPDATE turno SET estado = 'Cancelado' WHERE id_turno = ?",
      [appointmentId],
    )
    await connection.execute(
      `INSERT INTO notificacion (id_usuario, id_paciente, canal, tipo, contenido, estado)
       VALUES (?, ?, 'APP', 'turno', ?, 'Enviada')`,
      [existing.id_medico, existing.id_paciente, 'La familia canceló un turno solicitado.'],
    )
    const [rows] = await connection.execute(
      `${appointmentSelect} WHERE t.id_turno = ? LIMIT 1`,
      [appointmentId],
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
