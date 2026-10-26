import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  FileHeart,
  Info,
  Stethoscope,
  Syringe,
} from 'lucide-react'

export default function FamilyMedicalHistoryView({
  childrenPatients,
  consultations,
  vaccines,
}) {
  const [selectedChildId, setSelectedChildId] = useState(childrenPatients[0]?.id || 1)
  const [tab, setTab] = useState('consultas') // 'consultas' | 'vacunas'

  const activeChild = childrenPatients.find((c) => c.id === Number(selectedChildId)) || childrenPatients[0]

  // Consultas del hijo seleccionado
  const childConsultations = consultations.filter((c) => c.idPaciente === activeChild?.id)

  // Vacunas del hijo seleccionado
  const childVaccines = vaccines.filter((v) => v.idPaciente === activeChild?.id)

  return (
    <div className="family-history-view">
      {/* Selector de Hijo */}
      <div className="family-history-topbar">
        <div>
          <span className="section-kicker">HISTORIAL MÉDICO FAMILIAR (HU 4)</span>
          <h2>Historial y Cuidados de Salud</h2>
          <p>Toda la información médica explicada de manera clara y sencilla para la familia.</p>
        </div>

        {childrenPatients.length > 1 && (
          <div className="family-child-selector">
            <span className="selector-label">Viendo a:</span>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
            >
              {childrenPatients.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.edad})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs: Consultas Pediátricas vs Calendario de Vacunación */}
      <div className="consultations-filters">
        <button
          type="button"
          className={`filter-pill ${tab === 'consultas' ? 'is-active' : ''}`}
          onClick={() => setTab('consultas')}
        >
          <Stethoscope size={15} />
          Consultas y Controles ({childConsultations.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${tab === 'vacunas' ? 'is-active' : ''}`}
          onClick={() => setTab('vacunas')}
        >
          <Syringe size={15} />
          Carnet de Vacunación ({childVaccines.length})
        </button>
      </div>

      {tab === 'consultas' ? (
        <div className="family-consultations-list">
          {childConsultations.length === 0 ? (
            <div className="empty-panel">
              <FileHeart size={32} />
              <h3>No hay consultas registradas para {activeChild?.nombre}</h3>
              <p>Las indicaciones que registre el pediatra se mostrarán aquí de forma automática.</p>
            </div>
          ) : (
            childConsultations.map((c) => (
              <article className="family-consultation-card" key={c.id}>
                <header className="family-c-header">
                  <div>
                    <span className="family-c-date">
                      <CalendarDays size={14} />
                      {new Date(c.fechaConsulta).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <h3>{c.motivo}</h3>
                  </div>
                  <span className="doctor-badge">
                    <Stethoscope size={13} /> {c.medicoNombre}
                  </span>
                </header>

                <div className="family-c-body">
                  {/* Resumen en lenguaje claro para padres (HU 4) */}
                  <div className="family-simple-box">
                    <div className="family-simple-box__title">
                      <Info size={16} />
                      <strong>¿Qué dijo el médico? (Explicación para padres):</strong>
                    </div>
                    <p className="family-simple-text">
                      {c.indicacionesParaPadres || c.diagnostico}
                    </p>
                  </div>

                  <div className="family-details-grid">
                    <div className="family-detail-item">
                      <span className="item-label">Diagnóstico médico:</span>
                      <strong>{c.diagnostico}</strong>
                    </div>

                    <div className="family-detail-item">
                      <span className="item-label">Tratamiento o medicamentos recetados:</span>
                      <strong>{c.tratamiento || 'Ningún medicamento indicado.'}</strong>
                    </div>
                  </div>

                  {c.observaciones && (
                    <div className="family-notes-row">
                      <span className="item-label">Evolución observada:</span>
                      <p>{c.observaciones}</p>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        /* Carnet de Vacunación */
        <div className="family-vaccines-view">
          <div className="vaccine-card-grid">
            {childVaccines.map((v) => {
              const isApplied = v.estado === 'Aplicada'
              return (
                <article
                  key={v.id}
                  className={`vaccine-card ${isApplied ? 'vaccine-card--applied' : 'vaccine-card--pending'}`}
                >
                  <div className="vaccine-card__header">
                    <Syringe size={20} className="vaccine-icon" />
                    <div>
                      <h3>{v.nombre}</h3>
                      <span className="vaccine-dose-badge">{v.dosis}</span>
                    </div>
                  </div>

                  <div className="vaccine-card__body">
                    {isApplied ? (
                      <div className="vaccine-applied-info">
                        <CheckCircle2 size={16} className="text-good" />
                        <span>
                          Aplicada el{' '}
                          <strong>
                            {new Date(v.fechaAplicacion).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="vaccine-pending-info">
                        <CalendarDays size={16} className="text-attention" />
                        <span>
                          Fecha recomendada:{' '}
                          <strong>
                            {new Date(v.proximaDosis).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                          {v.diasRestantes ? ` (en ${v.diasRestantes} días)` : ''}
                        </span>
                      </div>
                    )}

                    <p className="vaccine-notes">{v.observaciones}</p>
                  </div>

                  <footer className="vaccine-card__footer">
                    <span className={`status-pill status-pill--${isApplied ? 'good' : 'attention'}`}>
                      {v.estado}
                    </span>
                  </footer>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
