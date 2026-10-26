import { pool } from '../config/database.js'

const appointmentSelect = `
  SELECT
    t.id_turno AS id,
    t.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    t.id_medico AS idMedico,
    mu.nombre AS medicoNombre,
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

export async function updateAppointmentStatus(appointmentId, estado) {
  await pool.execute(
    'UPDATE turno SET estado = ? WHERE id_turno = ?',
    [estado, appointmentId],
  )
  const [rows] = await pool.execute(
    `${appointmentSelect} WHERE t.id_turno = ? LIMIT 1`,
    [appointmentId],
  )
  return rows[0] ?? null
}
