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
    p.fecha_alta AS fechaAlta
  FROM paciente AS p`

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