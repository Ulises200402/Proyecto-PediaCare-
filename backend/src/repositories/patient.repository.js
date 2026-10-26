import { pool } from '../config/database.js'

const patientSelect = `
  SELECT
    p.id_paciente AS id,
    p.nombre,
    p.fecha_nacimiento AS fechaNacimiento,
    p.sexo,
    p.alergias,
    p.enfermedades_cronicas AS enfermedadesCronicas,
    p.id_tutor_1 AS idTutor1,
    p.id_tutor_2 AS idTutor2,
    p.fecha_alta AS fechaAlta,
    t1.nombre AS tutor1Nombre,
    t1p.telefono AS tutor1Telefono,
    t2.nombre AS tutor2Nombre,
    t2p.telefono AS tutor2Telefono
  FROM paciente AS p
  LEFT JOIN usuario AS t1 ON t1.id_usuario = p.id_tutor_1
  LEFT JOIN padre_madre AS t1p ON t1p.id_usuario = p.id_tutor_1
  LEFT JOIN usuario AS t2 ON t2.id_usuario = p.id_tutor_2
  LEFT JOIN padre_madre AS t2p ON t2p.id_usuario = p.id_tutor_2`

export async function findPatientsForUser(user) {
  if (user.role === 'PADRE_MADRE') {
    const [rows] = await pool.execute(
      `${patientSelect}
       WHERE p.id_tutor_1 = ? OR p.id_tutor_2 = ?
       ORDER BY p.nombre
       LIMIT 100`,
      [user.id, user.id],
    )
    return rows
  }

  const [rows] = await pool.execute(
    `${patientSelect}
     ORDER BY p.nombre
     LIMIT 100`,
  )
  return rows
}

export async function findPatientForUser(patientId, user) {
  const parentScope = user.role === 'PADRE_MADRE'
    ? 'AND (p.id_tutor_1 = ? OR p.id_tutor_2 = ?)'
    : ''
  const parameters = user.role === 'PADRE_MADRE'
    ? [patientId, user.id, user.id]
    : [patientId]

  const [rows] = await pool.execute(
    `${patientSelect}
     WHERE p.id_paciente = ? ${parentScope}
     LIMIT 1`,
    parameters,
  )
  return rows[0] ?? null
}

export async function createPatientWithHistory(patient) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `INSERT INTO paciente
         (nombre, fecha_nacimiento, sexo, alergias, enfermedades_cronicas,
          id_tutor_1, id_tutor_2)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.nombre,
        patient.fechaNacimiento,
        patient.sexo,
        patient.alergias,
        patient.enfermedadesCronicas,
        patient.idTutor1,
        patient.idTutor2,
      ],
    )

    await connection.execute(
      'INSERT INTO historial_clinico (id_paciente) VALUES (?)',
      [result.insertId],
    )

    const [rows] = await connection.execute(
      `${patientSelect} WHERE p.id_paciente = ? LIMIT 1`,
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

export async function findTutors() {
  const [rows] = await pool.execute(
    `SELECT
       pm.id_usuario AS id,
       u.nombre,
       pm.telefono
     FROM padre_madre AS pm
     INNER JOIN usuario AS u ON u.id_usuario = pm.id_usuario
     ORDER BY u.nombre`,
  )
  return rows
}

export async function updatePatient(patientId, patient) {
  const [result] = await pool.execute(
    `UPDATE paciente SET
       nombre = ?,
       fecha_nacimiento = ?,
       sexo = ?,
       alergias = ?,
       enfermedades_cronicas = ?,
       id_tutor_1 = ?,
       id_tutor_2 = ?
     WHERE id_paciente = ?`,
    [
      patient.nombre,
      patient.fechaNacimiento,
      patient.sexo,
      patient.alergias,
      patient.enfermedadesCronicas,
      patient.idTutor1,
      patient.idTutor2,
      patientId,
    ],
  )

  if (result.affectedRows === 0) return null

  const [rows] = await pool.execute(
    `${patientSelect} WHERE p.id_paciente = ? LIMIT 1`,
    [patientId],
  )
  return rows[0] ?? null
}