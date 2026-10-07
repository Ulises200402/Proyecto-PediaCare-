import { CalendarDays, HeartPulse, Syringe } from 'lucide-react'

const careMoments = [
  { icon: CalendarDays, label: 'Consultas', number: '01' },
  { icon: Syringe, label: 'Vacunación', number: '02' },
  { icon: HeartPulse, label: 'Seguimiento', number: '03' },
]

export default function AccessBrandPanel() {
  return (
    <aside className="brand-panel" aria-label="PediaCare+">
      <header className="brand-panel__header">
        <a className="brand" href="/" aria-label="PediaCare+, inicio">
          <span className="brand__mark" aria-hidden="true">
            <HeartPulse size={22} strokeWidth={1.8} />
          </span>
          <span className="brand__name">PediaCare<span>+</span></span>
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
        <span className="brand-panel__footer-mark" aria-hidden="true">P+</span>
      </footer>
    </aside>
  )
}