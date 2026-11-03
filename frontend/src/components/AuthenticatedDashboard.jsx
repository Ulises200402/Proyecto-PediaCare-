import { useEffect, useMemo, useState } from 'react'
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
  createMedication,
  createPatient,
  createVaccine,
  assignReminder,
  deleteConsultation,
  deleteVaccine,
  cancelAppointment,
  getAppointmentDoctors,
  getAppointments,
  getConsultations,
  getDoctorMetrics,
  getMedications,
  getNurses,
  getNotifications,
  getNotificationPreferences,
  getPatients,
  getReminders,
  getVaccines,
  markNotificationRead,
  requestAppointment,
  updateAppointmentStatus,
  updateMedication,
  updateConsultation,
  updateReminderStatus,
  updatePatient,
  updateNotificationPreferences,
  updateVaccine,
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
import NurseVaccinesView from './nurse/NurseVaccinesView.jsx'

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
      { icon: Clock3, label: 'Recordatorios' },
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
      { icon: ShieldAlert, label: 'Vacunas' },
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

const demoNurses = [
  { id: 2, nombre: 'Lautaro Altamirano' },
  { id: 3, nombre: 'Sofía Herrera' },
  { id: 4, nombre: 'Camila Ríos' },
]

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
  const [actionError, setActionError] = useState('')
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [emergencyTargetPatientId, setEmergencyTargetPatientId] = useState(null)

  const storagePrefix = `pediacare_${user?.id || 'demo'}`

  // Estados interactivos: datos demo solo en modo demostración, vacíos en sesión real
  const [patients, setPatients] = useState(isDemo ? initialPatients : [])
  const [consultations, setConsultations] = useState(isDemo ? initialConsultations : [])
  const [medications, setMedications] = useState(isDemo ? initialMedications : [])
  const [reminders, setReminders] = useState(() => (
    isDemo
      ? initialReminders.map((reminder, index) => {
          const nurse = demoNurses[index % demoNurses.length]
          return {
            ...reminder,
            idEnfermeroAsignado: nurse.id,
            enfermeroAsignado: nurse.nombre,
          }
        })
      : []
  ))

  const [appointments, setAppointments] = useState(() => {
    if (!isDemo) return []
    try {
      const saved = localStorage.getItem(`${storagePrefix}_appointments`)
      return saved ? JSON.parse(saved) : initialAppointments
    } catch {
      return initialAppointments
    }
  })

  const [vaccines, setVaccines] = useState(isDemo ? initialVaccines : [])

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
  const [nurses, setNurses] = useState(isDemo ? demoNurses : [])
  const [doctors, setDoctors] = useState(isDemo
    ? [{ id: 1, nombre: 'Dra. Lucía Benítez', especialidad: 'Pediatría general' }]
    : [])
  const [doctorMetrics, setDoctorMetrics] = useState(null)
  const demoTutors = useMemo(() => {
    const tutorsById = new Map()
    for (const patient of patients) {
      for (const tutor of [
        {
          id: patient.idTutor1,
          nombre: patient.tutor1Nombre,
          dni: patient.tutor1Dni,
          telefono: patient.tutor1Telefono,
        },
        {
          id: patient.idTutor2,
          nombre: patient.tutor2Nombre,
          dni: patient.tutor2Dni,
          telefono: patient.tutor2Telefono,
        },
      ]) {
        if (tutor.id && tutor.nombre) tutorsById.set(tutor.id, tutor)
      }
    }
    return [...tutorsById.values()]
  }, [patients])

  function reportError(error) {
    setActionError(error?.message || 'No se pudo completar la operación. Intentá nuevamente.')
  }

  // Guardar en localStorage ante cambios
  useEffect(() => {
    if (!isDemo) return
    try {
      localStorage.setItem(`${storagePrefix}_appointments`, JSON.stringify(appointments))
    } catch (error) {
      console.error('No se pudieron guardar los turnos de demostración.', error)
    }
  }, [appointments, storagePrefix, isDemo])

  useEffect(() => {
    if (!isDemo) return
    try {
      localStorage.setItem(`${storagePrefix}_notifications`, JSON.stringify(notifications))
    } catch (error) {
      console.error('No se pudieron guardar las notificaciones de demostración.', error)
    }
  }, [notifications, storagePrefix, isDemo])

  useEffect(() => {
    if (!isDemo) return
    try {
      localStorage.setItem(`${storagePrefix}_notif_settings`, JSON.stringify(notificationSettings))
    } catch (error) {
      console.error('No se pudieron guardar las preferencias de demostración.', error)
    }
  }, [notificationSettings, storagePrefix, isDemo])

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
            grupoSanguineo: p.grupoSanguineo || null,
            tutor1Nombre: p.tutor1Nombre || 'Tutor Responsable',
            tutor1Telefono: p.tutor1Telefono || 'Sin teléfono',
            tutor2Nombre: p.tutor2Nombre || null,
            tutor2Telefono: p.tutor2Telefono || null,
            pediatraCabecera: p.pediatraCabecera || null,
            estadoGeneral: p.estadoGeneral || null,
          }
        })

        setPatients(enrichedData)
      })
      .catch(reportError)

    return () => {
      isCurrent = false
    }
  }, [token, currentRole, user?.name])

  // Cargar consultas de la base de datos si hay token real
  useEffect(() => {
    if (!token || isDemo) return
    getConsultations(token)
      .then(({ data }) => {
        if (data) {
          setConsultations(data.map((consultation) => ({
            ...consultation,
            esHoy: String(consultation.fechaConsulta).slice(0, 10) === getLocalDateString(),
          })))
        }
      })
      .catch(reportError)
  }, [token, isDemo])

  useEffect(() => {
    if (!token || isDemo) return
    getAppointments(token)
      .then(({ data }) => {
        if (data) {
          const formatted = data.map((app) => ({
            ...app,
            esHoy: String(app.fechaHora).slice(0, 10) === getLocalDateString(),
            consultorio: app.consultorio || 'A confirmar',
          }))
          setAppointments(formatted)
        }
      })
      .catch(reportError)
  }, [token, isDemo])

  // Cargar notificaciones de la base de datos si hay token real
  useEffect(() => {
    if (!token || isDemo) return
    getNotifications(token)
      .then(({ data }) => {
        if (data) setNotifications(data)
      })
      .catch(reportError)
  }, [token, isDemo])

  useEffect(() => {
    if (!token || isDemo) return
    getMedications(token)
      .then(({ data }) => setMedications(data || []))
      .catch(reportError)
  }, [token, isDemo])

  useEffect(() => {
    if (!token || isDemo || !['ENFERMERO', 'MEDICO'].includes(currentRole)) return
    getReminders(token)
      .then(({ data }) => {
        const now = new Date()
        setReminders((data || []).map((reminder) => {
          const date = new Date(String(reminder.fechaHoraProgramada).replace(' ', 'T'))
          return {
            ...reminder,
            esAlertaUrgente: reminder.estado === 'Pendiente' &&
              date.toDateString() === now.toDateString() &&
              date.getTime() <= now.getTime() + 60 * 60 * 1000,
          }
        }))
      })
      .catch(reportError)
  }, [token, isDemo, currentRole])

  useEffect(() => {
    if (!token || isDemo || !['ENFERMERO', 'MEDICO'].includes(currentRole)) return
    getNurses(token)
      .then(({ data }) => setNurses(data || []))
      .catch(reportError)
  }, [token, isDemo, currentRole])

  useEffect(() => {
    if (!token || isDemo || currentRole !== 'MEDICO') return
    getDoctorMetrics(token)
      .then(({ data }) => setDoctorMetrics(data))
      .catch(reportError)
  }, [token, isDemo, currentRole])

  useEffect(() => {
    if (!token || isDemo) return
    getVaccines(token)
      .then(({ data }) => setVaccines(data || []))
      .catch(reportError)
  }, [token, isDemo])

  useEffect(() => {
    if (!token || isDemo || currentRole !== 'PADRE_MADRE') return
    getAppointmentDoctors(token)
      .then(({ data }) => setDoctors(data || []))
      .catch(reportError)
  }, [token, isDemo, currentRole])

  useEffect(() => {
    if (!token || isDemo || currentRole !== 'PADRE_MADRE') return
    getNotificationPreferences(token)
      .then(({ data }) => setNotificationSettings(data))
      .catch(reportError)
  }, [token, isDemo, currentRole])

  async function handleMarkNotificationAsRead(id) {
    if (!token) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      return
    }

    try {
      const { data } = await markNotificationRead(token, id)
      if (data) {
        setNotifications((prev) => prev.map((n) => (n.id === data.id ? data : n)))
      }
    } catch (error) {
      reportError(error)
    }
  }

  async function handleUpdateNotificationSettings(settings) {
    if (!token) {
      setNotificationSettings(settings)
      return true
    }
    try {
      const { data } = await updateNotificationPreferences(token, {
        canales: { app: settings.canales.app },
        tipos: settings.tipos,
      })
      setNotificationSettings(data)
      setActionError('')
      return true
    } catch (error) {
      reportError(error)
      return false
    }
  }

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
        indicacionesParaPadres: newConsultation.indicacionesParaPadres,
      })
      setConsultations((prev) => [{ ...data, esHoy: true }, ...prev])
      setActionError('')
    } catch (error) {
      reportError(error)
    }
  }

  async function handleUpdateConsultation(updated, registrationCode) {
    if (!token) {
      setConsultations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      return { ok: true }
    }

    try {
      const { data } = await updateConsultation(token, updated.id, {
        motivo: updated.motivo,
        diagnostico: updated.diagnostico,
        tratamiento: updated.tratamiento,
        observaciones: updated.observaciones,
        indicacionesParaPadres: updated.indicacionesParaPadres,
      }, registrationCode)
      setConsultations((prev) => prev.map((c) => (c.id === data.id ? data : c)))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleDeleteConsultation(id, registrationCode) {
    if (!token) {
      setConsultations((prev) => prev.filter((c) => c.id !== id))
      return { ok: true }
    }

    try {
      await deleteConsultation(token, id, registrationCode)
      setConsultations((prev) => prev.filter((c) => c.id !== id))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
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
        prev.map((app) => (app.id === data.id
          ? { ...app, ...data, esHoy: app.esHoy, consultorio: app.consultorio }
          : app))
      )
      setActionError('')
    } catch (error) {
      reportError(error)
    }
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
        dni: newPatient.dni,
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
        grupoSanguineo: data.grupoSanguineo || null,
        pediatraCabecera: data.pediatraCabecera || null,
        estadoGeneral: data.estadoGeneral || null,
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
        dni: updatedPatient.dni,
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
        grupoSanguineo: data.grupoSanguineo || null,
        pediatraCabecera: data.pediatraCabecera || null,
        estadoGeneral: data.estadoGeneral || null,
      }
      setPatients((prev) => prev.map((p) => (p.id === enriched.id ? enriched : p)))
      return { ok: true, patient: enriched }
    } catch (error) {
      return { ok: false, error: error.details?.join(' ') || error.message }
    }
  }

  async function handleAddMedication(newMed) {
    if (!token) {
      setMedications((prev) => [newMed, ...prev])
      setReminders((prev) => [
        ...newMed.horarios.map((horario, idx) => ({
          ...newMed,
          id: Date.now() + idx,
          horario,
          estado: 'Pendiente',
          fechaHoraAdministrada: null,
          enfermero: null,
          esAlertaUrgente: false,
        })),
        ...prev,
      ])
      return { ok: true }
    }

    try {
      const { data } = await createMedication(token, {
        idPaciente: Number(newMed.idPaciente),
        medicamento: newMed.medicamento,
        dosis: newMed.dosis,
        via: newMed.via,
        frecuencia: newMed.frecuencia,
        horarios: newMed.horarios,
        fechaInicio: newMed.fechaInicio,
        fechaFin: newMed.fechaFin,
        indicaciones: newMed.indicaciones,
      })
      setMedications((prev) => [data, ...prev])
      const { data: updatedReminders } = await getReminders(token)
      setReminders(updatedReminders || [])
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.details?.join(' ') || error.message }
    }
  }

  async function handleUpdateMedication(updatedMedication, registrationCode) {
    if (!token) {
      setMedications((prev) => prev.map((medication) => (
        medication.id === updatedMedication.id ? updatedMedication : medication
      )))
      return { ok: true }
    }
    try {
      const { data } = await updateMedication(token, updatedMedication.id, {
        idPaciente: Number(updatedMedication.idPaciente),
        medicamento: updatedMedication.medicamento,
        dosis: updatedMedication.dosis,
        via: updatedMedication.via,
        frecuencia: updatedMedication.frecuencia,
        horarios: updatedMedication.horarios,
        fechaInicio: updatedMedication.fechaInicio,
        fechaFin: updatedMedication.fechaFin,
        indicaciones: updatedMedication.indicaciones,
        activa: updatedMedication.activa,
      }, registrationCode)
      setMedications((prev) => prev.map((medication) => (
        medication.id === data.id ? data : medication
      )))
      const { data: updatedReminders } = await getReminders(token)
      setReminders(updatedReminders || [])
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.details?.join(' ') || error.message }
    }
  }

  async function handleAdministerDose(reminderId) {
    if (!token) {
      setReminders((prev) => prev.map((reminder) => (
        reminder.id === reminderId
          ? {
              ...reminder,
              estado: 'Administrada',
              fechaHoraAdministrada: new Date().toISOString(),
              esAlertaUrgente: false,
            }
          : reminder
      )))
      return { ok: true }
    }
    try {
      const { data } = await updateReminderStatus(token, reminderId, 'Administrada')
      setReminders((prev) => prev.map((reminder) => (
        reminder.id === data.id ? { ...reminder, ...data, esAlertaUrgente: false } : reminder
      )))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleOmitDose(reminderId, reason) {
    if (!token) {
      setReminders((prev) => prev.map((reminder) => (
        reminder.id === reminderId
          ? { ...reminder, estado: 'Omitida', observaciones: reason, esAlertaUrgente: false }
          : reminder
      )))
      return { ok: true }
    }
    try {
      const { data } = await updateReminderStatus(token, reminderId, 'Omitida', reason)
      setReminders((prev) => prev.map((reminder) => (
        reminder.id === data.id ? { ...reminder, ...data, esAlertaUrgente: false } : reminder
      )))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleAssignReminder(reminderId, assignedNurseId) {
    if (!token) {
      const nurse = nurses.find((item) => item.id === assignedNurseId)
      setReminders((prev) => prev.map((reminder) => (
        reminder.id === reminderId
          ? {
              ...reminder,
              idEnfermeroAsignado: assignedNurseId,
              enfermeroAsignado: nurse?.nombre || 'Sin asignar',
            }
          : reminder
      )))
      return { ok: true }
    }
    try {
      const { data } = await assignReminder(token, reminderId, assignedNurseId)
      setReminders((prev) => prev.map((reminder) => (
        reminder.id === data.id ? { ...reminder, ...data } : reminder
      )))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleCreateVaccine(vaccine) {
    if (!token) {
      const created = { ...vaccine, id: Date.now() }
      setVaccines((prev) => [created, ...prev])
      return { ok: true }
    }
    try {
      const { data } = await createVaccine(token, vaccine)
      setVaccines((prev) => [data, ...prev])
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.details?.join(' ') || error.message }
    }
  }

  async function handleUpdateVaccine(vaccine, registrationCode) {
    if (!token) {
      setVaccines((prev) => prev.map((item) => (item.id === vaccine.id ? vaccine : item)))
      return { ok: true }
    }
    try {
      const { data } = await updateVaccine(token, vaccine.id, vaccine, registrationCode)
      setVaccines((prev) => prev.map((item) => (item.id === data.id ? data : item)))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleDeleteVaccine(vaccineId, registrationCode) {
    if (!token) {
      setVaccines((prev) => prev.filter((item) => item.id !== vaccineId))
      return { ok: true }
    }
    try {
      await deleteVaccine(token, vaccineId, registrationCode)
      setVaccines((prev) => prev.filter((item) => item.id !== vaccineId))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleBookAppointment(newApp) {
    if (!token) {
      setAppointments((prev) => [newApp, ...prev])
      return { ok: true }
    }
    try {
      const { data } = await requestAppointment(token, newApp)
      setAppointments((prev) => [{ ...data, consultorio: 'A confirmar' }, ...prev])
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
  }

  async function handleCancelAppointment(id) {
    if (!token) {
      setAppointments((prev) => prev.map((app) => (
        app.id === id ? { ...app, estado: 'Cancelado' } : app
      )))
      return { ok: true }
    }
    try {
      const { data } = await cancelAppointment(token, id)
      setAppointments((prev) => prev.map((app) => (
        app.id === id ? { ...app, ...data } : app
      )))
      setActionError('')
      return { ok: true }
    } catch (error) {
      reportError(error)
      return { ok: false, error: error.message }
    }
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
  const criticalPatients = patients
    .filter((patient) =>
      [patient.alergias, patient.enfermedadesCronicas].some((value) =>
        typeof value === 'string' && value.trim() && !/^(ninguna|sin\s)/i.test(value.trim())
      )
    )
    .slice(0, 2)
  const visibleNurseReminders = isDemo && currentRole === 'ENFERMERO'
    ? reminders.filter((reminder) => (
        reminder.idEnfermeroAsignado === user?.id || !reminder.idEnfermeroAsignado
      ))
    : reminders
  const todayReminders = visibleNurseReminders.filter((reminder) =>
    reminder.fechaHoraProgramada
      ? String(reminder.fechaHoraProgramada).slice(0, 10) === getLocalDateString()
      : isDemo,
  )
  const nextDoctorAppointment = appointments
    .filter((appointment) =>
      ['Programado', 'Confirmado'].includes(appointment.estado) &&
      new Date(String(appointment.fechaHora).replace(' ', 'T')) >= new Date())
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))[0]
  const todayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

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
              badgeCount = visibleNurseReminders.filter((r) => r.estado === 'Pendiente').length
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
            <span className="workspace-date">Hoy, {todayLabel}</span>
          </div>
          <div className="prototype-notice" role="note">
            <strong>{isDemo ? 'Modo demostración de solo lectura.' : 'Prototipo con datos ficticios.'}</strong>{' '}
            {isDemo
              ? 'Los datos son de muestra y no se pueden modificar.'
              : 'No usar para atención clínica real ni cargar información personal o médica real.'}
          </div>
          {actionError && (
            <div className="form-error" role="alert">
              {actionError}
              <button type="button" onClick={() => setActionError('')} aria-label="Cerrar aviso">×</button>
            </div>
          )}

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
                      <strong>{doctorMetrics?.totalConsultasMes ?? consultations.length}</strong>
                      <small className="metric-item__positive">
                        <Activity size={14} /> Consultas registradas este mes
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>CONSULTAS DE HOY</span>
                      <strong>{doctorMetrics?.consultasHoy ?? todayConsultations.length}</strong>
                      <small>
                        <CalendarDays size={14} /> En consultorio
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>FICHAS CON ALERGIAS</span>
                      <strong>{patients.filter((patient) =>
                        patient.alergias && !/^(ninguna|sin\s)/i.test(patient.alergias.trim())
                      ).length}</strong>
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

                        {criticalPatients.length ? criticalPatients.map((patient, index) => (
                          <button
                            type="button"
                            className="attention-entry"
                            key={patient.id}
                            onClick={() => openEmergency(patient.id)}
                          >
                            <span className={`attention-entry__dot ${index ? 'attention-entry__dot--coral' : ''}`} />
                            <span>
                              <strong>{patient.nombre}</strong>
                              <small>
                                {[patient.alergias, patient.enfermedadesCronicas]
                                  .filter((value) => value && !/^(ninguna|sin\s)/i.test(value.trim()))
                                  .join(' · ')}
                              </small>
                            </span>
                            <ArrowRight size={15} />
                          </button>
                        )) : <p>No hay antecedentes críticos registrados.</p>}

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
                        {nextDoctorAppointment ? (
                          <>
                            <div className="agenda-panel__time">
                              {new Date(nextDoctorAppointment.fechaHora).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <strong>{nextDoctorAppointment.pacienteNombre}</strong>
                            <p>{nextDoctorAppointment.motivo} · {nextDoctorAppointment.estado}</p>
                          </>
                        ) : <p>No hay turnos pendientes.</p>}
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
                  token={token}
                  demoTutors={demoTutors}
                  readOnly={isDemo}
                />
              )}

              {activeTab === 'Agenda' && (
                <DoctorAgendaView
                  appointments={appointments}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  onStartConsultation={(_app) => {
                    setActiveTab('Consultas')
                  }}
                  readOnly={isDemo}
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
                  readOnly={isDemo}
                />
              )}

              {activeTab === 'Recordatorios' && (
                <NurseRemindersView
                  reminders={visibleNurseReminders}
                  patients={patients}
                  nurses={nurses}
                  canAdminister={false}
                  canAssignReminders={!isDemo}
                  onAssignReminder={handleAssignReminder}
                />
              )}

              {activeTab === 'Indicadores' && (
                <DoctorMetricsView
                  consultations={consultations}
                  metrics={doctorMetrics}
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
                      <strong>Control y administración de medicación</strong>
                      <span>
                        Hay {todayReminders.filter((r) => r.estado === 'Pendiente').length} dosis
                        pendientes para el horario actual.
                      </span>
                    </div>
                    <span className="nurse-summary-banner__date">
                      {new Date().getHours() < 12 ? 'TURNO MAÑANA' : new Date().getHours() < 19 ? 'TURNO TARDE' : 'TURNO NOCHE'}
                    </span>
                  </div>

                  <div className="metric-strip metric-strip--nurse">
                    <div className="metric-item">
                      <span>DOSIS DE HOY</span>
                      <strong>{todayReminders.length}</strong>
                      <small>
                        <Pill size={14} /> Programadas para hoy
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>ADMINISTRADAS</span>
                      <strong>{todayReminders.filter((r) => r.estado === 'Administrada').length}</strong>
                      <small className="metric-item__positive">Completadas con éxito</small>
                    </div>
                    <div className="metric-item">
                      <span>PENDIENTES</span>
                      <strong>{todayReminders.filter((r) => r.estado === 'Pendiente').length}</strong>
                      <small className="metric-item__notice">
                        <Clock3 size={14} /> Próxima a aplicar
                      </small>
                    </div>
                    <div className="metric-item">
                      <span>PREVENCIÓN DE ERRORES</span>
                      <strong>{patients.length}</strong>
                      <small className="metric-item__positive">Pacientes disponibles</small>
                    </div>
                  </div>

                  {/* Vista embebida de recordatorios y alertas del turno (HU 5) */}
                  <NurseRemindersView
                    reminders={visibleNurseReminders}
                    patients={patients}
                    nurses={nurses}
                    canAdminister={!isDemo}
                    canAssignReminders={!isDemo}
                    onAssignReminder={handleAssignReminder}
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
                  onUpdateMedication={handleUpdateMedication}
                  onOpenEmergencyModal={openEmergency}
                  readOnly={isDemo}
                />
              )}

              {activeTab === 'Recordatorios' && (
                <NurseRemindersView
                  reminders={visibleNurseReminders}
                  patients={patients}
                  nurses={nurses}
                  canAdminister={!isDemo}
                  canAssignReminders={!isDemo}
                  onAssignReminder={handleAssignReminder}
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
                  token={token}
                  demoTutors={demoTutors}
                  readOnly={isDemo}
                />
              )}

              {activeTab === 'Administraciones' && (
                <NurseAdministrationsView reminders={visibleNurseReminders} />
              )}

              {activeTab === 'Vacunas' && (
                <NurseVaccinesView
                  vaccines={vaccines}
                  patients={patients}
                  onCreateVaccine={handleCreateVaccine}
                  onUpdateVaccine={handleUpdateVaccine}
                  onDeleteVaccine={handleDeleteVaccine}
                  registrationCodeRole={currentRole}
                  readOnly={isDemo}
                />
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
                    accountDni={user?.dni}
                  />
                )}

                {activeTab === 'Mis hijos' && (
                  <FamilyChildrenView
                    childrenPatients={familyChildren}
                    onNavigateToHistory={(childId) => {
                      setSelectedPatientForHistory(childId)
                      setActiveTab('Historial clínico')
                    }}
                    accountDni={user?.dni}
                  />
                )}

                {activeTab === 'Turnos' && (
                  <FamilyAppointmentsView
                    appointments={appointments}
                    childrenPatients={familyChildren}
                    doctors={doctors}
                    onBookAppointment={handleBookAppointment}
                    onCancelAppointment={handleCancelAppointment}
                    readOnly={isDemo}
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
                    onUpdateSettings={handleUpdateNotificationSettings}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    readOnly={isDemo}
                  />
                )}
              </>
            )
          })()}
        </main>
      </div>

      {/* Modal Universal de Emergencia (HU 3) */}
      <EmergencyProfileModal
        key={emergencyTargetPatientId ?? 'all'}
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        patients={patients}
        medications={medications}
        initialPatientId={emergencyTargetPatientId}
      />
    </div>
  )
}
