import { pool } from '../config/database.js'

const consultationSelect = `
  SELECT
    c.id_consulta AS id,
    hc.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    c.id_medico AS idMedico,
    u.nombre AS medicoNombre,
    c.fecha_consulta AS fechaConsulta,
    c.motivo,
    c.diagnostico,
    c.tratamiento,
    c.observaciones
  FROM consulta AS c
  INNER JOIN historial_clinico AS hc ON hc.id_historial = c.id_historial
  INNER JOIN paciente AS p ON p.id_paciente = hc.id_paciente
  INNER JOIN usuario AS u ON u.id_usuario = c.id_medico`

export async function findConsultationsForUser(user) {
  if (user.role === 'PADRE_MADRE') {
    const [rows] = await pool.execute(
      `${consultationSelect}
       WHERE p.id_tutor_1 = ? OR p.id_tutor_2 = ?
       ORDER BY c.fecha_consulta DESC
       LIMIT 200`,
      [user.id, user.id],
    )
    return rows
  }

  if (user.role === 'MEDICO') {
    const [rows] = await pool.execute(
      `${consultationSelect}
       WHERE c.id_medico = ?
       ORDER BY c.fecha_consulta DESC
       LIMIT 200`,
      [user.id],
    )
    return rows
  }

  const [rows] = await pool.execute(
    `${consultationSelect}
     ORDER BY c.fecha_consulta DESC
     LIMIT 200`,
  )
  return rows
}

export async function createConsultationRecord(consultation) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [historialRows] = await connection.execute(
      'SELECT id_historial FROM historial_clinico WHERE id_paciente = ? LIMIT 1',
      [consultation.idPaciente],
    )
    let historialId = historialRows[0]?.id_historial
    if (!historialId) {
      const [histResult] = await connection.execute(
        'INSERT INTO historial_clinico (id_paciente) VALUES (?)',
        [consultation.idPaciente],
      )
      historialId = histResult.insertId
    }

    const [result] = await connection.execute(
      `INSERT INTO consulta
         (id_historial, id_medico, fecha_consulta, motivo, diagnostico, tratamiento, observaciones)
       VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
      [
        historialId,
        consultation.idMedico,
        consultation.motivo,
        consultation.diagnostico,
        consultation.tratamiento,
        consultation.observaciones || null,
      ],
    )

    const [rows] = await connection.execute(
      `${consultationSelect} WHERE c.id_consulta = ? LIMIT 1`,
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

export async function updateConsultationRecord(consultationId, consultation) {
  await pool.execute(
    `UPDATE consulta SET
       motivo = ?,
       diagnostico = ?,
       tratamiento = ?,
       observaciones = ?
     WHERE id_consulta = ?`,
    [
      consultation.motivo,
      consultation.diagnostico,
      consultation.tratamiento,
      consultation.observaciones || null,
      consultationId,
    ],
  )

  const [rows] = await pool.execute(
    `${consultationSelect} WHERE c.id_consulta = ? LIMIT 1`,
    [consultationId],
  )
  return rows[0] ?? null
}

export async function deleteConsultationRecord(consultationId) {
  const [result] = await pool.execute(
    'DELETE FROM consulta WHERE id_consulta = ?',
    [consultationId],
  )
  return result.affectedRows > 0
}

export async function getDoctorMetrics(doctorId) {
  const [monthRows] = await pool.execute(
    `SELECT COUNT(*) AS totalMes FROM consulta 
     WHERE id_medico = ? AND MONTH(fecha_consulta) = MONTH(CURRENT_DATE()) 
     AND YEAR(fecha_consulta) = YEAR(CURRENT_DATE())`,
    [doctorId],
  )
  const [todayRows] = await pool.execute(
    `SELECT COUNT(*) AS totalHoy FROM consulta 
     WHERE id_medico = ? AND DATE(fecha_consulta) = CURDATE()`,
    [doctorId],
  )
  const [patientsRows] = await pool.execute(
    `SELECT COUNT(DISTINCT hc.id_paciente) AS totalPacientes 
     FROM consulta c 
     INNER JOIN historial_clinico hc ON hc.id_historial = c.id_historial 
     WHERE c.id_medico = ?`,
    [doctorId],
  )

  const [diagRows] = await pool.execute(
    `SELECT motivo AS label, COUNT(*) as count 
     FROM consulta WHERE id_medico = ? 
     GROUP BY motivo ORDER BY count DESC LIMIT 5`,
    [doctorId],
  )

  return {
    totalConsultasMes: monthRows[0]?.totalMes || 0,
    consultasHoy: todayRows[0]?.totalHoy || 0,
    pacientesDistintos: patientsRows[0]?.totalPacientes || 0,
    motivosFrecuentes: diagRows.length > 0 ? diagRows : [],
  }
}