import { useState } from 'react'
import {
  Clock,
  Pill,
  Plus,
  Search,
  ShieldAlert,
  X,
  AlertTriangle,
} from 'lucide-react'

export default function NurseMedicationView({
  medications,
  patients,
  onAddMedication,
  onOpenEmergencyModal,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states para Cargar Medicación (HU 5)
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '')
  const [medicamento, setMedicamento] = useState('')
  const [dosis, setDosis] = useState('')
  const [via, setVia] = useState('Oral')
  const [frecuencia, setFrecuencia] = useState('Cada 8 horas')
  const [horariosStr, setHorariosStr] = useState('08:00, 16:00, 00:00')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10))
  const [fechaFin, setFechaFin] = useState('')
  const [indicaciones, setIndicaciones] = useState('')

  const filteredMedications = medications.filter((m) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      m.medicamento.toLowerCase().includes(term) ||
      m.pacienteNombre.toLowerCase().includes(term)
    )
  })

  // Obtener advertencia si el paciente tiene alergias
  const currentPatientObj = patients.find((p) => p.id === Number(selectedPatientId))

  function handleFormSubmit(e) {
    e.preventDefault()
    const patientObj = patients.find((p) => p.id === Number(selectedPatientId))
    const parsedHorarios = horariosStr.split(',').map((h) => h.trim()).filter(Boolean)

    const newMed = {
      id: Date.now(),
      idPaciente: Number(selectedPatientId),
      pacienteNombre: patientObj?.nombre || 'Paciente',
      medicamento,
      dosis,
      via,
      frecuencia,
      horarios: parsedHorarios,
      fechaInicio,
      fechaFin: fechaFin || null,
      indicaciones,
      estado: 'Activa',
      idEnfermero: 2,
      enfermeroNombre: 'Enf. Lautaro Altamirano',
    }

    onAddMedication(newMed)
    setIsModalOpen(false)

    // Reset
    setMedicamento('')
    setDosis('')
    setIndicaciones('')
  }

  // Actualizar horarios sugeridos según la frecuencia seleccionada
  function handleFrecuenciaChange(val) {
    setFrecuencia(val)
    if (val === 'Cada 6 horas') setHorariosStr('06:00, 12:00, 18:00, 00:00')
    else if (val === 'Cada 8 horas') setHorariosStr('08:00, 16:00, 00:00')
    else if (val === 'Cada 12 horas') setHorariosStr('08:00, 20:00')
    else if (val === 'Diaria (cada 24 horas)') setHorariosStr('09:00')
  }

  return (
    <div className="nurse-medication-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">CONTROL FARMACOLÓGICO</span>
          <h2>Planes de Medicación Activos ({medications.length})</h2>
        </div>
        <button
          type="button"
          className="action-btn action-btn--primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Cargar Medicación</span>
        </button>
      </div>

      <div className="consultations-toolbar">
        <div className="input-shell search-shell">
          <Search size={16} className="input-shell__icon" />
          <input
            type="text"
            placeholder="Buscar por fármaco o nombre de paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="medication-cards-grid">
        {filteredMedications.length === 0 ? (
          <div className="empty-panel">
            <Pill size={32} />
            <h3>No se encontraron esquemas de medicación</h3>
            <p>Hacé clic en "Cargar Medicación" para registrar un nuevo tratamiento.</p>
          </div>
        ) : (
          filteredMedications.map((med) => {
            const patientData = patients.find((p) => p.id === med.idPaciente)
            const hasAllergy = patientData?.alergias && patientData.alergias !== 'Sin alergias registradas'

            return (
              <article className="med-plan-card" key={med.id}>
                <div className="med-plan-card__header">
                  <div className="med-plan-patient">
                    <span className="patient-avatar">
                      {med.pacienteNombre.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <strong>{med.pacienteNombre}</strong>
                      <small>#{med.idPaciente} · Vía {med.via}</small>
                    </div>
                  </div>
                  <span className="status-pill status-pill--good">
                    {med.estado}
                  </span>
                </div>

                <div className="med-plan-body">
                  <div className="med-title-row">
                    <Pill size={18} className="med-icon" />
                    <div>
                      <h3>{med.medicamento}</h3>
                      <p className="med-dose">Dosis: <strong>{med.dosis}</strong></p>
                    </div>
                  </div>

                  <div className="med-schedule-strip">
                    <Clock size={15} />
                    <span>Frecuencia: <strong>{med.frecuencia}</strong></span>
                  </div>

                  <div className="med-hours-list">
                    <span className="med-hours-label">Horarios programados:</span>
                    <div className="med-hour-badges">
                      {med.horarios?.map((h) => (
                        <span key={h} className="hour-badge">{h}</span>
                      ))}
                    </div>
                  </div>

                  {hasAllergy && (
                    <div className="med-allergy-notice">
                      <AlertTriangle size={15} />
                      <span>Atención: Alergia en ficha ({patientData.alergias})</span>
                    </div>
                  )}

                  {med.indicaciones && (
                    <p className="med-notes">
                      <em>Indicaciones:</em> {med.indicaciones}
                    </p>
                  )}
                </div>

                <div className="med-plan-footer">
                  <span>Cargado por: {med.enfermeroNombre || 'Enfermería'}</span>
                  {onOpenEmergencyModal && (
                    <button
                      type="button"
                      className="text-action text-action--danger"
                      onClick={() => onOpenEmergencyModal(med.idPaciente)}
                    >
                      <ShieldAlert size={14} /> Ficha Crítica
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Modal Cargar Medicación (HU 5) */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div>
                <span className="section-kicker">ENFERMERÍA · HU 5</span>
                <h2>Cargar Nueva Medicación</h2>
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
              <label>
                <span>Paciente pediátrico *</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (ID #{p.id} · {p.edad})
                    </option>
                  ))}
                </select>
              </label>

              {currentPatientObj?.alergias && currentPatientObj.alergias !== 'Sin alergias registradas' && (
                <div className="allergy-warning-box">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>ALERTA DE ALERGIAS DEL PACIENTE:</strong>
                    <p>{currentPatientObj.alergias}</p>
                  </div>
                </div>
              )}

              <div className="form-two-col">
                <label>
                  <span>Nombre del medicamento *</span>
                  <input
                    type="text"
                    placeholder="Ej: Amoxicilina suspensión, Paracetamol jarabe..."
                    value={medicamento}
                    onChange={(e) => setMedicamento(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Dosis exacta *</span>
                  <input
                    type="text"
                    placeholder="Ej: 5 ml (250 mg), 1 gota, 1 comprimido..."
                    value={dosis}
                    onChange={(e) => setDosis(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-two-col">
                <label>
                  <span>Vía de administración *</span>
                  <select value={via} onChange={(e) => setVia(e.target.value)} required>
                    <option value="Oral">Oral (Jarabe / Gotas / Suspensión)</option>
                    <option value="Inhalatoria">Inhalatoria (Aerosol / Nebulización)</option>
                    <option value="Intravenosa">Intravenosa (IV)</option>
                    <option value="Intramuscular">Intramuscular (IM)</option>
                    <option value="Tópica">Tópica</option>
                    <option value="Rectal">Rectal</option>
                  </select>
                </label>

                <label>
                  <span>Frecuencia *</span>
                  <select
                    value={frecuencia}
                    onChange={(e) => handleFrecuenciaChange(e.target.value)}
                    required
                  >
                    <option value="Cada 6 horas">Cada 6 horas (4 tomas)</option>
                    <option value="Cada 8 horas">Cada 8 horas (3 tomas)</option>
                    <option value="Cada 12 horas">Cada 12 horas (2 tomas)</option>
                    <option value="Diaria (cada 24 horas)">Diaria (1 toma)</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Horarios definidos (separados por coma) *</span>
                <input
                  type="text"
                  placeholder="08:00, 16:00, 00:00"
                  value={horariosStr}
                  onChange={(e) => setHorariosStr(e.target.value)}
                  required
                />
              </label>

              <div className="form-two-col">
                <label>
                  <span>Fecha de inicio *</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Fecha fin de tratamiento (opcional)</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </label>
              </div>

              <label>
                <span>Indicaciones y precauciones especiales</span>
                <textarea
                  rows="2"
                  placeholder="Tomar con agua, antes de comidas, controlar temperatura..."
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
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
                  Guardar Medicación y Generar Recordatorios
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

