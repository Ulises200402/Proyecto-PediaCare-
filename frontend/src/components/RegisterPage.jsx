import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
} from 'lucide-react'
import AccessBrandPanel from './AccessBrandPanel.jsx'
import { register } from '../services/api.js'

const roleOptions = [
  { value: 'PADRE_MADRE', label: 'Padre / Madre', icon: UserRound },
  { value: 'MEDICO', label: 'Médico', icon: Stethoscope },
  { value: 'ENFERMERO', label: 'Enfermería', icon: Syringe },
]

export default function RegisterPage({ onBackToLogin, onRegistered }) {
  const [role, setRole] = useState('PADRE_MADRE')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [registerError, setRegisterError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setRegisterError('')
    const form = new FormData(event.currentTarget)
    const password = form.get('password')

    if (password !== form.get('passwordConfirmation')) {
      setRegisterError('Las contraseñas no coinciden.')
      setIsSubmitting(false)
      return
    }

    const account = {
      nombre: form.get('nombre'),
      email: form.get('email'),
      password,
      role,
    }

    if (role === 'PADRE_MADRE') {
      account.telefono = form.get('telefono')
    } else {
      account.matricula = form.get('matricula')
      account.registrationCode = form.get('registrationCode')
      if (role === 'MEDICO') account.especialidad = form.get('especialidad')
    }

    try {
      const result = await register(account)
      onRegistered(result)
    } catch (error) {
      setRegisterError(error.details?.join(' ') || error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="access-page">
      <AccessBrandPanel />
      <section className="login-panel register-panel" aria-labelledby="register-title">
        <div className="login-panel__inner register-panel__inner">
          <div className="login-panel__topline">
            <span className="login-panel__mobile-brand">
              <span className="brand__mark" aria-hidden="true"><HeartPulse size={20} /></span>
              PediaCare<span>+</span>
            </span>
            <span className="login-panel__context">CREACIÓN DE CUENTA</span>
          </div>

          <div className="login-heading register-heading">
            <p className="login-heading__eyebrow">BIENVENIDO/A</p>
            <h2 id="register-title">Crear cuenta</h2>
            <p>Elegí tu perfil y completá tus datos.</p>
          </div>

          <div className="register-role-picker" aria-label="Tipo de cuenta">
            {roleOptions.map(({ value, label, icon: Icon }) => (
              <button
                aria-pressed={role === value}
                className={role === value ? 'register-role is-active' : 'register-role'}
                key={value}
                onClick={() => { setRole(value); setRegisterError('') }}
                type="button"
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <form className="login-form register-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="register-name">Nombre completo</label>
              <input id="register-name" autoComplete="name" maxLength="100" name="nombre" required />
            </div>
            <div className="field-group">
              <label htmlFor="register-email">Correo electrónico</label>
              <div className="input-shell">
                <Mail className="input-shell__icon" size={18} aria-hidden="true" />
                <input id="register-email" autoComplete="email" maxLength="254" name="email" placeholder="nombre@correo.com" required type="email" />
              </div>
            </div>

            {role === 'PADRE_MADRE' && (
              <div className="field-group register-form__wide">
                <label htmlFor="register-phone">Teléfono <span>(opcional)</span></label>
                <input id="register-phone" autoComplete="tel" maxLength="25" name="telefono" type="tel" />
              </div>
            )}

            {(role === 'MEDICO' || role === 'ENFERMERO') && (
              <>
                <div className="field-group">
                  <label htmlFor="register-license">Matrícula profesional</label>
                  <input id="register-license" maxLength="30" name="matricula" required />
                </div>
                {role === 'MEDICO' && (
                  <div className="field-group">
                    <label htmlFor="register-specialty">Especialidad</label>
                    <input id="register-specialty" maxLength="80" name="especialidad" required />
                  </div>
                )}
                <div className="field-group register-form__wide">
                  <label htmlFor="registration-code">Código de habilitación</label>
                  <div className="input-shell">
                    <ShieldCheck className="input-shell__icon" size={18} aria-hidden="true" />
                    <input id="registration-code" autoComplete="off" name="registrationCode" required type="password" />
                  </div>
                  <span className="field-help">Solicitalo a quien administra PediaCare+.</span>
                </div>
              </>
            )}

            <div className="field-group">
              <label htmlFor="register-password">Contraseña</label>
              <div className="input-shell">
                <LockKeyhole className="input-shell__icon" size={18} aria-hidden="true" />
                <input
                  id="register-password"
                  autoComplete="new-password"
                  minLength="12"
                  maxLength="72"
                  name="password"
                  placeholder="Mínimo 12 caracteres"
                  required
                  type={passwordVisible ? 'text' : 'password'}
                />
                <button
                  aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="password-toggle"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  type="button"
                >
                  {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="register-password-confirmation">Repetir contraseña</label>
              <div className="input-shell">
                <LockKeyhole className="input-shell__icon" size={18} aria-hidden="true" />
                <input id="register-password-confirmation" autoComplete="new-password" minLength="12" maxLength="72" name="passwordConfirmation" required type="password" />
              </div>
            </div>

            {registerError && <p className="login-message register-form__wide" role="alert">{registerError}</p>}

            <button className="login-button register-form__wide" disabled={isSubmitting} type="submit">
              <span>{isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</span>
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </form>

          <button className="access-switch" onClick={onBackToLogin} type="button">
            ¿Ya tenés cuenta? <span>Iniciar sesión</span>
          </button>
        </div>

        <footer className="login-panel__footer">
          <span>© 2026 PediaCare+</span>
          <span>Atención pediátrica</span>
        </footer>
      </section>
    </main>
  )
}