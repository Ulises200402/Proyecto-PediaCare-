import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileHeart,
  HeartPulse,
  Home,
  Pill,
  Search,
  ShieldAlert,
  Syringe,
  UsersRound,
} from 'lucide-react'

const profiles = {
  parent: {
    area: 'PORTAL FAMILIAR',
    heading: 'Buen día, Marina',
    description: 'El cuidado de Sofía, organizado en un solo lugar.',
    name: 'Marina Torres',
    initials: 'MT',
    nav: [
      { icon: Home, label: 'Resumen' },
      { icon: UsersRound, label: 'Mis hijos' },
      { icon: CalendarDays, label: 'Turnos' },
      { icon: FileHeart, label: 'Historial clínico' },
      { icon: Bell, label: 'Notificaciones' },
    ],
  },
  doctor: {
    area: 'ESPACIO PROFESIONAL',
    heading: 'Resumen de atención',
    description: 'Seguimiento clínico y actividad del consultorio.',
    name: 'Dra. Lucía Benítez',
    initials: 'LB',
    nav: [
      { icon: Home, label: 'Resumen' },
      { icon: UsersRound, label: 'Pacientes' },
      { icon: CalendarDays, label: 'Agenda' },
      { icon: ClipboardList, label: 'Consultas' },
      { icon: Activity, label: 'Indicadores' },
    ],
  },
  nurse: {
    area: 'ESPACIO PROFESIONAL',
    heading: 'Control de medicación',
    description: 'Dosis programadas y seguimiento de enfermería.',
    name: 'Enf. Tomás Ríos',
    initials: 'TR',
    nav: [
      { icon: Home, label: 'Resumen' },
      { icon: Pill, label: 'Medicación' },
      { icon: Clock3, label: 'Recordatorios' },
      { icon: UsersRound, label: 'Pacientes' },
      { icon: ClipboardList, label: 'Administraciones' },
    ],
  },
}

const roleLabels = { parent: 'Familia', doctor: 'Médico', nurse: 'Enfermería' }

function Brand() {
  return (
    <span className="brand dashboard-brand">
      <span className="brand__mark" aria-hidden="true">
        <HeartPulse size={21} strokeWidth={1.8} />
      </span>
      <span className="brand__name">
        PediaCare<span>+</span>
      </span>
    </span>
  )
}

function DemoRoleSwitcher({ activeRole, roles, onChangeRole }) {
  return (
    <div className="demo-switcher" aria-label="Cambiar vista de demostración">
      {roles.map(({ id, label }) => (
        <button
          aria-pressed={activeRole === id}
          className={activeRole === id ? 'demo-switcher__option is-active' : 'demo-switcher__option'}
          key={id}
          onClick={() => onChangeRole(id)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function DashboardFrame({
  activeTab,
  children,
  onChangeRole,
  onExit,
  onSelectTab,
  role,
  roles,
}) {
  const profile = profiles[role]

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__brand">
          <Brand />
        </div>

        <div className="workspace-sidebar__section-label">ESPACIO DE TRABAJO</div>
        <nav className="workspace-nav" aria-label="Navegación principal">
          {profile.nav.map(({ icon: Icon, label }) => (
            <button
              aria-current={activeTab === label ? 'page' : undefined}
              className={activeTab === label ? 'workspace-nav__item is-active' : 'workspace-nav__item'}
              key={label}
              onClick={() => onSelectTab(label)}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              {role === 'nurse' && label === 'Recordatorios' && (
                <span className="workspace-nav__count">4</span>
              )}
            </button>
          ))}
        </nav>

        <div className="workspace-sidebar__bottom">
          <span className="workspace-sidebar__demo-mark">P+</span>
          <div>
            <strong>Entorno de muestra</strong>
            <span>Datos ficticios</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <span className="workspace-topbar__mobilebrand"><Brand /></span>
          <div className="workspace-topbar__context">
            <span className="workspace-topbar__area">{profile.area}</span>
            <span className="workspace-topbar__separator">/</span>
            <span>{activeTab}</span>
          </div>
          <div className="workspace-topbar__actions">
            <DemoRoleSwitcher
              activeRole={role}
              roles={roles}
              onChangeRole={onChangeRole}
            />
            <span className="workspace-topbar__rule" />
            <span className="workspace-user">
              <span className="workspace-user__avatar">{profile.initials}</span>
              <span className="workspace-user__name">{profile.name}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
            <button className="workspace-exit" onClick={onExit} type="button">
              Volver al acceso
            </button>
          </div>
        </header>

        <main className="workspace-content">
          <div className="workspace-heading">
            <div>
              <p className="workspace-heading__eyebrow">{roleLabels[role]}</p>
              <h1>{activeTab === 'Resumen' ? profile.heading : activeTab}</h1>
              <p>
                {activeTab === 'Resumen'
                  ? profile.description
                  : `${activeTab} · ${roleLabels[role].toLowerCase()}`}
              </p>
            </div>
            <span className="workspace-date">Miércoles, 7 de octubre</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

function ParentOverview({ onNavigate }) {
  return (
    <>
      <section className="patient-banner" aria-label="Paciente seleccionado">
        <span className="patient-banner__avatar">SL</span>
        <div className="patient-banner__identity">
          <span>SEGUIMIENTO DE</span>
          <strong>Sofía León</strong>
          <small>5 años · Próximo control de crecimiento</small>
        </div>
        <span className="patient-banner__status">
          <span /> Seguimiento al día
        </span>
        <button className="patient-banner__select" onClick={() => onNavigate('Mis hijos')} type="button">
          Cambiar paciente <ChevronDown size={15} aria-hidden="true" />
        </button>
      </section>

      <div className="parent-overview-grid">
        <section className="appointment-feature">
          <div className="appointment-feature__topline">
            <span className="section-kicker">PRÓXIMO TURNO</span>
            <span className="appointment-feature__tag">Confirmado</span>
          </div>
          <div className="appointment-feature__date">
            <span className="appointment-feature__day">15</span>
            <span>OCT<br />JUEVES</span>
          </div>
          <div className="appointment-feature__details">
            <h2>Control pediátrico</h2>
            <p>Dra. Lucía Benítez · Pediatría</p>
            <span><Clock3 size={15} aria-hidden="true" /> 10:30 · Consultorio 3</span>
          </div>
          <div className="appointment-feature__footer">
            <span>Centro de Salud Norte</span>
            <button onClick={() => onNavigate('Turnos')} type="button">Ver detalle <ArrowRight size={15} aria-hidden="true" /></button>
          </div>
        </section>

        <section className="vaccine-panel">
          <div className="panel-title-row">
            <div>
              <span className="section-kicker">CALENDARIO DE SALUD</span>
              <h2>Próxima vacuna</h2>
            </div>
            <span className="vaccine-panel__icon"><Syringe size={19} aria-hidden="true" /></span>
          </div>
          <div className="vaccine-panel__name">Refuerzo DTP</div>
          <div className="vaccine-panel__date">14 de noviembre <span>en 38 días</span></div>
          <div className="progress-track"><span /></div>
          <p>Recordatorio activado · App y correo</p>
        </section>

        <section className="care-summary">
          <div className="panel-title-row">
            <div>
              <span className="section-kicker">INFORMACIÓN IMPORTANTE</span>
              <h2>Ficha de Sofía</h2>
            </div>
            <ShieldAlert size={19} aria-hidden="true" />
          </div>
          <div className="care-summary__line">
            <span>Alergias registradas</span>
            <strong>Penicilina</strong>
          </div>
          <div className="care-summary__line">
            <span>Enfermedades crónicas</span>
            <strong>Ninguna registrada</strong>
          </div>
          <p>Información de demostración. No corresponde a un paciente real.</p>
        </section>

        <section className="activity-panel">
          <div className="panel-title-row">
            <div>
              <span className="section-kicker">ACTIVIDAD RECIENTE</span>
              <h2>Últimos movimientos</h2>
            </div>
            <button className="text-action" onClick={() => onNavigate('Historial clínico')} type="button">Ver historial <ArrowRight size={14} /></button>
          </div>
          <div className="activity-row">
            <span className="activity-row__icon"><HeartPulse size={17} /></span>
            <div><strong>Consulta de seguimiento</strong><span>Control general · Dra. Benítez</span></div>
            <time>18 SEP</time>
          </div>
          <div className="activity-row">
            <span className="activity-row__icon activity-row__icon--mint"><Syringe size={17} /></span>
            <div><strong>Vacuna aplicada</strong><span>Triple viral · Dosis 2</span></div>
            <time>02 AGO</time>
          </div>
        </section>
      </div>
    </>
  )
}

const patients = [
  { initials: 'SL', name: 'Sofía León', age: '5 años', detail: 'Control de crecimiento', status: 'Al día', tone: 'good', date: '15 oct' },
  { initials: 'BM', name: 'Benjamín Molina', age: '2 años', detail: 'Seguimiento respiratorio', status: 'Revisar ficha', tone: 'attention', date: 'Hoy, 11:15' },
  { initials: 'VC', name: 'Valentina Cruz', age: '8 años', detail: 'Consulta de rutina', status: 'Al día', tone: 'good', date: 'Hoy, 12:00' },
  { initials: 'TM', name: 'Tomás Méndez', age: '11 meses', detail: 'Control de desarrollo', status: 'Al día', tone: 'good', date: 'Mañana, 09:30' },
]

function DoctorOverview({ onNavigate }) {
  return (
    <>
      <div className="metric-strip">
        <div className="metric-item"><span>CONSULTAS ESTE MES</span><strong>86</strong><small><Activity size={14} /> 12 más que septiembre</small></div>
        <div className="metric-item"><span>TURNOS DE HOY</span><strong>12</strong><small><CalendarDays size={14} /> 3 pendientes</small></div>
        <div className="metric-item"><span>FICHAS POR REVISAR</span><strong>04</strong><small className="metric-item__notice"><ShieldAlert size={14} /> Requieren atención</small></div>
        <div className="metric-item"><span>PACIENTES ACTIVOS</span><strong>128</strong><small><UsersRound size={14} /> En seguimiento</small></div>
      </div>

      <div className="doctor-content-grid">
        <section className="data-panel patient-list-panel">
          <div className="panel-title-row data-panel__heading">
            <div>
              <span className="section-kicker">ATENCIÓN CLÍNICA</span>
              <h2>Pacientes recientes</h2>
            </div>
            <button className="search-control" onClick={() => onNavigate('Pacientes')} type="button" aria-label="Ir a pacientes"><Search size={18} /></button>
          </div>
          <div className="patient-table patient-table--doctor">
            <div className="patient-table__head"><span>PACIENTE</span><span>MOTIVO / PRÓXIMO TURNO</span><span>FICHA</span></div>
            {patients.map((patient) => (
              <div className="patient-table__row" key={patient.name}>
                <span className="patient-table__person"><span className="patient-table__avatar">{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.age}</small></span></span>
                <span className="patient-table__detail"><strong>{patient.detail}</strong><small>{patient.date}</small></span>
                <span className={`status-pill status-pill--${patient.tone}`}>{patient.status}</span>
              </div>
            ))}
          </div>
          <button className="panel-bottom-action" onClick={() => onNavigate('Pacientes')} type="button">Ver todos los pacientes <ArrowRight size={15} /></button>
        </section>

        <aside className="doctor-side-column">
          <section className="attention-panel">
            <div className="panel-title-row">
              <div><span className="section-kicker">REVISIÓN PRIORITARIA</span><h2>Datos críticos</h2></div>
              <ShieldAlert size={19} />
            </div>
            <p>Pacientes con información clínica destacada en sus fichas.</p>
            <div className="attention-entry"><span className="attention-entry__dot" /><span><strong>Benjamín Molina</strong><small>Alergia registrada · revisar antes de la consulta</small></span><ArrowRight size={15} /></div>
            <div className="attention-entry"><span className="attention-entry__dot attention-entry__dot--coral" /><span><strong>Emma Quiroga</strong><small>Enfermedad crónica · ficha actualizada</small></span><ArrowRight size={15} /></div>
            <p className="demo-disclaimer">Datos ficticios de demostración.</p>
          </section>

          <section className="agenda-panel">
            <div className="panel-title-row"><div><span className="section-kicker">MIÉRCOLES 7 OCT</span><h2>Próximo turno</h2></div><CalendarDays size={18} /></div>
            <div className="agenda-panel__time">11:15 <span>en 20 min</span></div>
            <strong>Benjamín Molina</strong>
            <p>Control de seguimiento · Consultorio 3</p>
          </section>
        </aside>
      </div>
    </>
  )
}

const medications = [
  { time: '08:00', initials: 'SL', patient: 'Sofía León', medicine: 'Amoxicilina', dose: '5 ml · cada 8 horas', state: 'Administrada', tone: 'good' },
  { time: '09:00', initials: 'BM', patient: 'Benjamín Molina', medicine: 'Paracetamol', dose: '7 ml · según indicación', state: 'Pendiente', tone: 'attention' },
  { time: '12:00', initials: 'VC', patient: 'Valentina Cruz', medicine: 'Ibuprofeno', dose: '4 ml · cada 8 horas', state: 'Programada', tone: 'neutral' },
  { time: '14:00', initials: 'TM', patient: 'Tomás Méndez', medicine: 'Vitamina D', dose: '1 gota · diaria', state: 'Programada', tone: 'neutral' },
]

function NurseOverview() {
  return (
    <>
      <div className="nurse-summary-banner">
        <div className="nurse-summary-banner__icon"><Clock3 size={21} /></div>
        <div><strong>4 administraciones programadas</strong><span>Hay 1 dosis pendiente de registrar en el turno de la mañana.</span></div>
        <span className="nurse-summary-banner__date">TURNO MAÑANA · 07:00–13:00</span>
      </div>

      <div className="metric-strip metric-strip--nurse">
        <div className="metric-item"><span>DOSIS DE HOY</span><strong>18</strong><small><Pill size={14} /> En todos los pacientes asignados</small></div>
        <div className="metric-item"><span>ADMINISTRADAS</span><strong>11</strong><small className="metric-item__positive">61% completado</small></div>
        <div className="metric-item"><span>PENDIENTES</span><strong>04</strong><small className="metric-item__notice"><Clock3 size={14} /> Próxima: 09:00</small></div>
        <div className="metric-item"><span>INCIDENCIAS</span><strong>01</strong><small>Requiere seguimiento</small></div>
      </div>

      <section className="data-panel medication-panel">
        <div className="panel-title-row data-panel__heading">
          <div><span className="section-kicker">REGISTRO DEL DÍA</span><h2>Plan de medicación</h2></div>
          <span className="date-filter"><CalendarDays size={16} /> Hoy, 7 oct</span>
        </div>
        <div className="medication-table">
          <div className="medication-table__head"><span>HORARIO</span><span>PACIENTE</span><span>MEDICACIÓN</span><span>ESTADO</span></div>
          {medications.map((item) => (
            <div className="medication-table__row" key={`${item.time}-${item.patient}`}>
              <span className="medication-table__time"><Clock3 size={14} />{item.time}</span>
              <span className="medication-table__patient"><span className="patient-table__avatar">{item.initials}</span><strong>{item.patient}</strong></span>
              <span className="medication-table__drug"><strong>{item.medicine}</strong><small>{item.dose}</small></span>
              <span className={`status-pill status-pill--${item.tone}`}>{item.state}</span>
            </div>
          ))}
        </div>
        <div className="medication-panel__footer"><span>Los horarios y pacientes son datos de demostración.</span><span><span className="legend-dot" /> Registro visual</span></div>
      </section>

      <section className="nurse-note">
        <ShieldAlert size={18} aria-hidden="true" />
        <p><strong>Verificación de seguridad</strong><span>Confirmar paciente, medicación, dosis y horario antes de cada administración.</span></p>
      </section>
    </>
  )
}

function SectionWorkspace({ icon: Icon, role, section }) {
  return (
    <section className="section-workspace" aria-label={section}>
      <div className="section-workspace__intro">
        <span className="section-workspace__icon" aria-hidden="true">
          <Icon size={23} strokeWidth={1.8} />
        </span>
        <div>
          <span className="section-kicker">{roleLabels[role].toUpperCase()}</span>
          <h2>{section}</h2>
          <p>Área de trabajo para {section.toLowerCase()}.</p>
        </div>
        <span className="section-workspace__badge">VISTA PREPARADA</span>
      </div>

      <div className="section-workspace__canvas">
        <span className="section-workspace__canvas-icon" aria-hidden="true">
          <Icon size={25} strokeWidth={1.6} />
        </span>
        <span className="section-kicker">{section.toUpperCase()}</span>
        <h2>Sección lista para completar</h2>
        <p>La estructura de esta pestaña ya está creada para sumar su contenido.</p>
      </div>
    </section>
  )
}

export default function RoleDashboard({ role, roles, onChangeRole, onExit }) {
  const [activeTab, setActiveTab] = useState('Resumen')
  const profile = profiles[role]
  const activeSection = profile.nav.find(({ label }) => label === activeTab)
  const overview = activeTab === 'Resumen'

  function selectTab(label) {
    setActiveTab(label)
  }

  return (
    <DashboardFrame
      activeTab={activeTab}
      onChangeRole={onChangeRole}
      onExit={onExit}
      onSelectTab={selectTab}
      role={role}
      roles={roles}
    >
      {overview && role === 'parent' && <ParentOverview onNavigate={selectTab} />}
      {overview && role === 'doctor' && <DoctorOverview onNavigate={selectTab} />}
      {overview && role === 'nurse' && <NurseOverview />}
      {!overview && (
        <SectionWorkspace
          icon={activeSection.icon}
          role={role}
          section={activeTab}
        />
      )}
    </DashboardFrame>
  )
}