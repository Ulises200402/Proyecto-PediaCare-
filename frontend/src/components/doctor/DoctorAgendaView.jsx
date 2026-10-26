import { useState } from 'react'
import {
  CalendarDays,
  Clock,
  Check,
  XCircle,
  Stethoscope,
  Filter,
} from 'lucide-react'

export default function DoctorAgendaView({
  appointments,
  onUpdateAppointmentStatus,
  onStartConsultation,
}) {
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'Confirmado' | 'Programado' | 'Atendido'

  const filteredAppointments = appointments.filter((app) => {
    if (filterStatus !== 'ALL' && app.estado !== filterStatus) return false
    return true
  })

  return (
    <div className="agenda-view">
      <div className="agenda-toolbar">
        <div className="agenda-date-selector">
          <CalendarDays size={18} />
          <strong>Agenda del consultorio</strong>
          <span className="agenda-date-badge">Hoy, Miércoles 21 de Octubre</span>
        </div>

        <div className="agenda-status-filters">
          <span className="filter-label"><Filter size={14} /> Filtrar:</span>
          {['ALL', 'Confirmado', 'Programado', 'Atendido', 'Cancelado'].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill ${filterStatus === status ? 'is-active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="agenda-cards-grid">
        {filteredAppointments.length === 0 ? (
          <div className="empty-panel">
            <CalendarDays size={32} />
            <h3>No hay turnos con el filtro seleccionado</h3>
            <p>Los turnos programados para la fecha aparecerán aquí.</p>
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const timeStr = new Date(app.fechaHora).toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const isAttended = app.estado === 'Atendido'
            const isConfirmed = app.estado === 'Confirmado'

            return (
              <article className="appointment-card" key={app.id}>
                <div className="appointment-card__time">
                  <Clock size={16} />
                  <span>{timeStr}</span>
                </div>

                <div className="appointment-card__content">
                  <div className="appointment-card__patient">
                    <span className="patient-avatar">
                      {app.pacienteNombre.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3>{app.pacienteNombre}</h3>
                      <p>{app.motivo}</p>
                    </div>
                  </div>
                  <div className="appointment-card__meta">
                    <span>{app.consultorio}</span>
                    <span className={`status-pill status-pill--${
                      isAttended ? 'good' : isConfirmed ? 'attention' : 'neutral'
                    }`}>
                      {app.estado}
                    </span>
                  </div>
                </div>

                <div className="appointment-card__actions">
                  {!isAttended && (
                    <button
                      type="button"
                      className="action-btn action-btn--primary"
                      onClick={() => onStartConsultation(app)}
                    >
                      <Stethoscope size={15} /> Atender
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      type="button"
                      className="icon-action-btn icon-action-btn--check"
                      title="Marcar como atendido"
                      onClick={() => onUpdateAppointmentStatus(app.id, 'Atendido')}
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {app.estado !== 'Cancelado' && !isAttended && (
                    <button
                      type="button"
                      className="icon-action-btn icon-action-btn--danger"
                      title="Cancelar turno"
                      onClick={() => onUpdateAppointmentStatus(app.id, 'Cancelado')}
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

