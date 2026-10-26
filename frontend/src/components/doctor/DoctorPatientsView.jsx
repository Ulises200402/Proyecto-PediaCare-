import { useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  FileHeart,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  User,
  UsersRound,
  X,
  Phone,
  Activity,
} from 'lucide-react'

export default function DoctorPatientsView({
  patients,
  consultations,
  onAddPatient,
  onUpdatePatient,
  onOpenEmergencyModal,
  selectedPatientIdInitial = null,
  tutors = [],
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activePatientId, setActivePatientId] = useState(
    selectedPatientIdInitial || patients[0]?.id || 1
  )
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)
  const [isEditingPatient, setIsEditingPatient] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Form para nuevo paciente (HU 1)
  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [sexo, setSexo] = useState('Femenino')
  const [idTutor1, setIdTutor1] = useState('')
  const [idTutor2, setIdTutor2] = useState('')
  const [alergias, setAlergias] = useState('')
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState('')

  // Form para editar paciente (HU 1)
  const [editNombre, setEditNombre] = useState('')
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('')
  const [editSexo, setEditSexo] = useState('Femenino')
  const [editIdTutor1, setEditIdTutor1] = useState('')
  const [editIdTutor2, setEditIdTutor2] = useState('')
  const [editAlergias, setEditAlergias] = useState('')
  const [editEnfermedadesCronicas, setEditEnfermedadesCronicas] = useState('')

  // Filtrado HU 2: Buscar paciente por nombre o ID
  const filteredPatients = patients.filter((p) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return p.nombre.toLowerCase().includes(term) || String(p.id).includes(term)
  })

  const currentPatient =
    patients.find((p) => p.id === activePatientId) || filteredPatients[0] || patients[0]

  // Historial clínico ordenado cronológicamente por fecha (HU 2)
  const patientHistory = consultations
    .filter((c) => c.idPaciente === currentPatient?.id)
    .sort((a, b) => new Date(b.fechaConsulta) - new Date(a.fechaConsulta))

  async function handleCreateSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    const newPatient = {
      nombre,
      fechaNacimiento,
      sexo,
      alergias: alergias || 'Sin alergias registradas',
      enfermedadesCronicas: enfermedadesCronicas || 'Ninguna registrada',
      idTutor1: Number(idTutor1),
      idTutor2: idTutor2 ? Number(idTutor2) : null,
    }

    const result = await onAddPatient(newPatient)
    if (!result.ok) {
      setSubmitError(result.error || 'No se pudo crear el paciente.')
      return
    }

    if (result.patient) setActivePatientId(result.patient.id)
    setIsCreatingPatient(false)
    setNombre('')
    setFechaNacimiento('')
    setIdTutor1('')
    setIdTutor2('')
    setAlergias('')
    setEnfermedadesCronicas('')
  }

  function openEditModal(patient) {
    setEditNombre(patient.nombre || '')
    setEditFechaNacimiento(patient.fechaNacimiento || '')
    setEditSexo(patient.sexo || 'Femenino')
    setEditIdTutor1(patient.idTutor1 ? String(patient.idTutor1) : '')
    setEditIdTutor2(patient.idTutor2 ? String(patient.idTutor2) : '')
    setEditAlergias(patient.alergias && patient.alergias !== 'Sin alergias registradas'
      ? patient.alergias : '')
    setEditEnfermedadesCronicas(patient.enfermedadesCronicas
      && patient.enfermedadesCronicas !== 'Ninguna registrada'
      ? patient.enfermedadesCronicas : '')
    setSubmitError('')
    setIsEditingPatient(true)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    const updatedPatient = {
      id: currentPatient.id,
      nombre: editNombre,
      fechaNacimiento: editFechaNacimiento,
      sexo: editSexo,
      alergias: editAlergias || 'Sin alergias registradas',
      enfermedadesCronicas: editEnfermedadesCronicas || 'Ninguna registrada',
      idTutor1: Number(editIdTutor1),
      idTutor2: editIdTutor2 ? Number(editIdTutor2) : null,
    }

    const result = await onUpdatePatient(updatedPatient)
    if (!result.ok) {
      setSubmitError(result.error || 'No se pudo actualizar el paciente.')
      return
    }

    setIsEditingPatient(false)
  }

  return (
    <div className="doctor-patients-layout">
      {/* Columna Izquierda: Buscador de Pacientes y Lista (HU 2) */}
      <aside className="patients-sidebar-panel">
        <div className="panel-title-row">
          <div>
            <span className="section-kicker">DIRECTORIO CLÍNICO</span>
            <h2>Pacientes ({patients.length})</h2>
          </div>
          <button
            type="button"
            className="action-btn action-btn--primary action-btn--small"
            onClick={() => setIsCreatingPatient(true)}
          >
            <Plus size={15} /> Nuevo
          </button>
        </div>

        {/* Buscador de paciente por nombre o ID (HU 2) */}
        <div className="input-shell patients-search-box">
          <Search size={16} className="input-shell__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="patients-list-scroll">
          {filteredPatients.length === 0 ? (
            <div className="empty-panel empty-panel--compact">
              <UsersRound size={22} />
              <p>No se encontraron pacientes para "{searchTerm}"</p>
            </div>
          ) : (
            filteredPatients.map((p) => {
              const isActive = p.id === currentPatient?.id
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`patient-list-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActivePatientId(p.id)}
                >
                  <span className="patient-avatar">
                    {p.nombre.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="patient-list-card__info">
                    <strong>{p.nombre}</strong>
                    <span>
                      #{p.id} · {p.edad || 'Pediátrico'} · {p.sexo}
                    </span>
                    <small className="patient-tutor-name">Tutor: {p.tutor1Nombre}</small>
                  </div>
                  {p.alergias && p.alergias !== 'Sin alergias registradas' && (
                    <span className="patient-alert-indicator" title="Tiene alergias reportadas">
                      !
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Columna Derecha: Ficha Completa del Paciente e Historial Clínico (HU 2 y HU 3) */}
      <section className="patient-detail-view">
        {currentPatient ? (
          <>
            {/* Header del Paciente */}
            <div className="patient-detail-header">
              <div className="patient-detail-identity">
                <div className="patient-avatar-large">
                  {currentPatient.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="patient-detail-topline">
                    <h1>{currentPatient.nombre}</h1>
                    <span className="patient-id-badge">ID #{currentPatient.id}</span>
                    <span className="status-pill status-pill--good">
                      {currentPatient.estadoGeneral || 'Seguimiento al día'}
                    </span>
                  </div>
                  <div className="patient-detail-meta">
                    <span><strong>Edad:</strong> {currentPatient.edad}</span>
                    <span><strong>Nacimiento:</strong> {currentPatient.fechaNacimiento}</span>
                    <span><strong>Sexo:</strong> {currentPatient.sexo}</span>
                    <span><strong>Pediatra:</strong> {currentPatient.pediatraCabecera}</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción del paciente (HU 1 y HU 3) */}
              <div className="patient-detail-actions">
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => openEditModal(currentPatient)}
                  title="Editar datos del paciente (HU 1)"
                >
                  <Pencil size={18} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  className="emergency-trigger-btn"
                  onClick={() => onOpenEmergencyModal(currentPatient.id)}
                  title="Acceso directo a datos críticos de emergencia (HU 3)"
                >
                  <ShieldAlert size={18} />
                  <span>Ficha de Emergencia</span>
                </button>
              </div>
            </div>

            {/* Banner de Datos Críticos visibles sin navegar (HU 3) */}
            <div className="patient-critical-summary-bar">
              <div className="critical-stat critical-stat--danger">
                <AlertTriangle size={18} />
                <div>
                  <span className="critical-label">ALERGIAS REGISTRADAS</span>
                  <strong>{currentPatient.alergias}</strong>
                </div>
              </div>
              <div className="critical-stat critical-stat--warning">
                <Activity size={18} />
                <div>
                  <span className="critical-label">ENFERMEDADES CRÓNICAS</span>
                  <strong>{currentPatient.enfermedadesCronicas}</strong>
                </div>
              </div>
              <div className="critical-stat critical-stat--contact">
                <Phone size={18} />
                <div>
                  <span className="critical-label">CONTACTO TUTOR ({currentPatient.tutor1Nombre})</span>
                  <strong>{currentPatient.tutor1Telefono}</strong>
                </div>
              </div>
            </div>

            {/* Historial Clínico Completo y Ordenado por Fecha (HU 2) */}
            <div className="patient-history-section">
              <div className="panel-title-row">
                <div>
                  <span className="section-kicker">HISTORIA CLÍNICA DIGITAL (HU 2)</span>
                  <h2>Consultas y Evolución Clínica ({patientHistory.length})</h2>
                </div>
              </div>

              {patientHistory.length === 0 ? (
                <div className="empty-panel">
                  <FileHeart size={32} />
                  <h3>Sin consultas previas registradas</h3>
                  <p>Aún no se han registrado consultas médicas para este paciente.</p>
                </div>
              ) : (
                <div className="timeline-history">
                  {patientHistory.map((consult, index) => (
                    <article className="timeline-entry" key={consult.id}>
                      <div className="timeline-marker">
                        <span className="timeline-dot" />
                        {index < patientHistory.length - 1 && <span className="timeline-line" />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <div>
                            <span className="timeline-date">
                              <CalendarDays size={14} />
                              {new Date(consult.fechaConsulta).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                            <h3 className="timeline-title">{consult.motivo}</h3>
                          </div>
                          <span className="doctor-badge">
                            <Stethoscope size={13} /> {consult.medicoNombre}
                          </span>
                        </div>

                        <div className="timeline-body">
                          <div className="timeline-box">
                            <strong>Diagnóstico:</strong>
                            <p>{consult.diagnostico}</p>
                          </div>
                          <div className="timeline-box">
                            <strong>Tratamiento y medicación prescrita:</strong>
                            <p>{consult.tratamiento}</p>
                          </div>
                          {consult.observaciones && (
                            <div className="timeline-box timeline-box--notes">
                              <strong>Observaciones clínicas:</strong>
                              <p>{consult.observaciones}</p>
                            </div>
                          )}
                          {consult.indicacionesParaPadres && (
                            <div className="timeline-box timeline-box--family">
                              <strong>Indicaciones para la familia:</strong>
                              <p>{consult.indicacionesParaPadres}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-panel">
            <User size={36} />
            <p>Seleccioná un paciente de la lista para ver su historia clínica.</p>
          </div>
        )}
      </section>

      {/* Modal para Crear Paciente (HU 1) */}
      {isCreatingPatient && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div>
                <span className="section-kicker">REGISTRO CLÍNICO (HU 1)</span>
                <h2>Crear Nuevo Paciente</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreatingPatient(false)}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} className="patient-form">
              <label>
                <span>Nombre completo del niño/a *</span>
                <input
                  type="text"
                  placeholder="Ej: Mateo Ibañez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </label>

              <div className="form-two-col">
                <label>
                  <span>Fecha de nacimiento *</span>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Sexo *</span>
                  <select value={sexo} onChange={(e) => setSexo(e.target.value)} required>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                    <option value="No especificado">No especificado</option>
                  </select>
                </label>
              </div>

              <div className="form-two-col">
                <label>
                  <span>Tutor 1 (obligatorio) *</span>
                  <select
                    value={idTutor1}
                    onChange={(e) => setIdTutor1(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar tutor…</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}{t.telefono ? ` · ${t.telefono}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Tutor 2 (opcional)</span>
                  <select
                    value={idTutor2}
                    onChange={(e) => setIdTutor2(e.target.value)}
                  >
                    <option value="">Sin segundo tutor</option>
                    {tutors
                      .filter((t) => String(t.id) !== idTutor1)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}{t.telefono ? ` · ${t.telefono}` : ''}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Alergias médicas y alimentarias (HU 3)</span>
                <textarea
                  rows="2"
                  placeholder="Ej: Alergia a Penicilina, Ibuprofeno, huevo, etc. (o 'Ninguna')"
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                />
              </label>

              <label>
                <span>Enfermedades crónicas o antecedentes relevantes</span>
                <textarea
                  rows="2"
                  placeholder="Ej: Asma, cardiopatía congénita, diabetes, etc. (o 'Ninguna')"
                  value={enfermedadesCronicas}
                  onChange={(e) => setEnfermedadesCronicas(e.target.value)}
                />
              </label>

              <footer className="modal-footer">
                {submitError && (
                  <p className="login-message" role="alert" style={{ color: '#c0392b', width: '100%' }}>
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setIsCreatingPatient(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="action-btn action-btn--primary">
                  Registrar Paciente
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Paciente (HU 1) */}
      {isEditingPatient && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div>
                <span className="section-kicker">EDICIÓN CLÍNICA (HU 1)</span>
                <h2>Editar Paciente</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditingPatient(false)}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="patient-form">
              <label>
                <span>Nombre completo del niño/a *</span>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                />
              </label>

              <div className="form-two-col">
                <label>
                  <span>Fecha de nacimiento *</span>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={editFechaNacimiento}
                    onChange={(e) => setEditFechaNacimiento(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Sexo *</span>
                  <select value={editSexo} onChange={(e) => setEditSexo(e.target.value)} required>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                    <option value="No especificado">No especificado</option>
                  </select>
                </label>
              </div>

              <div className="form-two-col">
                <label>
                  <span>Tutor 1 (obligatorio) *</span>
                  <select
                    value={editIdTutor1}
                    onChange={(e) => setEditIdTutor1(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar tutor…</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}{t.telefono ? ` · ${t.telefono}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Tutor 2 (opcional)</span>
                  <select
                    value={editIdTutor2}
                    onChange={(e) => setEditIdTutor2(e.target.value)}
                  >
                    <option value="">Sin segundo tutor</option>
                    {tutors
                      .filter((t) => String(t.id) !== editIdTutor1)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}{t.telefono ? ` · ${t.telefono}` : ''}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Alergias médicas y alimentarias (HU 3)</span>
                <textarea
                  rows="2"
                  placeholder="Ej: Alergia a Penicilina, Ibuprofeno, huevo, etc. (o 'Ninguna')"
                  value={editAlergias}
                  onChange={(e) => setEditAlergias(e.target.value)}
                />
              </label>

              <label>
                <span>Enfermedades crónicas o antecedentes relevantes</span>
                <textarea
                  rows="2"
                  placeholder="Ej: Asma, cardiopatía congénita, diabetes, etc. (o 'Ninguna')"
                  value={editEnfermedadesCronicas}
                  onChange={(e) => setEditEnfermedadesCronicas(e.target.value)}
                />
              </label>

              <footer className="modal-footer">
                {submitError && (
                  <p className="login-message" role="alert" style={{ color: '#c0392b', width: '100%' }}>
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setIsEditingPatient(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="action-btn action-btn--primary">
                  Guardar Cambios
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

