import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'

const tokenIssuer = 'pediacare-api'
const tokenAudience = 'pediacare-client'
const developmentSecret = randomBytes(32).toString('hex')

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('JWT_SECRET no está configurado; se usará una clave local temporal.')
}

function getSecret() {
  const secret = process.env.JWT_SECRET
    || (process.env.NODE_ENV !== 'production' ? developmentSecret : '')
  if (secret.length < 32) {
    const error = new Error('Configura JWT_SECRET con al menos 32 caracteres.')
    error.statusCode = 503
    throw error
  }

  return secret
}

export function assertTokenSigningReady() {
  getSecret()
}

export function createAccessToken(user) {
  return jwt.sign(
    { rol: user.rol },
    getSecret(),
    {
      subject: String(user.id_usuario),
      issuer: tokenIssuer,
      audience: tokenAudience,
      expiresIn: '1h',
    },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret(), {
    issuer: tokenIssuer,
    audience: tokenAudience,
  })
}