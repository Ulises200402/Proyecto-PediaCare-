import {
  ArrowRight,
  CalendarDays,
  Eye,
  HeartPulse,
  LockKeyhole,
  Mail,
  Syringe,
} from 'lucide-react'
import './App.css'

const careMoments = [
  { icon: CalendarDays, label: 'Consultas', number: '01' },
  { icon: Syringe, label: 'Vacunación', number: '02' },
  { icon: HeartPulse, label: 'Seguimiento', number: '03' },
]

function App() {
  return (
    <main className="access-page">
      <aside className="brand-panel" aria-label="PediaCare+">
        <header className="brand-panel__header">
          <a className="brand" href="/" aria-label="PediaCare+, inicio">
            <span className="brand__mark" aria-hidden="true">
              <HeartPulse size={22} strokeWidth={1.8} />
            </span>
            <span className="brand__name">
              PediaCare<span>+</span>
            </span>
          </a>
          <span className="brand-panel__edition">SALUD PEDIÁTRICA</span>
        </header>

        <div className="brand-panel__content">
          <p className="eyebrow">
            <span className="eyebrow__line" aria-hidden="true" />
            GESTIÓN PEDIÁTRICA
          </p>
          <h1>Cada etapa, con su historia.</h1>
          <p className="brand-panel__description">
            Un espacio compartido para acompañar el crecimiento y el cuidado de
            cada paciente.
          </p>

          <div className="care-path" aria-label="Áreas de seguimiento">
            {careMoments.map(({ icon: Icon, label, number }) => (
              <div className="care-path__item" key={number}>
                <span className="care-path__icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className="care-path__label">{label}</span>
                <span className="care-path__number">{number}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className="brand-panel__footer">
          <span>Seguimiento pediátrico</span>
          <span className="brand-panel__footer-mark" aria-hidden="true">
            P+
          </span>
        </footer>
      </aside>

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

          <div className="login-form">
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
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                />
                <span className="password-indicator" aria-hidden="true">
                  <Eye size={18} />
                </span>
              </div>
            </div>

            <button className="login-button" type="button">
              <span>Ingresar</span>
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>

          <p className="login-panel__note">
            Cada adulto accede con su propia cuenta.
          </p>
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
