import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Stethoscope,
  Pill,
  Users,
  Sparkles,
} from 'lucide-react'
import AccessBrandPanel from './components/AccessBrandPanel.jsx'
import AuthenticatedDashboard from './components/AuthenticatedDashboard.jsx'
import RegisterPage from './components/RegisterPage.jsx'
import { getCurrentUser, login } from './services/api.js'
import './App.css'

const demoUsers = {
  MEDICO: {
    id: 1,
    name: 'Dra. Lucía Benítez',
    email: 'lucia.benitez@pediacare.local',
    role: 'MEDICO',
    title: 'Médica Pediatra (HU 1, 2, 3)',
  },
  ENFERMERO: {
    id: 2,
    name: 'Enf. Lautaro Altamirano',
    email: 'lautaro.altamirano@pediacare.local',
    role: 'ENFERMERO',
    title: 'Enfermería y Control (HU 5, 2, 3)',
  },
  PADRE_MADRE: {
    id: 101,
    name: 'Marina Torres',
    email: 'marina.torres@correo.com',
    role: 'PADRE_MADRE',
    title: 'Madre / Familia (HU 4, 2)',
  },
}

function App() {
  const [session, setSession] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(
    () => Boolean(sessionStorage.getItem('pediacare.token')),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    const token = sessionStorage.getItem('pediacare.token')
    if (!token) return

    getCurrentUser(token)
      .then((user) => setSession({ token, user }))
      .catch(() => sessionStorage.removeItem('pediacare.token'))
      .finally(() => setIsRestoringSession(false))
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginError('')

    try {
      const result = await login({
        email: event.currentTarget.email.value,
        password: event.currentTarget.password.value,
      })
      sessionStorage.setItem('pediacare.token', result.token)
      setSession({ token: result.token, user: result.user })
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('pediacare.token')
    setSession(null)
    setLoginError('')
  }

  function handleStartDemo(roleKey) {
    setSession({
      token: null,
      user: demoUsers[roleKey],
      isDemo: true,
    })
  }

  if (isRestoringSession) {
    return <main className="auth-loading" aria-label="Verificando sesión" />
  }

  if (session) {
    return (
      <AuthenticatedDashboard
        key={session.user.id || session.user.role}
        onLogout={handleLogout}
        token={session.token}
        user={session.user}
        isDemo={Boolean(session.isDemo)}
        onChangeDemoRole={(newRole) => {
          setSession({
            token: null,
            user: demoUsers[newRole],
            isDemo: true,
          })
        }}
      />
    )
  }

  if (isRegistering) {
    return (
      <RegisterPage
        onBackToLogin={() => setIsRegistering(false)}
        onRegistered={(result) => {
          sessionStorage.setItem('pediacare.token', result.token)
          setSession({ token: result.token, user: result.user })
        }}
      />
    )
  }

  return (
    <main className="access-page">
      <AccessBrandPanel />

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__inner">
          <div className="login-panel__topline">
            <span className="login-panel__mobile-brand">
              <span className="brand__mark" aria-hidden="true">
                <img src="/LogoPC.png" alt="" />
              </span>
              PediaCare<span>+</span>
            </span>
            <span className="login-panel__context">PORTAL DE ACCESO</span>
          </div>

          <div className="login-heading">
            <p className="login-heading__eyebrow">BIENVENIDO/A</p>
            <h2 id="login-title">Iniciar sesión</h2>
            <p>Ingresá con tu cuenta personal o explorá las vistas del proyecto.</p>
          </div>

          {/* Selector Rápido para evaluación de las vistas del PDF */}
          <div className="demo-access-box">
            <div className="demo-access-header">
              <Sparkles size={16} />
              <span>EXPLORAR VISTAS DE USUARIOS (PDF MODELADO)</span>
            </div>
            <p className="demo-access-desc">
              Hacé clic en cualquier rol para interactuar directamente con sus historias de usuario:
            </p>
            <div className="demo-access-buttons">
              <button
                type="button"
                className="demo-role-card"
                onClick={() => handleStartDemo('MEDICO')}
              >
                <div className="demo-role-card__icon">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <strong>Médico</strong>
                  <small>HU 1, 2, 3 · Consultas y Fichas</small>
                </div>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="demo-role-card"
                onClick={() => handleStartDemo('ENFERMERO')}
              >
                <div className="demo-role-card__icon demo-role-card__icon--nurse">
                  <Pill size={18} />
                </div>
                <div>
                  <strong>Enfermería</strong>
                  <small>HU 5, 2, 3 · Medicación y Alertas</small>
                </div>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="demo-role-card"
                onClick={() => handleStartDemo('PADRE_MADRE')}
              >
                <div className="demo-role-card__icon demo-role-card__icon--family">
                  <Users size={18} />
                </div>
                <div>
                  <strong>Padre / Madre</strong>
                  <small>HU 4, 2 · Turnos y Notificaciones</small>
                </div>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="login-divider">
            <span>O INGRESAR CON CREDENCIALES</span>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="field-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-shell">
                <Mail className="input-shell__icon" size={18} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-shell">
                <LockKeyhole className="input-shell__icon" size={18} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && <p className="login-message" role="alert">{loginError}</p>}

            <button className="login-button" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Ingresando…' : 'Ingresar'}</span>
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </form>

          <p className="login-panel__note">
            Cada adulto accede con su propia cuenta.
          </p>
          <button className="access-switch" onClick={() => setIsRegistering(true)} type="button">
            ¿Todavía no tenés cuenta? <span>Crear cuenta</span>
          </button>
        </div>

        <footer className="login-panel__footer">
          <span>© 2026 PediaCare+ · Proyecto Modelado de Software</span>
          <span>Atención pediátrica integral</span>
        </footer>
      </section>
    </main>
  )
}

export default App
