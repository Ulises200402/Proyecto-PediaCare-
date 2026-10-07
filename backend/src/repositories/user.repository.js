import { pool } from '../config/database.js'

const userProfileJoins = `
  LEFT JOIN medico AS m ON m.id_usuario = u.id_usuario
  LEFT JOIN enfermero AS e ON e.id_usuario = u.id_usuario
  LEFT JOIN padre_madre AS p ON p.id_usuario = u.id_usuario`

const activeProfile = `CASE
  WHEN u.rol = 'MEDICO' THEN COALESCE(m.activo, FALSE)
  WHEN u.rol = 'ENFERMERO' THEN COALESCE(e.activo, FALSE)
  WHEN u.rol = 'PADRE_MADRE' THEN p.id_usuario IS NOT NULL
  ELSE FALSE
END`

export async function createUserWithProfile(account) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      'INSERT INTO usuario (nombre, email, contrasena_hash, rol) VALUES (?, ?, ?, ?)',
      [account.nombre, account.email, account.contrasenaHash, account.rol],
    )
    const userId = result.insertId

    if (account.rol === 'MEDICO') {
      await connection.execute(
        'INSERT INTO medico (id_usuario, matricula, especialidad) VALUES (?, ?, ?)',
        [userId, account.matricula, account.especialidad],
      )
    } else if (account.rol === 'ENFERMERO') {
      await connection.execute(
        'INSERT INTO enfermero (id_usuario, matricula) VALUES (?, ?)',
        [userId, account.matricula],
      )
    } else {
      await connection.execute(
        'INSERT INTO padre_madre (id_usuario, telefono) VALUES (?, ?)',
        [userId, account.telefono || null],
      )
    }

    await connection.commit()
    return { id: userId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT
       u.id_usuario,
       u.nombre,
       u.email,
       u.contrasena_hash,
       u.rol,
       ${activeProfile} AS activo
     FROM usuario AS u
     ${userProfileJoins}
     WHERE u.email = ?
     LIMIT 1`,
    [email],
  )

  return rows[0] ?? null
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT
       u.id_usuario,
       u.nombre,
       u.email,
       u.rol,
       ${activeProfile} AS activo
     FROM usuario AS u
     ${userProfileJoins}
     WHERE u.id_usuario = ?
     LIMIT 1`,
    [id],
  )

  return rows[0] ?? null
}