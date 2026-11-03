import { useState } from 'react'
import {
  CalendarDays,
  Clock,
  Plus,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react'

export default function FamilyAppointmentsView({
  appointments,
  childrenPatients,
  doctors = [],
  onBookAppointment,
  onCancelAppointment,
  readOnly = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState(childrenPatients[0]?.id || '')
  const [selectedDoctorId, setSelectedDoctorId] = useState(String(doctors[0]?.id || ''))
  const [fecha, setFecha] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  })
  const [hora, setHora] = useState('10:00')
  const [motivo, setMotivo] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const activeChildId = selectedChildId || String(childrenPatients[0]?.id || '')
  const activeDoctorId = selectedDoctorId || String(doctors[0]?.id || '')
  const doctor = doctors.find((item) => item.id === Number(activeDoctorId))

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const child = childrenPatients.find((c) => c.id === Number(activeChildId)) || childrenPatients[0]
    if (!child || !doctor) {
      setFormError('No hay paciente o profesional disponible para solicitar el turno.')
      return
    }

    const newAppointment = {
      id: Date.now(),
      idPaciente: child.id,
      pacienteNombre: child.nombre,
      pacienteDni: child.dni,
      idMedico: doctor.id,
      medicoNombre: doctor.nombre,
      especialidad: doctor.especialidad,
      fechaHora: `${fecha}T${hora}`,
      consultorio: 'A confirmar',
      motivo,
      estado: 'Programado',
    }

    setIsSaving(true)
    const result = await onBookAppointment(newAppointment)
    setIsSaving(false)
    if (!result?.ok) {
      setFormError(result?.error || 'No se pudo solicitar el turno.')
      return
    }
    setIsModalOpen(false)
    setMotivo('')
  }

  return (
    <div className="family-appointments-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">GESTIÓN DE TURNOS</span>
          <h2>Turnos de mis Hijos ({appointments.length})</h2>
          <p>Solicitá una fecha y profesional; el turno quedará pendiente de confirmación.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={() => setIsModalOpen(true)}
            disabled={!childrenPatients.length || !doctors.length}
          >
            <Plus size={16} />
            <span>Solicitar Turno</span>
          </button>
        )}
      </div>

      <div className="appointments-list-cards">
        {appointments.length === 0 ? (
          <div className="empty-panel">
            <CalendarDays size={32} />
            <h3>No tenés turnos registrados</h3>
            <p>Podés solicitar un nuevo turno para tu hijo/a cuando lo necesites.</p>
            {!readOnly && (
              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={() => setIsModalOpen(true)}
                disabled={!childrenPatients.length || !doctors.length}
              >
                <Plus size={16} /> Solicitar Turno Ahora
              </button>
            )}
          </div>
        ) : (
          appointments.map((app) => {
            const isAttended = app.estado === 'Atendido'
            const isCancelled = app.estado === 'Cancelado'
            const child = childrenPatients.find((patient) => patient.id === app.idPaciente)

            return (
              <article className="family-appointment-card" key={app.id}>
                <div className="family-app-date-block">
                  <span className="family-app-day">
                    {new Date(app.fechaHora).getDate()}
                  </span>
                  <span className="family-app-month">
                    {new Date(app.fechaHora).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                  </span>
                </div>

                <div className="family-app-content">
                  <div className="family-app-top">
                    <h3>{app.motivo}</h3>
                    <span className={`status-pill status-pill--${
                      isAttended ? 'good' : isCancelled ? 'danger' : 'attention'
                    }`}>
                      {app.estado}
                    </span>
                  </div>

                  <p className="family-app-doctor">
                    <Stethoscope size={15} />
                    <span>{app.medicoNombre} · {app.especialidad}</span>
                  </p>

                  <div className="family-app-meta">
                    <span>
                      <Clock size={14} />{' '}
                      {new Date(app.fechaHora).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} hs
                    </span>
                    <span>
                      Paciente: <strong>{app.pacienteNombre}</strong> · DNI {app.pacienteDni || child?.dni || 'pendiente'}
                    </span>
                    <span>{app.consultorio}</span>
                  </div>
                </div>

                {!readOnly && !isAttended && !isCancelled && (
                  <div className="family-app-actions">
                    <button
                      type="button"
                      className="icon-action-btn icon-action-btn--danger"
                      title="Cancelar turno"
                      onClick={() => onCancelAppointment(app.id)}
                    >
                      <XCircle size={16} />
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      {/* Modal Solicitar Turno */}
      {!readOnly && isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div>
                <span className="section-kicker">SOLICITUD DE TURNO</span>
                <h2>Agendar Turno Pediátrico</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="consultation-form">
              <label>
                <span>Hijo/a para el turno *</span>
                <select
                  value={activeChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  required
                >
                  {childrenPatients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.dni || 'DNI pendiente'} · {c.nombre} ({c.edad})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Especialidad o Profesional *</span>
                <select
                  value={activeDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required
                >
                  {doctors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.especialidad} ({item.nombre})
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-two-col">
                <label>
                  <span>Fecha deseada *</span>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Horario preferido *</span>
                  <select value={hora} onChange={(e) => setHora(e.target.value)} required>
                    <option value="09:00">09:00 hs</option>
                    <option value="10:00">10:00 hs</option>
                    <option value="11:30">11:30 hs</option>
                    <option value="14:00">14:00 hs</option>
                    <option value="16:30">16:30 hs</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Motivo del turno o síntoma principal *</span>
                <input
                  type="text"
                  placeholder="Ej: Control rutinario anual, tos persistente, certificados..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </label>

              {formError && <p className="form-error" role="alert">{formError}</p>}

              <footer className="modal-footer">
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="action-btn action-btn--primary" disabled={isSaving}>
                  {isSaving ? 'Enviando…' : 'Solicitar turno'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
