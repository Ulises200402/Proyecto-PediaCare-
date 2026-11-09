import { useState } from 'react'
import { CalendarDays, Pencil, Plus, Syringe, Trash2, X } from 'lucide-react'

export default function NurseVaccinesView({
  vaccines,
  patients,
  onCreateVaccine,
  onUpdateVaccine,
  onDeleteVaccine,
  registrationCodeRole,
  readOnly = false,
}) {
  const vaccineList = Array.isArray(vaccines) ? vaccines.filter(Boolean) : []
  const patientList = Array.isArray(patients) ? patients.filter(Boolean) : []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVaccine, setEditingVaccine] = useState(null)
  const [patientId, setPatientId] = useState(String(patientList[0]?.id || ''))
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [status, setStatus] = useState('Pendiente')
  const [applicationDate, setApplicationDate] = useState('')
  const [nextDose, setNextDose] = useState('')
  const [notes, setNotes] = useState('')
  const [registrationCode, setRegistrationCode] = useState('')
  const [deleteRegistrationCode, setDeleteRegistrationCode] = useState('')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [vaccineToDelete, setVaccineToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const activePatientId = patientId || String(patientList[0]?.id || '')

  function openCreateModal() {
    setEditingVaccine(null)
    setPatientId(String(patientList[0]?.id || ''))
    setName('')
    setDose('')
    setStatus('Pendiente')
    setApplicationDate('')
    setNextDose('')
    setNotes('')
    setRegistrationCode('')
    setError('')
    setActionError('')
    setIsModalOpen(true)
  }

  function openEditModal(vaccine) {
    setEditingVaccine(vaccine)
    setRegistrationCode('')
    setPatientId(String(vaccine.idPaciente))
    setName(vaccine.nombre)
    setDose(vaccine.dosis)
    setStatus(vaccine.estado)
    setApplicationDate(vaccine.fechaAplicacion || '')
    setNextDose(vaccine.proximaDosis || '')
    setNotes(vaccine.observaciones || '')
    setError('')
    setActionError('')
    setIsModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    const vaccine = {
      ...(editingVaccine ? { id: editingVaccine.id } : {}),
      idPaciente: Number(activePatientId),
      nombre: name.trim(),
      dosis: dose.trim(),
      estado: status,
      fechaAplicacion: status === 'Aplicada' ? applicationDate : null,
      proximaDosis: nextDose || null,
      observaciones: notes.trim(),
    }
    const result = editingVaccine
      ? await onUpdateVaccine(vaccine, registrationCode)
      : await onCreateVaccine(vaccine)
    setIsSaving(false)
    if (!result?.ok) {
      setError(result?.error || 'No se pudo guardar la vacuna.')
      return
    }
    setIsModalOpen(false)
    setEditingVaccine(null)
    setRegistrationCode('')
  }

  function handleMarkApplied(vaccine) {
    const today = new Date().toISOString().slice(0, 10)
    openEditModal({
      ...vaccine,
      estado: 'Aplicada',
      fechaAplicacion: vaccine.fechaAplicacion || today,
    })
  }

  async function handleDeleteVaccine() {
    if (!vaccineToDelete) return
    setIsDeleting(true)
    setActionError('')
    const result = await onDeleteVaccine(vaccineToDelete.id, deleteRegistrationCode)
    setIsDeleting(false)
    if (!result?.ok) {
      setActionError(result?.error || 'No se pudo eliminar la vacuna.')
      return
    }
    setVaccineToDelete(null)
    setDeleteRegistrationCode('')
  }

  return (
    <div className="nurse-vaccines-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">ESQUEMA DE VACUNACIÓN</span>
          <h2>Vacunas registradas ({vaccineList.length})</h2>
          <p>Registrá el estado de cada dosis y su próxima fecha de aplicación.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={openCreateModal}
            disabled={!patientList.length}
          >
            <Plus size={16} />
            <span>Registrar vacuna</span>
          </button>
        )}
      </div>

      {actionError && <p className="form-error" role="alert">{actionError}</p>}

      <div className="appointments-list-cards">
        {vaccineList.length === 0 ? (
          <div className="empty-panel">
            <Syringe size={32} />
            <h3>No hay vacunas registradas</h3>
            <p>Las vacunas cargadas para los pacientes aparecerán aquí.</p>
          </div>
        ) : vaccineList.map((vaccine) => (
          <article className="family-appointment-card" key={vaccine.id}>
            <div className="family-app-date-block">
              <Syringe size={21} />
            </div>
            <div className="family-app-content">
              <div className="family-app-top">
                <h3>{vaccine.nombre}</h3>
                <span className={`status-pill ${
                  vaccine.estado === 'Aplicada' ? 'status-pill--good' : 'status-pill--attention'
                }`}>{vaccine.estado}</span>
              </div>
              <p>
                {vaccine.pacienteNombre ||
                  patientList.find((patient) => patient.id === vaccine.idPaciente)?.nombre ||
                  'Paciente'} · DNI {
                  vaccine.pacienteDni ||
                  patientList.find((patient) => patient.id === vaccine.idPaciente)?.dni ||
                  'pendiente'
                } · {vaccine.dosis}
              </p>
              <div className="family-app-meta">
                {vaccine.fechaAplicacion && <span>Aplicada: {vaccine.fechaAplicacion}</span>}
                {vaccine.proximaDosis && (
                  <span><CalendarDays size={14} /> Próxima dosis: {vaccine.proximaDosis}</span>
                )}
                {vaccine.profesional && <span>Registrada por: {vaccine.profesional}</span>}
              </div>
            </div>
            {!readOnly && <div className="family-vaccine-actions">
              <button
                type="button"
                className="action-btn action-btn--secondary"
                onClick={() => openEditModal(vaccine)}
              >
                <Pencil size={15} /> Editar
              </button>
              {vaccine.estado !== 'Aplicada' && (
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => handleMarkApplied(vaccine)}
                >
                  Marcar aplicada
                </button>
              )}
              <button
                type="button"
                className="action-btn action-btn--danger"
                onClick={() => {
                  setActionError('')
                  setDeleteRegistrationCode('')
                  setVaccineToDelete(vaccine)
                }}
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>}
          </article>
        ))}
      </div>

      {!readOnly && isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="vaccine-title">
          <div className="modal-card">
            <header className="modal-header">
              <div>
                <span className="section-kicker">REGISTRO CLÍNICO</span>
                <h2 id="vaccine-title">{editingVaccine ? 'Editar vacuna' : 'Registrar vacuna'}</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => {
                setIsModalOpen(false)
                setRegistrationCode('')
              }}>
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleSubmit} className="consultation-form">
              <label>
                <span>Paciente *</span>
                <select value={activePatientId} onChange={(event) => setPatientId(event.target.value)} required>
                  {patientList.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.dni || 'DNI pendiente'} · {patient.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Vacuna *</span>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
              </label>
              <div className="form-two-col">
                <label>
                  <span>Dosis *</span>
                  <input value={dose} onChange={(event) => setDose(event.target.value)} maxLength={50} placeholder="Ej.: 1.ª dosis" required />
                </label>
                <label>
                  <span>Estado *</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aplicada">Aplicada</option>
                    <option value="Atrasada">Atrasada</option>
                  </select>
                </label>
              </div>
              <div className="form-two-col">
                <label>
                  <span>Fecha de aplicación</span>
                  <input type="date" value={applicationDate} onChange={(event) => setApplicationDate(event.target.value)} required={status === 'Aplicada'} />
                </label>
                <label>
                  <span>Próxima dosis</span>
                  <input type="date" value={nextDose} onChange={(event) => setNextDose(event.target.value)} />
                </label>
              </div>
              <label>
                <span>Observaciones</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              {editingVaccine && (
                <label>
                  <span>Código de registro de {registrationCodeRole === 'MEDICO' ? 'médico' : 'enfermería'} *</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={registrationCode}
                    onChange={(event) => setRegistrationCode(event.target.value)}
                    required
                  />
                  <small>Solicitá el código vigente al dueño del software para autorizar este cambio.</small>
                </label>
              )}
              <footer className="modal-footer">
                <button type="button" className="action-btn action-btn--secondary" onClick={() => {
                  setIsModalOpen(false)
                  setRegistrationCode('')
                }}>
                  Cancelar
                </button>
                <button type="submit" className="action-btn action-btn--primary" disabled={isSaving}>
                  {isSaving ? 'Guardando…' : editingVaccine ? 'Guardar cambios' : 'Guardar vacuna'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {!readOnly && vaccineToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-vaccine-title">
          <div className="modal-card modal-card--small">
            <div className="delete-dialog-content">
              <h3 id="delete-vaccine-title">¿Eliminar este registro de vacuna?</h3>
              <p>
                Se eliminará <strong>{vaccineToDelete.nombre} · {vaccineToDelete.dosis}</strong>
                {vaccineToDelete.pacienteNombre ? <> de <strong>{vaccineToDelete.pacienteNombre}</strong></> : ''}.
                Esta acción no se puede deshacer.
              </p>
              <label>
                <span>Código de registro de {registrationCodeRole === 'MEDICO' ? 'médico' : 'enfermería'} *</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={deleteRegistrationCode}
                  onChange={(event) => setDeleteRegistrationCode(event.target.value)}
                  required
                />
              </label>
              {actionError && <p className="form-error" role="alert">{actionError}</p>}
              <div className="dialog-buttons">
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => {
                    setVaccineToDelete(null)
                    setDeleteRegistrationCode('')
                  }}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--danger"
                  onClick={handleDeleteVaccine}
                  disabled={isDeleting || !deleteRegistrationCode}
                >
                  {isDeleting ? 'Eliminando…' : 'Confirmar eliminación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
