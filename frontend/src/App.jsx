import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
} from 'lucide-react'
import AccessBrandPanel from './components/AccessBrandPanel.jsx'
import AuthenticatedDashboard from './components/AuthenticatedDashboard.jsx'
import RegisterPage from './components/RegisterPage.jsx'
import { getCurrentUser, login } from './services/api.js'
import './App.css'

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

  if (isRestoringSession) {
    return <main className="auth-loading" aria-label="Verificando sesión" />
  }

  if (session) {
    return (
      <AuthenticatedDashboard
        key={session.user.id}
        onLogout={handleLogout}
        token={session.token}
        user={session.user}
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
                <HeartPulse size={20} strokeWidth={1.8} />
              </span>
              PediaCare<span>+</span>
            </span>
            <span className="login-panel__context">PORTAL DE ACCESO</span>
          </div>

          <div className="login-heading">
            <p className="login-heading__eyebrow">BIENVENIDO/A</p>
            <h2 id="login-title">Iniciar sesión</h2>
            <p>Ingresá con tu cuenta personal.</p>
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
          <span>© 2026 PediaCare+</span>
          <span>Atención pediátrica</span>
        </footer>
      </section>
    </main>
  )
}

export default App
