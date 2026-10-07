import { useEffect, useState } from 'react'
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileHeart,
  HeartPulse,
  Home,
  LogOut,
  Pill,
  Plus,
  UsersRound,
} from 'lucide-react'
import { createPatient, getPatients } from '../services/api.js'

const roleProfiles = {
  MEDICO: {
    roleName: 'Médico',
    area: 'ESPACIO PROFESIONAL',
    overview: 'Resumen de atención',
    description: 'Pacientes vinculados a la atención clínica.',
    patientTab: 'Pacientes',
    nav: [
      { icon: Home, label: 'Resumen' },
      { icon: UsersRound, label: 'Pacientes' },
      { icon: CalendarDays, label: 'Agenda' },
      { icon: ClipboardList, label: 'Consultas' },
      { icon: Activity, label: 'Indicadores' },
    ],
  },
  ENFERMERO: {
    roleName: 'Enfermería',
    area: 'ESPACIO PROFESIONAL',
    overview: 'Seguimiento de pacientes',
    description: 'Pacientes asignados al cuidado de enfermería.',
    patientTab: 'Pacientes',
    nav: [
      { icon: Home, label: 'Resumen' },
      { icon: Pill, label: 'Medicación' },
      { icon: Clock3, label: 'Recordatorios' },
      { icon: UsersRound, label: 'Pacientes' },
      { icon: ClipboardList, label: 'Administraciones' },
    ],
  },
  PADRE_MADRE: {
    roleName: 'Familia',
    area: 'PORTAL FAMILIAR',
    overview: 'Seguimiento de tu familia',
    description: 'Información de los pacientes vinculados a tu cuenta.',
    patientTab: 'Mis hijos',
    nav: [
      { icon: Home, label: 'Resumen' },
      { icon: UsersRound, label: 'Mis hijos' },
      { icon: CalendarDays, label: 'Turnos' },
      { icon: FileHeart, label: 'Historial clínico' },
      { icon: Bell, label: 'Notificaciones' },
    ],
  },
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function displayDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(date)
}

function PatientList({ patients, roleName, onCreate }) {
  return (
    <section className="data-panel authenticated-patients">
      <header className="panel-title-row data-panel__heading">
        <div>
          <span className="section-kicker">DATOS DE LA CUENTA</span>
          <h2>{roleName === 'Familia' ? 'Pacientes vinculados' : 'Pacientes'}</h2>
        </div>
        {onCreate && (
          <button className="patient-create-trigger" onClick={onCreate} type="button">
            <Plus size={16} aria-hidden="true" /> Nuevo paciente
          </button>
        )}
      </header>

      {patients.length === 0 ? (
        <div className="patient-list-empty">
          <UsersRound size={25} aria-hidden="true" />
          <strong>No hay pacientes para mostrar</strong>
          <span>Los registros vinculados a esta cuenta aparecerán aquí.</span>
        </div>
      ) : (
        <div className="authenticated-patient-list">
          {patients.map((patient) => (
            <article className="authenticated-patient-row" key={patient.id}>
              <span className="patient-table__avatar" aria-hidden="true">
                {getInitials(patient.nombre)}
              </span>
              <div className="authenticated-patient-row__name">
                <strong>{patient.nombre}</strong>
                <span>{patient.sexo}</span>
              </div>
              <div className="authenticated-patient-row__date">
                <span>Fecha de nacimiento</span>
                <strong>{displayDate(patient.fechaNacimiento)}</strong>
              </div>
              <span className="authenticated-patient-row__id">#{patient.id}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function PatientCreateForm({ token, onCreated, onCancel }) {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setIsSaving(true)
    setErrorMessage('')

    try {
      const { data } = await createPatient(token, {
        nombre: form.get('nombre'),
        fechaNacimiento: form.get('fechaNacimiento'),
        sexo: form.get('sexo'),
        idTutor1: Number(form.get('idTutor1')),
        idTutor2: form.get('idTutor2') ? Number(form.get('idTutor2')) : null,
        alergias: form.get('alergias'),
        enfermedadesCronicas: form.get('enfermedadesCronicas'),
      })
      onCreated(data)
    } catch (error) {
      setErrorMessage(error.details?.join(' ') || error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="patient-create-panel">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">REGISTRO CLÍNICO</span>
          <h2>Nuevo paciente</h2>
        </div>
        <button className="patient-create-cancel" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>

      <form className="patient-create-form" onSubmit={handleSubmit}>
        <label>
          Nombre completo
          <input autoComplete="off" maxLength="100" name="nombre" required />
        </label>
        <label>
          Fecha de nacimiento
          <input max={new Date().toISOString().slice(0, 10)} name="fechaNacimiento" required type="date" />
        </label>
        <label>
          Sexo
          <select defaultValue="" name="sexo" required>
            <option disabled value="">Seleccionar</option>
            <option>Femenino</option>
            <option>Masculino</option>
            <option>Otro</option>
            <option>No especificado</option>
          </select>
        </label>
        <label>
          ID de tutor principal
          <input min="1" name="idTutor1" required type="number" />
        </label>
        <label>
          ID de segundo tutor (opcional)
          <input min="1" name="idTutor2" type="number" />
        </label>
        <label>
          Alergias
          <textarea name="alergias" rows="2" />
        </label>
        <label className="patient-create-form__wide">
          Enfermedades crónicas
          <textarea name="enfermedadesCronicas" rows="2" />
        </label>
        {errorMessage && <p className="login-message patient-create-form__wide" role="alert">{errorMessage}</p>}
        <button className="login-button patient-create-form__wide" disabled={isSaving} type="submit">
          {isSaving ? 'Guardando…' : 'Guardar paciente'}
          <Plus size={17} aria-hidden="true" />
        </button>
      </form>
    </section>
  )
}

export default function AuthenticatedDashboard({ token, user, onLogout }) {
  const profile = roleProfiles[user.role]
  const [activeTab, setActiveTab] = useState('Resumen')
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)

  useEffect(() => {
    let isCurrent = true
    getPatients(token)
      .then(({ data }) => {
        if (isCurrent) setPatients(data)
      })
      .catch((error) => {
        if (!isCurrent) return
        if (error.status === 401) {
          onLogout()
          return
        }
        setLoadError(error.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => { isCurrent = false }
  }, [onLogout, token])

  if (!profile) {
    return <main className="workspace-content">El rol de esta cuenta no está soportado.</main>
  }

  const patientSection = activeTab === profile.patientTab
  const showCreateForm = user.role === 'MEDICO'
    && patientSection
    && isCreatingPatient

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__brand">
          <span className="brand dashboard-brand">
            <span className="brand__mark" aria-hidden="true"><HeartPulse size={21} /></span>
            <span className="brand__name">PediaCare<span>+</span></span>
          </span>
        </div>
        <div className="workspace-sidebar__section-label">ESPACIO DE TRABAJO</div>
        <nav className="workspace-nav" aria-label="Navegación principal">
          {profile.nav.map(({ icon: Icon, label }) => (
            <button
              aria-current={activeTab === label ? 'page' : undefined}
              className={activeTab === label ? 'workspace-nav__item is-active' : 'workspace-nav__item'}
              key={label}
              onClick={() => { setActiveTab(label); setIsCreatingPatient(false) }}
              type="button"
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="workspace-sidebar__bottom">
          <span className="workspace-sidebar__demo-mark">P+</span>
          <div><strong>Cuenta activa</strong><span>{profile.roleName}</span></div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar authenticated-topbar">
          <span className="workspace-topbar__mobilebrand">
            <span className="brand dashboard-brand">
              <span className="brand__mark" aria-hidden="true"><HeartPulse size={20} /></span>
              <span className="brand__name">PediaCare<span>+</span></span>
            </span>
          </span>
          <div className="workspace-topbar__context">
            <span className="workspace-topbar__area">{profile.area}</span>
            <span className="workspace-topbar__separator">/</span>
            <span>{activeTab}</span>
          </div>
          <div className="workspace-topbar__actions">
            <span className="workspace-user">
              <span className="workspace-user__avatar">{getInitials(user.name)}</span>
              <span className="workspace-user__name">{user.name}</span>
            </span>
            <button className="workspace-exit" onClick={onLogout} type="button">
              <LogOut size={15} aria-hidden="true" /> Cerrar sesión
            </button>
          </div>
        </header>

        <main className="workspace-content">
          <div className="workspace-heading">
            <div>
              <p className="workspace-heading__eyebrow">{profile.roleName}</p>
              <h1>{activeTab === 'Resumen' ? profile.overview : activeTab}</h1>
              <p>{activeTab === 'Resumen' ? profile.description : `Sección de ${activeTab.toLowerCase()}.`}</p>
            </div>
          </div>

          {loadError && <p className="login-message" role="alert">{loadError}</p>}
          {isLoading && <div className="patient-list-state">Cargando pacientes…</div>}

          {!isLoading && (patientSection || activeTab === 'Resumen') && (
            <>
              <PatientList
                onCreate={user.role === 'MEDICO' && patientSection
                  ? () => setIsCreatingPatient(true)
                  : undefined}
                patients={patients}
                roleName={profile.roleName}
              />
              {showCreateForm && (
                <PatientCreateForm
                  token={token}
                  onCancel={() => setIsCreatingPatient(false)}
                  onCreated={(patient) => {
                    setPatients((current) => [...current, patient].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                    setIsCreatingPatient(false)
                  }}
                />
              )}
            </>
          )}

          {!isLoading && !patientSection && activeTab !== 'Resumen' && (
            <section className="section-workspace" aria-label={activeTab}>
              <div className="section-workspace__canvas">
                <span className="section-kicker">{activeTab.toUpperCase()}</span>
                <h2>Sección lista para completar</h2>
                <p>La conexión y las operaciones de esta sección se implementarán en el siguiente módulo.</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}