import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileHeart,
  Home,
  LogOut,
  Pill,
  Plus,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import {
  createConsultation,
  createPatient,
  deleteConsultation,
  getAppointments,
  getConsultations,
  getPatients,
  getTutors,
  updateAppointmentStatus,
  updateConsultation,
  updatePatient,
} from '../services/api.js'

// Import de vistas modulares según Principios de Diseño (Descomposición y Cohesión)
import EmergencyProfileModal from './common/EmergencyProfileModal.jsx'
import DoctorPatientsView from './doctor/DoctorPatientsView.jsx'
import DoctorConsultationsView from './doctor/DoctorConsultationsView.jsx'
import DoctorAgendaView from './doctor/DoctorAgendaView.jsx'
import DoctorMetricsView from './doctor/DoctorMetricsView.jsx'

import NurseMedicationView from './nurse/NurseMedicationView.jsx'
import NurseRemindersView from './nurse/NurseRemindersView.jsx'
import NurseAdministrationsView from './nurse/NurseAdministrationsView.jsx'

import FamilyOverviewView from './family/FamilyOverviewView.jsx'
import FamilyChildrenView from './family/FamilyChildrenView.jsx'
import FamilyAppointmentsView from './family/FamilyAppointmentsView.jsx'
import FamilyMedicalHistoryView from './family/FamilyMedicalHistoryView.jsx'
import FamilyNotificationsView from './family/FamilyNotificationsView.jsx'

// Datos iniciales ricos de demostración / fallback (HU 1 a HU 5)
import {
  initialPatients,
  initialConsultations,
  initialMedications,
  initialReminders,
  initialAppointments,
  initialVaccines,
  initialNotifications,
  initialNotificationSettings,
} from '../data/initialData.js'

const roleProfiles = {
  MEDICO: {
    roleName: 'Médico',
    area: 'ESPACIO PROFESIONAL',
    overview: 'Resumen de atención pediátrica',
    description: 'Seguimiento clínico, consultas del día y pacientes a cargo.',
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
    overview: 'Seguimiento y control de medicación',
    description: 'Dosis programadas, recordatorios y seguridad farmacológica.',
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
    description: 'Información clínica clara, turnos y notificaciones de tus hijos.',
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

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AuthenticatedDashboard({
  token,
  user,
  onLogout,
  isDemo = false,
  onChangeDemoRole = null,
}) {
  const currentRole = user?.role || 'MEDICO'
  const profile = roleProfiles[currentRole] || roleProfiles.MEDICO

  const [activeTab, setActiveTab] = useState('Resumen')
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [emergencyTargetPatientId, setEmergencyTargetPatientId] = useState(null)

  const storagePrefix = `pediacare_${user?.id || 'demo'}`

  // Estados interactivos: datos demo solo en modo demostración, vacíos en sesión real
  const [patients, setPatients] = useState(isDemo ? initialPatients : [])
  const [consultations, setConsultations] = useState(isDemo ? initialConsultations : [])
  const [medications, setMedications] = useState(isDemo ? initialMedications : [])
  const [reminders, setReminders] = useState(isDemo ? initialReminders : [])

  const [appointments, setAppointments] = useState(() => {
    if (!isDemo) return []
    try {
      const saved = localStorage.getItem(`${storagePrefix}_appointments`)
      return saved ? JSON.parse(saved) : initialAppointments
    } catch {
      return initialAppointments
    }
  })

  const [vaccines] = useState(isDemo ? initialVaccines : [])

  const [notifications, setNotifications] = useState(() => {
    if (!isDemo) return []
    try {
      const saved = localStorage.getItem(`${storagePrefix}_notifications`)
      return saved ? JSON.parse(saved) : initialNotifications
    } catch {
      return initialNotifications
    }
  })

  const [notificationSettings, setNotificationSettings] = useState(() => {
    if (!isDemo) return initialNotificationSettings
    try {
      const saved = localStorage.getItem(`${storagePrefix}_notif_settings`)
      return saved ? JSON.parse(saved) : initialNotificationSettings
    } catch {
      return initialNotificationSettings
    }
  })

  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null)
  const [tutors, setTutors] = useState([])

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_appointments`, JSON.stringify(appointments))
    } catch {}
  }, [appointments, storagePrefix])

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_notifications`, JSON.stringify(notifications))
    } catch {}
  }, [notifications, storagePrefix])

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_notif_settings`, JSON.stringify(notificationSettings))
    } catch {}
  }, [notificationSettings, storagePrefix])

  // Cargar pacientes de la base de datos MySQL si hay token real
  useEffect(() => {
    if (!token) return
    let isCurrent = true

    getPatients(token)
      .then(({ data }) => {
        if (!isCurrent || !data) return
        const enrichedData = data.map((p) => {
          const birthYear = p.fechaNacimiento ? new Date(p.fechaNacimiento).getFullYear() : 2021
          const age = `${Math.max(0, new Date().getFullYear() - birthYear)} años`
          return {
            ...p,
            edad: p.edad || age,
            grupoSanguineo: p.grupoSanguineo || '0+',
            tutor1Nombre: p.tutor1Nombre || 'Tutor Responsable',
            tutor1Telefono: p.tutor1Telefono || 'Sin teléfono',
            tutor2Nombre: p.tutor2Nombre || null,
            tutor2Telefono: p.tutor2Telefono || null,
            pediatraCabecera: p.pediatraCabecera || 'Dra. Lucía Benítez',
            estadoGeneral: p.estadoGeneral || 'Seguimiento al día',
          }
        })

        setPatients(enrichedData)
      })
      .catch(() => {
        // En caso de fallo de red o backend inactivo, mantiene el estado actual
      })

    return () => {
      isCurrent = false
    }
  }, [token, currentRole, user?.name])

  // Cargar consultas de la base de datos si hay token real
  useEffect(() => {
    if (!token || isDemo) return
    getConsultations(token)
      .then(({ data }) => {
        if (data) setConsultations(data)
      })
      .catch(() => {})
  }, [token, isDemo])

  // Cargar tutores (padre/madre) desde la BD para selección en formularios
  useEffect(() => {
    if (!token || currentRole !== 'MEDICO') return
    let isCurrent = true

    getTutors(token)
      .then(({ data }) => {
        if (!isCurrent || !data) return
        setTutors(data)
      })
      .catch(() => {})

    return () => {
      isCurrent = false
    }
  }, [token, currentRole])
  useEffect(() => {
    if (!token || isDemo) return
    getAppointments(token)
      .then(({ data }) => {
        if (data) {
          const formatted = data.map((app) => ({
            ...app,
            esHoy: new Date(app.fechaHora).toDateString() === new Date().toDateString(),
            consultorio: 'Consultorio 1',
          }))
          setAppointments(formatted)
        }
      })
      .catch(() => {})
  }, [token, isDemo])

  // Handlers para HU 1: Consultas y Turnos reales
  async function handleAddConsultation(newConsultation) {
    if (!token) {
      setConsultations((prev) => [newConsultation, ...prev])
      return
    }

    try {
      const { data } = await createConsultation(token, {
        idPaciente: newConsultation.idPaciente,
        motivo: newConsultation.motivo,
        diagnostico: newConsultation.diagnostico,
        tratamiento: newConsultation.tratamiento,
        observaciones: newConsultation.observaciones,
      })
      setConsultations((prev) => [data, ...prev])
    } catch {}
  }

  async function handleUpdateConsultation(updated) {
    if (!token) {
      setConsultations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      return
    }

    try {
      const { data } = await updateConsultation(token, updated.id, {
        motivo: updated.motivo,
        diagnostico: updated.diagnostico,
        tratamiento: updated.tratamiento,
        observaciones: updated.observaciones,
      })
      setConsultations((prev) => prev.map((c) => (c.id === data.id ? data : c)))
    } catch {}
  }

  async function handleDeleteConsultation(id) {
    if (!token) {
      setConsultations((prev) => prev.filter((c) => c.id !== id))
      return
    }

    try {
      await deleteConsultation(token, id)
      setConsultations((prev) => prev.filter((c) => c.id !== id))
    } catch {}
  }

  async function handleUpdateAppointmentStatus(appointmentId, estado) {
    if (!token) {
      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, estado } : app))
      )
      return
    }

    try {
      const { data } = await updateAppointmentStatus(token, appointmentId, estado)
      setAppointments((prev) =>
        prev.map((app) => (app.id === data.id ? { ...data, esHoy: app.esHoy, consultorio: app.consultorio } : app))
      )
    } catch {}
  }

  // Handler para HU 1: Crear Paciente
  async function handleAddPatient(newPatient) {
    if (!token) {
      // Modo demo: solo estado local
      setPatients((prev) => [{ ...newPatient, id: Date.now() }, ...prev])
      return { ok: true }
    }

    try {
      const { data } = await createPatient(token, {
        nombre: newPatient.nombre,
        fechaNacimiento: newPatient.fechaNacimiento,
        sexo: newPatient.sexo,
        idTutor1: Number(newPatient.idTutor1),
        idTutor2: newPatient.idTutor2 ? Number(newPatient.idTutor2) : null,
        alergias: newPatient.alergias,
        enfermedadesCronicas: newPatient.enfermedadesCronicas,
      })
      const birthYear = data.fechaNacimiento
        ? new Date(data.fechaNacimiento).getFullYear()
        : 2021
      const enriched = {
        ...data,
        edad: `${Math.max(0, new Date().getFullYear() - birthYear)} años`,
        grupoSanguineo: data.grupoSanguineo || '0+',
        pediatraCabecera: data.pediatraCabecera || 'Dra. Lucía Benítez',
        estadoGeneral: data.estadoGeneral || 'Seguimiento al día',
      }
      setPatients((prev) => [enriched, ...prev])
      return { ok: true, patient: enriched }
    } catch (error) {
      return { ok: false, error: error.details?.join(' ') || error.message }
    }
  }

  // Handler para HU 1: Editar Paciente (médico)
  async function handleUpdatePatient(updatedPatient) {
    if (!token) {
      setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)))
      return { ok: true }
    }

    try {
      const { data } = await updatePatient(token, updatedPatient.id, {
        nombre: updatedPatient.nombre,
        fechaNacimiento: updatedPatient.fechaNacimiento,
        sexo: updatedPatient.sexo,
        idTutor1: Number(updatedPatient.idTutor1),
        idTutor2: updatedPatient.idTutor2 ? Number(updatedPatient.idTutor2) : null,
        alergias: updatedPatient.alergias,
        enfermedadesCronicas: updatedPatient.enfermedadesCronicas,
      })
      const birthYear = data.fechaNacimiento
        ? new Date(data.fechaNacimiento).getFullYear()
        : 2021
      const enriched = {
        ...data,
        edad: `${Math.max(0, new Date().getFullYear() - birthYear)} años`,
        grupoSanguineo: data.grupoSanguineo || '0+',
        pediatraCabecera: data.pediatraCabecera || 'Dra. Lucía Benítez',
        estadoGeneral: data.estadoGeneral || 'Seguimiento al día',
      }
      setPatients((prev) => prev.map((p) => (p.id === enriched.id ? enriched : p)))
      return { ok: true, patient: enriched }
    } catch (error) {
      return { ok: false, error: error.details?.join(' ') || error.message }
    }
  }

  // Handler para HU 5: Cargar Medicación
  function handleAddMedication(newMed) {
    setMedications((prev) => [newMed, ...prev])

    // Generar recordatorios automáticos según horarios (HU 5)
    const newReminders = newMed.horarios.map((horario, idx) => ({
      id: Date.now() + idx,
      idMedicacion: newMed.id,
      idPaciente: newMed.idPaciente,
      pacienteNombre: newMed.pacienteNombre,
      medicamento: newMed.medicamento,
      dosis: newMed.dosis,
      horario,
      estado: 'Pendiente',
      fechaHoraAdministrada: null,
      enfermero: null,
      observaciones: newMed.indicaciones || 'Toma programada',
      esAlertaUrgente: idx === 0, // La primera dosis queda activa con alerta
    }))

    setReminders((prev) => [...newReminders, ...prev])
  }

  // Handler para HU 5: Administrar Dosis
  function handleAdministerDose(reminderId) {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId
          ? {
              ...r,
              estado: 'Administrada',
              fechaHoraAdministrada: new Date().toISOString(),
              enfermero: 'Enf. Lautaro Altamirano',
              esAlertaUrgente: false,
            }
          : r
      )
    )

    // Enviar notificación a los padres ante administración (HU 4)
    const rem = reminders.find((r) => r.id === reminderId)
    if (rem) {
      const notif = {
        id: Date.now(),
        idPaciente: rem.idPaciente,
        pacienteNombre: rem.pacienteNombre,
        titulo: 'Dosis de medicación administrada',
        mensaje: `Se administró correctamente ${rem.medicamento} (${rem.dosis}) a las ${rem.horario} por enfermería.`,
        tipo: 'medicacion',
        canal: 'SMS',
        leida: false,
        fecha: 'Recién',
      }
      setNotifications((prev) => [notif, ...prev])
    }
  }

  function handleOmitDose(reminderId, reason) {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId
          ? {
              ...r,
              estado: 'Omitida',
              observaciones: `OMITIDA: ${reason}`,
              esAlertaUrgente: false,
            }
          : r
      )
    )
  }

  // Handlers Turnos
  function handleUpdateAppointmentStatus(id, newStatus) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: newStatus } : a))
    )
  }

  function handleBookAppointment(newApp) {
    setAppointments((prev) => [newApp, ...prev])

    // Notificación automática a la familia (HU 4)
    const notif = {
      id: Date.now(),
      idPaciente: newApp.idPaciente,
      pacienteNombre: newApp.pacienteNombre,
      titulo: 'Turno agendado con éxito',
      mensaje: `Turno agendado para el ${new Date(newApp.fechaHora).toLocaleDateString('es-AR')} con ${newApp.medicoNombre} (${newApp.especialidad}).`,
      tipo: 'turno',
      canal: 'APP',
      leida: false,
      fecha: 'Recién',
    }
    setNotifications((prev) => [notif, ...prev])
  }

  function handleCancelAppointment(id) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: 'Cancelado' } : a))
    )
  }

  // Handlers Notificaciones
  function handleMarkNotificationAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
  }

  function openEmergency(patientId = null) {
    setEmergencyTargetPatientId(patientId)
    setIsEmergencyModalOpen(true)
  }

  function navigateToPatientHistory(patientId) {
    setSelectedPatientForHistory(patientId)
    setActiveTab(profile.patientTab)
  }

  // Consultas del día para el médico
  const todayConsultations = consultations.filter((c) => c.esHoy)

  return (
    <div className="workspace">
      {/* Barra Lateral de Navegación */}
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__brand">
          <span className="brand dashboard-brand">
            <span className="brand__mark" aria-hidden="true">
              <img src="/LogoPC.png" alt="" />
            </span>
            <span className="brand__name">
              PediaCare<span>+</span>
            </span>
          </span>
        </div>

        <div className="workspace-sidebar__section-label">ESPACIO DE TRABAJO</div>
        <nav className="workspace-nav" aria-label="Navegación principal">
          {profile.nav.map(({ icon: Icon, label }) => {
            const isActive = activeTab === label
            // Conteo de alertas pendientes
            let badgeCount = null
            if (currentRole === 'ENFERMERO' && label === 'Recordatorios') {
              badgeCount = reminders.filter((r) => r.estado === 'Pendiente').length
            } else if (currentRole === 'PADRE_MADRE' && label === 'Notificaciones') {
              const unread = notifications.filter((n) => !n.leida).length
              if (unread > 0) badgeCount = unread
            }

            return (
              <button
                key={label}
                aria-current={isActive ? 'page' : undefined}
                className={`workspace-nav__item ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(label)}
                type="button"
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                {badgeCount !== null && (
                  <span className="workspace-nav__count">{badgeCount}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Acceso directo permanente a Información Crítica / Ficha de Emergencia (HU 3) */}
        <div className="workspace-sidebar__emergency-trigger">
          <button
            type="button"
            className="sidebar-emergency-btn"
            onClick={() => openEmergency()}
            title="Abrir Perfil Crítico de Emergencia (HU 3)"
          >
            <ShieldAlert size={18} />
            <span>Ficha de Emergencia</span>
          </button>
        </div>

        <div className="workspace-sidebar__bottom">
          <span className="workspace-sidebar__demo-mark">P+</span>
          <div>
            <strong>Cuenta activa</strong>
            <span>{profile.roleName} · {user?.name || 'Usuario'}</span>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="workspace-main">
        {/* Topbar */}
        <header className="workspace-topbar authenticated-topbar">
          <span className="workspace-topbar__mobilebrand">
            <span className="brand dashboard-brand">
              <span className="brand__mark" aria-hidden="true">
                <img src="/LogoPC.png" alt="" />
              </span>
              <span className="brand__name">
                PediaCare<span>+</span>
              </span>
            </span>
          </span>

          <div className="workspace-topbar__context">
            <span className="workspace-topbar__area">{profile.area}</span>
            <span className="workspace-topbar__separator">/</span>
            <span>{activeTab}</span>
          </div>

          <div className="workspace-topbar__actions">
            {/* Botón de Emergencia visible en la cabecera (HU 3: acceso en menos de 3 seg) */}
            <button
              type="button"
              className="topbar-emergency-pill"
              onClick={() => openEmergency()}
            >
              <ShieldAlert size={16} />
              <span>Emergencia</span>
            </button>

            {/* Switcher de Roles si está en modo demostración */}
            {isDemo && onChangeDemoRole && (
              <div className="demo-role-quick-nav">
                <span className="demo-label">Rol:</span>
                <button
                  type="button"
                  className={`demo-btn ${currentRole === 'MEDICO' ? 'is-active' : ''}`}
                  onClick={() => onChangeDemoRole('MEDICO')}
                >
                  Médico
                </button>
                <button
                  type="button"
                  className={`demo-btn ${currentRole === 'ENFERMERO' ? 'is-active' : ''}`}
                  onClick={() => onChangeDemoRole('ENFERMERO')}
                >
                  Enfermería
                </button>
                <button
                  type="button"
                  className={`demo-btn ${currentRole === 'PADRE_MADRE' ? 'is-active' : ''}`}
                  onClick={() => onChangeDemoRole('PADRE_MADRE')}
                >
                  Familia
                </button>
              </div>
            )}

            <span className="workspace-user">
              <span className="workspace-user__avatar">
                {getInitials(user?.name || profile.roleName)}
              </span>
              <span className="workspace-user__name">{user?.name || profile.roleName}</span>
            </span>

            <button className="workspace-exit" onClick={onLogout} type="button">
              <LogOut size={15} aria-hidden="true" />
              <span>{isDemo ? 'Salir del Demo' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </header>

        {/* Cuerpo del Workspace */}
        <main className="workspace-content">
          <div className="workspace-heading">
            <div>
              <p className="workspace-heading__eyebrow">{profile.roleName.toUpperCase()}</p>
              <h1>{activeTab === 'Resumen' ? profile.overview : activeTab}</h1>
              <p>
                {activeTab === 'Resumen'
                  ? profile.description
                  : `Sección interactiva de ${activeTab.toLowerCase()}.`}
              </p>
            </div>
            <span className="workspace-date">Hoy, 21 de Octubre</span>
          </div>

          {/* ========================================================= */}
          {/* VISTAS PARA EL ROL: MÉDICO                                 */}
          {/* ========================================================= */}
          {currentRole === 'MEDICO' && (
            <>
              {activeTab === 'Resumen' && (
                <div className="doctor-overview-wrap">
                  {/* Tira de Métricas y Resumen Mensual (HU 1) */}
                  <div className="metric-strip">
                    <div className="metric-item">
                      <span>CONSULTAS ESTE MES</span>
                      <strong>86</strong>
                      <small className="metric-item__positive">
                        <Activity size={14} /> +12 consultas vs sep
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>CONSULTAS DE HOY</span>
                      <strong>{todayConsultations.length}</strong>
                      <small>
                        <CalendarDays size={14} /> En consultorio
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>FICHAS CON ALERGIAS</span>
                      <strong>03</strong>
                      <small className="metric-item__notice">
                        <ShieldAlert size={14} /> Revisar antes de medicar
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>PACIENTES ACTIVOS</span>
                      <strong>{patients.length}</strong>
                      <small>
                        <UsersRound size={14} /> En seguimiento
                      </small>
                    </div>
                  </div>

                  <div className="doctor-content-grid">
                    {/* Consultas del día (HU 1) */}
                    <section className="data-panel patient-list-panel">
                      <div className="panel-title-row data-panel__heading">
                        <div>
                          <span className="section-kicker">ATENCIÓN CLÍNICA (HU 1)</span>
                          <h2>Consultas de Hoy ({todayConsultations.length})</h2>
                        </div>
                        <button
                          className="action-btn action-btn--primary action-btn--small"
                          onClick={() => setActiveTab('Consultas')}
                          type="button"
                        >
                          <Plus size={15} /> Registrar Consulta
                        </button>
                      </div>

                      <div className="today-consultations-compact">
                        {todayConsultations.map((c) => (
                          <div className="today-c-card" key={c.id}>
                            <div className="today-c-info">
                              <span className="patient-avatar">
                                {c.pacienteNombre.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <strong>{c.pacienteNombre}</strong>
                                <p>{c.motivo}</p>
                                <small>Diagnóstico: {c.diagnostico}</small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="action-btn action-btn--secondary action-btn--small"
                              onClick={() => navigateToPatientHistory(c.idPaciente)}
                            >
                              Ver Historial
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        className="panel-bottom-action"
                        onClick={() => setActiveTab('Consultas')}
                        type="button"
                      >
                        Ver todas las consultas y resumen <ArrowRight size={15} />
                      </button>
                    </section>

                    {/* Columna lateral: Datos Críticos y Próximo Turno */}
                    <aside className="doctor-side-column">
                      <section className="attention-panel">
                        <div className="panel-title-row">
                          <div>
                            <span className="section-kicker">INFORMACIÓN CRÍTICA (HU 3)</span>
                            <h2>Alertas Rápidas</h2>
                          </div>
                          <ShieldAlert size={19} />
                        </div>
                        <p>Pacientes con antecedentes y alergias de riesgo.</p>

                        <div
                          className="attention-entry"
                          onClick={() => openEmergency(1)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="attention-entry__dot" />
                          <span>
                            <strong>Sofía León</strong>
                            <small>Alergia severa a Penicilina</small>
                          </span>
                          <ArrowRight size={15} />
                        </div>

                        <div
                          className="attention-entry"
                          onClick={() => openEmergency(2)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="attention-entry__dot attention-entry__dot--coral" />
                          <span>
                            <strong>Benjamín Molina</strong>
                            <small>Alergia a Ibuprofeno · Asma bronquial</small>
                          </span>
                          <ArrowRight size={15} />
                        </div>

                        <button
                          type="button"
                          className="sidebar-emergency-btn"
                          style={{ marginTop: '1rem', width: '100%' }}
                          onClick={() => openEmergency()}
                        >
                          <ShieldAlert size={16} /> Ver Ficha de Emergencia Completa
                        </button>
                      </section>

                      <section className="agenda-panel">
                        <div className="panel-title-row">
                          <div>
                            <span className="section-kicker">AGENDA</span>
                            <h2>Próximo turno</h2>
                          </div>
                          <CalendarDays size={18} />
                        </div>
                        <div className="agenda-panel__time">11:15</div>
                        <strong>Benjamín Molina</strong>
                        <p>Control respiratorio · Consultorio 3</p>
                      </section>
                    </aside>
                  </div>
                </div>
              )}

              {activeTab === 'Pacientes' && (
                <DoctorPatientsView
                  patients={patients}
                  consultations={consultations}
                  onAddPatient={handleAddPatient}
                  onUpdatePatient={handleUpdatePatient}
                  onOpenEmergencyModal={openEmergency}
                  selectedPatientIdInitial={selectedPatientForHistory}
                  tutors={tutors}
                />
              )}

              {activeTab === 'Agenda' && (
                <DoctorAgendaView
                  appointments={appointments}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  onStartConsultation={(_app) => {
                    setActiveTab('Consultas')
                  }}
                />
              )}

              {activeTab === 'Consultas' && (
                <DoctorConsultationsView
                  consultations={consultations}
                  patients={patients}
                  onAddConsultation={handleAddConsultation}
                  onUpdateConsultation={handleUpdateConsultation}
                  onDeleteConsultation={handleDeleteConsultation}
                  onViewPatientHistory={navigateToPatientHistory}
                />
              )}

              {activeTab === 'Indicadores' && (
                <DoctorMetricsView
                  consultations={consultations}
                  patients={patients}
                  token={token}
                  isDemo={isDemo}
                />
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* VISTAS PARA EL ROL: ENFERMERO                              */}
          {/* ========================================================= */}
          {currentRole === 'ENFERMERO' && (
            <>
              {activeTab === 'Resumen' && (
                <div className="nurse-overview-wrap">
                  {/* Banner de seguridad */}
                  <div className="nurse-summary-banner">
                    <div className="nurse-summary-banner__icon">
                      <Clock3 size={21} />
                    </div>
                    <div>
                      <strong>Turno Mañana · Control y Administración Farmacológica</strong>
                      <span>
                        Hay {reminders.filter((r) => r.estado === 'Pendiente').length} dosis
                        pendientes para el horario actual.
                      </span>
                    </div>
                    <span className="nurse-summary-banner__date">TURNO MAÑANA</span>
                  </div>

                  <div className="metric-strip metric-strip--nurse">
                    <div className="metric-item">
                      <span>DOSIS DE HOY</span>
                      <strong>{reminders.length}</strong>
                      <small>
                        <Pill size={14} /> Total programadas
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>ADMINISTRADAS</span>
                      <strong>{reminders.filter((r) => r.estado === 'Administrada').length}</strong>
                      <small className="metric-item__positive">Completadas con éxito</small>
                    </div>
                    <div className="metric-item">
                      <span>PENDIENTES</span>
                      <strong>{reminders.filter((r) => r.estado === 'Pendiente').length}</strong>
                      <small className="metric-item__notice">
                        <Clock3 size={14} /> Próxima a aplicar
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>PREVENCIÓN DE ERRORES</span>
                      <strong>Activa</strong>
                      <small className="metric-item__positive">5 correctos validados</small>
                    </div>
                  </div>

                  {/* Vista embebida de recordatorios y alertas del turno (HU 5) */}
                  <NurseRemindersView
                    reminders={reminders}
                    onAdministerDose={handleAdministerDose}
                    onOmitDose={handleOmitDose}
                    onOpenEmergencyModal={openEmergency}
                  />
                </div>
              )}

              {activeTab === 'Medicación' && (
                <NurseMedicationView
                  medications={medications}
                  patients={patients}
                  onAddMedication={handleAddMedication}
                  onOpenEmergencyModal={openEmergency}
                />
              )}

              {activeTab === 'Recordatorios' && (
                <NurseRemindersView
                  reminders={reminders}
                  onAdministerDose={handleAdministerDose}
                  onOmitDose={handleOmitDose}
                  onOpenEmergencyModal={openEmergency}
                />
              )}

              {activeTab === 'Pacientes' && (
                <DoctorPatientsView
                  patients={patients}
                  consultations={consultations}
                  onAddPatient={handleAddPatient}
                  onUpdatePatient={handleUpdatePatient}
                  onOpenEmergencyModal={openEmergency}
                  selectedPatientIdInitial={selectedPatientForHistory}
                  tutors={tutors}
                />
              )}

              {activeTab === 'Administraciones' && (
                <NurseAdministrationsView reminders={reminders} />
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* VISTAS PARA EL ROL: PADRE / MADRE (FAMILIA)                */}
          {/* ========================================================= */}
          {currentRole === 'PADRE_MADRE' && (() => {
            const familyChildren = token ? patients : (isDemo ? patients.slice(0, 2) : patients)

            return (
              <>
                {activeTab === 'Resumen' && (
                  <FamilyOverviewView
                    childrenPatients={familyChildren}
                    appointments={appointments}
                    vaccines={vaccines}
                    consultations={consultations}
                    onNavigate={setActiveTab}
                    tutorId={user?.id}
                  />
                )}

                {activeTab === 'Mis hijos' && (
                  <FamilyChildrenView
                    childrenPatients={familyChildren}
                    onNavigateToHistory={(childId) => {
                      setSelectedPatientForHistory(childId)
                      setActiveTab('Historial clínico')
                    }}
                    tutorId={user?.id}
                  />
                )}

                {activeTab === 'Turnos' && (
                  <FamilyAppointmentsView
                    appointments={appointments}
                    childrenPatients={familyChildren}
                    onBookAppointment={handleBookAppointment}
                    onCancelAppointment={handleCancelAppointment}
                  />
                )}

                {activeTab === 'Historial clínico' && (
                  <FamilyMedicalHistoryView
                    childrenPatients={familyChildren}
                    consultations={consultations}
                    vaccines={vaccines}
                  />
                )}

                {activeTab === 'Notificaciones' && (
                  <FamilyNotificationsView
                    notifications={notifications}
                    notificationSettings={notificationSettings}
                    onUpdateSettings={setNotificationSettings}
                    onMarkAsRead={handleMarkNotificationAsRead}
                  />
                )}
              </>
            )
          })()}
        </main>
      </div>

      {/* Modal Universal de Emergencia (HU 3) */}
      <EmergencyProfileModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        patients={patients}
        initialPatientId={emergencyTargetPatientId}
      />
    </div>
  )
}
