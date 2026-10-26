import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react'

export default function NurseAdministrationsView({ reminders }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Solo dosis administradas
  const administeredReminders = reminders.filter((r) => r.estado === 'Administrada')

  const filtered = administeredReminders.filter((r) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      r.pacienteNombre.toLowerCase().includes(term) ||
      r.medicamento.toLowerCase().includes(term)
    )
  })

  return (
    <div className="nurse-administrations-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">AUDITORÍA Y TRAZABILIDAD CLÍNICA</span>
          <h2>Dosis Administradas ({administeredReminders.length})</h2>
        </div>
      </div>

      <div className="consultations-toolbar">
        <div className="input-shell search-shell">
          <Search size={16} className="input-shell__icon" />
          <input
            type="text"
            placeholder="Buscar por paciente o medicamento administrado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-panel">
        <div className="medication-table">
          <div className="medication-table__head">
            <span>HORA REGISTRADA</span>
            <span>PACIENTE</span>
            <span>MEDICAMENTO Y DOSIS</span>
            <span>ENFERMERO RESPONSABLE</span>
            <span>OBSERVACIÓN</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-panel">
              <CheckCircle2 size={32} />
              <p>No hay administraciones registradas que coincidan con la búsqueda.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div className="medication-table__row" key={item.id}>
                <span className="medication-table__time">
                  <Clock size={14} />
                  {item.fechaHoraAdministrada
                    ? new Date(item.fechaHoraAdministrada).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : item.horario}
                </span>

                <span className="medication-table__patient">
                  <span className="patient-table__avatar">
                    {item.pacienteNombre.slice(0, 2).toUpperCase()}
                  </span>
                  <strong>{item.pacienteNombre}</strong>
                </span>

                <span className="medication-table__drug">
                  <strong>{item.medicamento}</strong>
                  <small>{item.dosis}</small>
                </span>

                <span>{item.enfermero || 'Enf. Lautaro Altamirano'}</span>

                <span className="medication-table__notes">
                  {item.observaciones || 'Administración estándar sin incidencias.'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

