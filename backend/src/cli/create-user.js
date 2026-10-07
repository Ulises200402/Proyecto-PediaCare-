import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'

const roles = new Set(['MEDICO', 'ENFERMERO', 'PADRE_MADRE'])

function promptInput(message, { hidden = false } = {}) {
  const input = process.stdin
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando en una terminal interactiva.')
  }

  process.stdout.write(message)
  input.setRawMode(true)
  input.resume()

  return new Promise((resolve) => {
    let value = ''

    function finish(result) {
      input.off('data', onData)
      input.setRawMode(false)
      input.pause()
      process.stdout.write('\r\n')
      resolve(result)
    }

    function onData(chunk) {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          finish(null)
          return
        }
        if (character === '\r' || character === '\n') {
          finish(value)
          return
        }
        if (character === '\u007f' || character === '\b') {
          if (value.length > 0) {
            value = value.slice(0, -1)
            if (!hidden) process.stdout.write('\b \b')
          }
          continue
        }
        if (character >= ' ' && character !== '\u007f') {
          value += character
          if (!hidden) process.stdout.write(character)
        }
      }
    }

    input.on('data', onData)
  })
}

function requireAnswer(value, label) {
  if (value === null) throw new Error('Creación cancelada.')
  const answer = value.trim()
  if (!answer) throw new Error(`${label} es obligatorio.`)
  return answer
}

async function createUser() {
  const name = requireAnswer(await promptInput('Nombre completo: '), 'Nombre')
  const email = requireAnswer(await promptInput('Correo electrónico: '), 'Correo')
    .toLowerCase()
  const role = requireAnswer(
    await promptInput('Rol (MEDICO, ENFERMERO, PADRE_MADRE): '),
    'Rol',
  ).toUpperCase()

  if (name.length > 100) throw new Error('El nombre admite hasta 100 caracteres.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('El correo electrónico no es válido.')
  }
  if (!roles.has(role)) throw new Error('El rol ingresado no está permitido.')

  let profile = {}
  if (role === 'MEDICO') {
    profile.matricula = requireAnswer(await promptInput('Matrícula: '), 'Matrícula')
    profile.especialidad = requireAnswer(await promptInput('Especialidad: '), 'Especialidad')
    if (profile.matricula.length > 30 || profile.especialidad.length > 80) {
      throw new Error('La matrícula admite 30 y la especialidad 80 caracteres como máximo.')
    }
  } else if (role === 'ENFERMERO') {
    profile.matricula = requireAnswer(await promptInput('Matrícula: '), 'Matrícula')
    if (profile.matricula.length > 30) {
      throw new Error('La matrícula admite hasta 30 caracteres.')
    }
  } else {
    profile.telefono = await promptInput('Teléfono (opcional): ')
    if (profile.telefono?.length > 25) {
      throw new Error('El teléfono admite hasta 25 caracteres.')
    }
  }

  const password = await promptInput('Contraseña (mínimo 12 caracteres, entrada oculta): ', { hidden: true })
  const confirmation = await promptInput('Repetir contraseña (entrada oculta): ', { hidden: true })
  if (password === null || confirmation === null) throw new Error('Creación cancelada.')
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.')
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.')

  const passwordHash = await bcrypt.hash(password, 12)
  const connection = await pool.getConnection()
  let transactionStarted = false

  try {
    await connection.beginTransaction()
    transactionStarted = true

    const [result] = await connection.execute(
      'INSERT INTO usuario (nombre, email, contrasena_hash, rol) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role],
    )
    const userId = result.insertId

    if (role === 'MEDICO') {
      await connection.execute(
        'INSERT INTO medico (id_usuario, matricula, especialidad) VALUES (?, ?, ?)',
        [userId, profile.matricula, profile.especialidad],
      )
    } else if (role === 'ENFERMERO') {
      await connection.execute(
        'INSERT INTO enfermero (id_usuario, matricula) VALUES (?, ?)',
        [userId, profile.matricula],
      )
    } else {
      await connection.execute(
        'INSERT INTO padre_madre (id_usuario, telefono) VALUES (?, ?)',
        [userId, profile.telefono || null],
      )
    }

    await connection.commit()
    transactionStarted = false
    console.log(`Cuenta creada: ${email} (${role}), ID ${userId}.`)
  } catch (error) {
    if (transactionStarted) await connection.rollback()
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Ya existe una cuenta con ese correo o matrícula.')
    }
    throw error
  } finally {
    connection.release()
  }
}

try {
  await createUser()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}