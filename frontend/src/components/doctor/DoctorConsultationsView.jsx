import { useState } from 'react'
import {
  CalendarDays,
  Clock,
  Edit2,
  FileText,
  Plus,
  Search,
  Trash2,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Stethoscope,
  Info,
} from 'lucide-react'

export default function DoctorConsultationsView({
  consultations,
  patients,
  onAddConsultation,
  onUpdateConsultation,
  onDeleteConsultation,
  onViewPatientHistory,
}) {
  const [filterMode, setFilterMode] = useState('today') // 'today' | 'all'
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState(null)
  const [consultationToDelete, setConsultationToDelete] = useState(null)

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '')
  const [motivo, setMotivo] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [indicacionesParaPadres, setIndicacionesParaPadres] = useState('')

  // Resumen mensual calculado (HU 1)
  const totalConsultasMes = consultations.length
  const consultasHoy = consultations.filter((c) => c.esHoy).length
  const pacientesUnicosAtendidos = new Set(consultations.map((c) => c.idPaciente)).size

  // Filtrado de consultas
  const filteredConsultations = consultations.filter((c) => {
    if (filterMode === 'today' && !c.esHoy) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchPatient = c.pacienteNombre?.toLowerCase().includes(term)
      const matchDiag = c.diagnostico?.toLowerCase().includes(term)
      const matchMotivo = c.motivo?.toLowerCase().includes(term)
      return matchPatient || matchDiag || matchMotivo
    }
    return true
  })

  function openCreateModal() {
    setEditingConsultation(null)
    setSelectedPatientId(patients[0]?.id || '')
    setMotivo('')
    setDiagnostico('')
    setTratamiento('')
    setObservaciones('')
    setIndicacionesParaPadres('')
    setIsModalOpen(true)
  }

  function openEditModal(c) {
    setEditingConsultation(c)
    setSelectedPatientId(c.idPaciente)
    setMotivo(c.motivo || '')
    setDiagnostico(c.diagnostico || '')
    setTratamiento(c.tratamiento || '')
    setObservaciones(c.observaciones || '')
    setIndicacionesParaPadres(c.indicacionesParaPadres || '')
    setIsModalOpen(true)
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    const patientObj = patients.find((p) => p.id === Number(selectedPatientId))
    const now = new Date()

    if (editingConsultation) {
      onUpdateConsultation({
        ...editingConsultation,
        idPaciente: Number(selectedPatientId),
        pacienteNombre: patientObj?.nombre || editingConsultation.pacienteNombre,
        motivo,
        diagnostico,
        tratamiento,
        observaciones,
        indicacionesParaPadres,
      })
    } else {
      // Registrar consulta con fecha automática (HU 1)
      const newConsultation = {
        id: Date.now(),
        idPaciente: Number(selectedPatientId),
        pacienteNombre: patientObj?.nombre || 'Paciente',
        idMedico: 1,
        medicoNombre: 'Dra. Lucía Benítez',
        fechaConsulta: now.toISOString(),
        esHoy: true,
        motivo,
        diagnostico,
        tratamiento,
        observaciones,
        indicacionesParaPadres,
      }
      onAddConsultation(newConsultation)
    }

    setIsModalOpen(false)
  }

  return (
    <div className="consultations-view">
      {/* Resumen mensual calculado (HU 1) */}
      <section className="metric-strip" aria-label="Resumen de consultas mensual">
        <div className="metric-item">
          <span>CONSULTAS DEL MES</span>
          <strong>{totalConsultasMes}</strong>
          <small className="metric-item__positive">
            <CheckCircle size={14} /> Resumen acumulado mensual
          </small>
        </div>
        <div className="metric-item">
          <span>CONSULTAS DE HOY</span>
          <strong>{consultasHoy}</strong>
          <small>
            <Clock size={14} /> Jornada actual
          </small>
        </div>
        <div className="metric-item">
          <span>PACIENTES DISTINTOS</span>
          <strong>{pacientesUnicosAtendidos}</strong>
          <small>
            <User size={14} /> En seguimiento clínico
          </small>
        </div>
      </section>

      {/* Barra de herramientas y filtros */}
      <div className="consultations-toolbar">
        <div className="consultations-filters">
          <button
            type="button"
            className={`filter-pill ${filterMode === 'today' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('today')}
          >
            <Clock size={15} />
            Consultas de hoy ({consultasHoy})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterMode === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            <CalendarDays size={15} />
            Todas las consultas ({totalConsultasMes})
          </button>
        </div>

        <div className="consultations-search-wrap">
          <div className="input-shell search-shell">
            <Search size={16} className="input-shell__icon" />
            <input
              type="text"
              placeholder="Buscar por paciente, diagnóstico o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Nueva Consulta</span>
          </button>
        </div>
      </div>

      {/* Lista de Consultas */}
      <div className="consultations-list">
        {filteredConsultations.length === 0 ? (
          <div className="empty-panel">
            <FileText size={32} />
            <h3>No hay consultas registradas</h3>
            <p>
              {filterMode === 'today'
                ? 'No hay consultas registradas para el día de hoy.'
                : 'No se encontraron consultas que coincidan con la búsqueda.'}
            </p>
            <button
              type="button"
              className="action-btn action-btn--primary"
              onClick={openCreateModal}
            >
              <Plus size={16} /> Registrar consulta ahora
            </button>
          </div>
        ) : (
          filteredConsultations.map((c) => (
            <article className="consultation-card" key={c.id}>
              <div className="consultation-card__header">
                <div className="consultation-patient-info">
                  <div className="patient-avatar">
                    {c.pacienteNombre?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3>{c.pacienteNombre}</h3>
                    <div className="consultation-meta">
                      <span>
                        <CalendarDays size={14} />
                        {new Date(c.fechaConsulta).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span>
                        <Clock size={14} />
                        {new Date(c.fechaConsulta).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>Médico: {c.medicoNombre}</span>
                    </div>
                  </div>
                </div>

                <div className="consultation-actions">
                  {onViewPatientHistory && (
                    <button
                      type="button"
                      className="icon-action-btn"
                      title="Ver historial clínico completo"
                      onClick={() => onViewPatientHistory(c.idPaciente)}
                    >
                      <Stethoscope size={16} />
                      <span>Ver historial</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="Editar consulta (HU 1)"
                    onClick={() => openEditModal(c)}
                  >
                    <Edit2 size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn icon-action-btn--danger"
                    title="Eliminar consulta (HU 1)"
                    onClick={() => setConsultationToDelete(c)}
                  >
                    <Trash2 size={16} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              <div className="consultation-card__body">
                <div className="consultation-section">
                  <span className="section-label">Motivo de consulta:</span>
                  <p><strong>{c.motivo}</strong></p>
                </div>

                <div className="consultation-grid-two">
                  <div className="consultation-section highlight-box highlight-box--mint">
                    <span className="section-label">Diagnóstico clínico:</span>
                    <p>{c.diagnostico || 'Sin diagnóstico registrado.'}</p>
                  </div>

                  <div className="consultation-section highlight-box highlight-box--coral">
                    <span className="section-label">Tratamiento e indicaciones médicas:</span>
                    <p>{c.tratamiento || 'Sin tratamiento farmacológico registrado.'}</p>
                  </div>
                </div>

                {c.observaciones && (
                  <div className="consultation-section">
                    <span className="section-label">Observaciones y evolución:</span>
                    <p>{c.observaciones}</p>
                  </div>
                )}

                {c.indicacionesParaPadres && (
                  <div className="consultation-family-notice">
                    <Info size={16} />
                    <div>
                      <strong>Indicaciones compartidas con la familia (Lenguaje claro):</strong>
                      <p>{c.indicacionesParaPadres}</p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal para Crear / Editar Consulta (HU 1) */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div>
                <span className="section-kicker">ATENCIÓN CLÍNICA PEDIÁTRICA</span>
                <h2>{editingConsultation ? 'Editar Consulta Médica' : 'Registrar Nueva Consulta'}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="consultation-form">
              <div className="form-row">
                <label>
                  <span>Paciente *</span>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    disabled={Boolean(editingConsultation)}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (ID #{p.id} · {p.edad})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-info-box">
                  <Clock size={16} />
                  <span>
                    Fecha automática asignada: <strong>Hoy ({new Date().toLocaleDateString('es-AR')})</strong>
                  </span>
                </div>
              </div>

              <label>
                <span>Motivo de consulta *</span>
                <input
                  type="text"
                  placeholder="Ej: Fiebre de 38°C persistente, control de rutina, dolor de oídos..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Diagnóstico médico *</span>
                <textarea
                  rows="2"
                  placeholder="Diagnóstico clínico presuntivo o de certeza..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Tratamiento y prescripción farmacológica</span>
                <textarea
                  rows="3"
                  placeholder="Medicamento, dosis, frecuencia y duración del tratamiento..."
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                />
              </label>

              <label>
                <span>Observaciones clínicas del examen físico</span>
                <textarea
                  rows="2"
                  placeholder="Saturación de oxígeno, auscultación, peso, signos vitales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </label>

              <label>
                <span>Indicaciones para la familia (Lenguaje claro y entendible - HU 4)</span>
                <textarea
                  rows="2"
                  placeholder="Pautas de alarma sencillas para los padres, cuidados en casa..."
                  value={indicacionesParaPadres}
                  onChange={(e) => setIndicacionesParaPadres(e.target.value)}
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
                  {editingConsultation ? 'Guardar Cambios' : 'Registrar Consulta'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para Eliminar Consulta (HU 1) */}
      {consultationToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--small">
            <div className="delete-dialog-content">
              <AlertCircle size={40} className="danger-icon" />
              <h3>¿Eliminar este registro de consulta?</h3>
              <p>
                Se eliminará la consulta del paciente <strong>{consultationToDelete.pacienteNombre}</strong> ({consultationToDelete.motivo}).
                Esta acción no se puede deshacer.
              </p>
              <div className="dialog-buttons">
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setConsultationToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--danger"
                  onClick={() => {
                    onDeleteConsultation(consultationToDelete.id)
                    setConsultationToDelete(null)
                  }}
                >
                  Confirmar Eliminación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
