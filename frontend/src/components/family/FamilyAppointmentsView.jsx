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
  onBookAppointment,
  onCancelAppointment,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState(childrenPatients[0]?.id || '')
  const [especialidad, setEspecialidad] = useState('Pediatría General')
  const [fecha, setFecha] = useState('2026-11-05')
  const [hora, setHora] = useState('10:00')
  const [motivo, setMotivo] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const child = childrenPatients.find((c) => c.id === Number(selectedChildId)) || childrenPatients[0]

    const newAppointment = {
      id: Date.now(),
      idPaciente: child.id,
      pacienteNombre: child.nombre,
      idMedico: 1,
      medicoNombre: 'Dra. Lucía Benítez',
      especialidad,
      fechaHora: `${fecha}T${hora}:00`,
      consultorio: 'Consultorio 3 - Pediatría',
      motivo,
      estado: 'Programado',
    }

    onBookAppointment(newAppointment)
    setIsModalOpen(false)
    setMotivo('')
  }

  return (
    <div className="family-appointments-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">GESTIÓN DE TURNOS</span>
          <h2>Turnos de mis Hijos ({appointments.length})</h2>
          <p>Consultá y agendá visitas médicas pediátricas.</p>
        </div>
        <button
          type="button"
          className="action-btn action-btn--primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Solicitar Turno</span>
        </button>
      </div>

      <div className="appointments-list-cards">
        {appointments.length === 0 ? (
          <div className="empty-panel">
            <CalendarDays size={32} />
            <h3>No tenés turnos registrados</h3>
            <p>Podés solicitar un nuevo turno para tu hijo/a cuando lo necesites.</p>
            <button
              type="button"
              className="action-btn action-btn--primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} /> Solicitar Turno Ahora
            </button>
          </div>
        ) : (
          appointments.map((app) => {
            const isAttended = app.estado === 'Atendido'
            const isCancelled = app.estado === 'Cancelado'

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
                    <span>Paciente: <strong>{app.pacienteNombre}</strong></span>
                    <span>{app.consultorio}</span>
                  </div>
                </div>

                {!isAttended && !isCancelled && (
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
      {isModalOpen && (
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
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  required
                >
                  {childrenPatients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.edad})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Especialidad o Profesional *</span>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  required
                >
                  <option value="Pediatría General">Pediatría General (Dra. Lucía Benítez)</option>
                  <option value="Control de Crecimiento y Vacunación">Control de Crecimiento y Vacunación</option>
                  <option value="Neumonología Pediátrica">Neumonología Pediátrica</option>
                  <option value="Dermatología Infantil">Dermatología Infantil</option>
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

              <footer className="modal-footer">
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="action-btn action-btn--primary">
                  Confirmar Solicitud de Turno
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
