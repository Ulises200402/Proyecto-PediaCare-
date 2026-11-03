import { pool } from '../config/database.js'
import { notifyPatientTutors } from './clinical.repository.js'

const consultationSelect = `
  SELECT
    c.id_consulta AS id,
    hc.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    p.dni AS pacienteDni,
    c.id_medico AS idMedico,
    u.nombre AS medicoNombre,
    c.fecha_consulta AS fechaConsulta,
    c.motivo,
    c.diagnostico,
    c.tratamiento,
    c.observaciones,
    c.indicaciones_para_padres AS indicacionesParaPadres
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
         (id_historial, id_medico, fecha_consulta, motivo, diagnostico, tratamiento,
          observaciones, indicaciones_para_padres)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [
        historialId,
        consultation.idMedico,
        consultation.motivo,
        consultation.diagnostico,
        consultation.tratamiento,
        consultation.observaciones || null,
        consultation.indicacionesParaPadres || null,
      ],
    )

    const [rows] = await connection.execute(
      `${consultationSelect} WHERE c.id_consulta = ? LIMIT 1`,
      [result.insertId],
    )

    // Buscar tutores del paciente para notificarles automáticamente (HU 4)
    const savedConsultation = rows[0]
    if (savedConsultation) {
      await notifyPatientTutors(connection, consultation.idPaciente, {
        tipo: 'consulta',
        mensaje: `${savedConsultation.medicoNombre} registró una consulta para ${
          savedConsultation.pacienteNombre
        }: "${consultation.motivo}".`,
      })
    }

    await connection.commit()
    return rows[0] ?? null
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function updateConsultationRecord(consultationId, doctorId, consultation) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [existingRows] = await connection.execute(
      `SELECT hc.id_paciente, p.nombre AS paciente
       FROM consulta AS c
       INNER JOIN historial_clinico AS hc ON hc.id_historial = c.id_historial
       INNER JOIN paciente AS p ON p.id_paciente = hc.id_paciente
       WHERE c.id_consulta = ? AND c.id_medico = ?
       FOR UPDATE`,
      [consultationId, doctorId],
    )
    const existing = existingRows[0]
    if (!existing) {
      await connection.rollback()
      return null
    }
    await connection.execute(
      `UPDATE consulta SET
         motivo = ?, diagnostico = ?, tratamiento = ?, observaciones = ?,
         indicaciones_para_padres = ?
       WHERE id_consulta = ? AND id_medico = ?`,
      [
        consultation.motivo,
        consultation.diagnostico,
        consultation.tratamiento,
        consultation.observaciones || null,
        consultation.indicacionesParaPadres || null,
        consultationId,
        doctorId,
      ],
    )
    const [rows] = await connection.execute(
      `${consultationSelect} WHERE c.id_consulta = ? AND c.id_medico = ? LIMIT 1`,
      [consultationId, doctorId],
    )
    await notifyPatientTutors(connection, existing.id_paciente, {
      tipo: 'consulta',
      mensaje: `Se actualizó la consulta de ${existing.paciente}: "${consultation.motivo}".`,
    })
    await connection.commit()
    return rows[0] ?? null
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteConsultationRecord(consultationId, doctorId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(
      `SELECT hc.id_paciente, p.nombre AS paciente, c.motivo
       FROM consulta AS c
       INNER JOIN historial_clinico AS hc ON hc.id_historial = c.id_historial
       INNER JOIN paciente AS p ON p.id_paciente = hc.id_paciente
       WHERE c.id_consulta = ? AND c.id_medico = ?
       FOR UPDATE`,
      [consultationId, doctorId],
    )
    const consultation = rows[0]
    if (!consultation) {
      await connection.rollback()
      return false
    }
    await notifyPatientTutors(connection, consultation.id_paciente, {
      tipo: 'consulta',
      mensaje: `Se eliminó el registro de consulta de ${consultation.paciente}: "${consultation.motivo}".`,
    })
    await connection.execute(
      'DELETE FROM consulta WHERE id_consulta = ? AND id_medico = ?',
      [consultationId, doctorId],
    )
    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function getDoctorMetrics(doctorId) {
  const [monthRows] = await pool.execute(
    `SELECT COUNT(*) AS totalMes FROM consulta 
     WHERE id_medico = ? AND MONTH(fecha_consulta) = MONTH(CURRENT_DATE()) 
     AND YEAR(fecha_consulta) = YEAR(CURRENT_DATE())`,
    [doctorId],
  )
  const [previousMonthRows] = await pool.execute(
    `SELECT COUNT(*) AS totalMesAnterior FROM consulta
     WHERE id_medico = ?
       AND YEAR(fecha_consulta) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
       AND MONTH(fecha_consulta) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)`,
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
    consultasMesAnterior: previousMonthRows[0]?.totalMesAnterior || 0,
    consultasHoy: todayRows[0]?.totalHoy || 0,
    pacientesDistintos: patientsRows[0]?.totalPacientes || 0,
    motivosFrecuentes: diagRows.length > 0 ? diagRows : [],
  }
}