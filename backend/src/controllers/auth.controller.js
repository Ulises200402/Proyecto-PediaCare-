import bcrypt from 'bcryptjs'
import {
  createUserWithProfile,
  findUserByEmail,
} from '../repositories/user.repository.js'
import { isRegistrationCodeValid } from '../services/registration.service.js'
import {
  assertTokenSigningReady,
  createAccessToken,
} from '../services/token.service.js'
import { validateRegistration } from '../validators/registration.validator.js'

export async function register(request, response, next) {
  const validation = validateRegistration(request.body)
  if (validation.errors) {
    return response.status(400).json({
      error: 'Los datos de registro no son válidos.',
      details: validation.errors,
    })
  }

  const account = validation.value
  if (account.role !== 'PADRE_MADRE'
      && !isRegistrationCodeValid(account.role, account.registrationCode)) {
    return response.status(403).json({ error: 'El código de habilitación no es válido.' })
  }

  try {
    assertTokenSigningReady()
    const passwordHash = await bcrypt.hash(account.password, 12)
    const user = await createUserWithProfile({
      nombre: account.nombre,
      email: account.email,
      contrasenaHash: passwordHash,
      rol: account.role,
      telefono: account.telefono,
      matricula: account.matricula,
      especialidad: account.especialidad,
    })
    const token = createAccessToken({ id_usuario: user.id, rol: account.role })

    return response.status(201).json({
      token,
      user: {
        id: user.id,
        name: account.nombre,
        email: account.email,
        role: account.role,
      },
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({
        error: 'Ya existe una cuenta con ese correo o matrícula.',
      })
    }
    return next(error)
  }
}

export async function login(request, response, next) {
  const email = typeof request.body?.email === 'string'
    ? request.body.email.trim().toLowerCase()
    : ''
  const password = typeof request.body?.password === 'string'
    ? request.body.password
    : ''

  if (!email || !password) {
    return response.status(400).json({ error: 'Email y contraseña son obligatorios.' })
  }

  try {
    const user = await findUserByEmail(email)
    const passwordMatches = user
      ? await bcrypt.compare(password, user.contrasena_hash)
      : false

    if (!user || !passwordMatches) {
      return response.status(401).json({ error: 'Credenciales incorrectas.' })
    }

    if (!user.activo) {
      return response.status(403).json({ error: 'La cuenta no está activa o el perfil está incompleto.' })
    }

    const token = createAccessToken(user)
    return response.json({
      token,
      user: {
        id: user.id_usuario,
        name: user.nombre,
        email: user.email,
        role: user.rol,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export function getCurrentUser(request, response) {
  const { id, name, email, role } = request.user
  return response.json({ id, name, email, role })
}