import { useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Pill,
  ShieldAlert,
} from 'lucide-react'

export default function NurseRemindersView({
  reminders,
  patients = [],
  nurses = [],
  onAdministerDose,
  onOmitDose,
  onAssignReminder,
  onOpenEmergencyModal,
  canAdminister = true,
  canAssignReminders = false,
}) {
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'Pendiente' | 'Administrada'
  const [warningModalReminder, setWarningModalReminder] = useState(null)
  const [warningType, setWarningType] = useState('DUPLICATE') // 'DUPLICATE' | 'OFF_SCHEDULE'
  const [omitModalReminder, setOmitModalReminder] = useState(null)
  const [omitReason, setOmitReason] = useState('Orden médica de suspensión')
  const [assignmentErrors, setAssignmentErrors] = useState({})

  // Dosis con alerta visible de atención urgente / horario cumplido (HU 5)
  const pendingUrgentReminders = reminders.filter(
    (r) => canAdminister && r.estado === 'Pendiente' && r.esAlertaUrgente
  )

  const filteredReminders = reminders.filter((r) => {
    if (filter !== 'ALL' && r.estado !== filter) return false
    return true
  })

  // Validación de seguridad para evitar errores (HU 5: advertencias ante dosis duplicadas o fuera de horario)
  function handleAdministerClick(reminder) {
    // Si ya está administrada -> advertencia de dosis duplicada
    if (reminder.estado === 'Administrada') {
      setWarningType('DUPLICATE')
      setWarningModalReminder(reminder)
      return
    }

    // Verificar si es un horario muy lejano o fuera de hora
    const scheduledAt = reminder.fechaHoraProgramada
      ? new Date(String(reminder.fechaHoraProgramada).replace(' ', 'T'))
      : null
    const hoursUntilScheduled = scheduledAt
      ? (scheduledAt.getTime() - Date.now()) / 3600000
      : 0
    if (hoursUntilScheduled > 3) {
      setWarningType('OFF_SCHEDULE')
      setWarningModalReminder(reminder)
      return
    }

    // Ejecutar administración directa
    onAdministerDose(reminder.id)
  }

  async function handleAssignmentChange(reminder, value) {
    const result = await onAssignReminder(reminder.id, value ? Number(value) : null)
    setAssignmentErrors((previous) => ({
      ...previous,
      [reminder.id]: result?.ok ? '' : result?.error || 'No se pudo cambiar la asignación.',
    }))
  }

  function confirmWarningAdministration() {
    if (warningModalReminder) {
      onAdministerDose(warningModalReminder.id)
      setWarningModalReminder(null)
    }
  }

  function handleConfirmOmit() {
    if (omitModalReminder) {
      onOmitDose(omitModalReminder.id, omitReason)
      setOmitModalReminder(null)
    }
  }

  return (
    <div className="reminders-view">
      {/* HU 5: Muestra alertas visibles cuando corresponde administrar medicación */}
      {canAdminister && pendingUrgentReminders.length > 0 && (
        <section className="nurse-active-alert-banner">
          <div className="alert-banner-icon">
            <Bell size={24} className="bell-ring-animation" />
          </div>
          <div className="alert-banner-text">
            <strong>ALERTA DE MEDICACIÓN: Dosis del horario en curso pendiente</strong>
            <p>
              Paciente: <strong>{pendingUrgentReminders[0].pacienteNombre}</strong> —{' '}
              {pendingUrgentReminders[0].medicamento} ({pendingUrgentReminders[0].dosis}) a las{' '}
              {pendingUrgentReminders[0].horario}.
            </p>
          </div>
          <button
            type="button"
            className="action-btn action-btn--primary"
            onClick={() => handleAdministerClick(pendingUrgentReminders[0])}
          >
            <Check size={16} /> Administrar Ahora
          </button>
        </section>
      )}

      {/* Barra de Filtros */}
      <div className="consultations-toolbar">
        <div className="consultations-filters">
          <button
            type="button"
            className={`filter-pill ${filter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            Todos los recordatorios ({reminders.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'Pendiente' ? 'is-active' : ''}`}
            onClick={() => setFilter('Pendiente')}
          >
            <Clock size={14} /> Pendientes (
            {reminders.filter((r) => r.estado === 'Pendiente').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'Administrada' ? 'is-active' : ''}`}
            onClick={() => setFilter('Administrada')}
          >
            <CheckCircle2 size={14} /> Administradas (
            {reminders.filter((r) => r.estado === 'Administrada').length})
          </button>
        </div>
      </div>

      {/* Lista de Tomas y Horarios del Día (HU 5) */}
      <div className="reminders-timeline">
        {filteredReminders.map((rem) => {
          const isDone = rem.estado === 'Administrada'
          const isOmitted = rem.estado === 'Omitida'
          const isUrgent = rem.esAlertaUrgente && !isDone

          return (
            <article
              key={rem.id}
              className={`reminder-card ${isDone ? 'reminder-card--done' : ''} ${
                isUrgent ? 'reminder-card--urgent' : ''
              }`}
            >
              <div className="reminder-time-col">
                <Clock size={18} />
                <span className="reminder-time">
                  {rem.horario}
                  {rem.fechaHoraProgramada && (
                    <small>{new Date(String(rem.fechaHoraProgramada).replace(' ', 'T')).toLocaleDateString('es-AR')}</small>
                  )}
                </span>
                <span className={`status-pill status-pill--${isDone ? 'good' : isOmitted ? 'danger' : 'attention'}`}>
                  {rem.estado}
                </span>
              </div>

              <div className="reminder-details-col">
                <div className="reminder-patient-row">
                  <span className="patient-avatar">
                    {rem.pacienteNombre.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{rem.pacienteNombre}</strong>
                    <span className="reminder-patient-id">
                      DNI {rem.dni || patients.find((patient) => patient.id === rem.idPaciente)?.dni || 'pendiente'}
                    </span>
                  </div>
                </div>

                <div className="reminder-med-info">
                  <Pill size={16} />
                  <div>
                    <h4>{rem.medicamento}</h4>
                    <span className="reminder-dose">Dosis exacta: <strong>{rem.dosis}</strong></span>
                  </div>
                </div>

                {canAssignReminders && rem.estado === 'Pendiente' ? (
                  <label className="reminder-assignment">
                    <span>Enfermera responsable</span>
                    <select
                      value={rem.idEnfermeroAsignado || ''}
                      disabled={rem.estado !== 'Pendiente' || (!nurses.length && !rem.idEnfermeroAsignado)}
                      onChange={(event) => handleAssignmentChange(rem, event.target.value)}
                    >
                      {!rem.idEnfermeroAsignado && (
                        <option value="" disabled>Sin asignar</option>
                      )}
                      {rem.idEnfermeroAsignado &&
                        !nurses.some((nurse) => nurse.id === rem.idEnfermeroAsignado) && (
                          <option value={rem.idEnfermeroAsignado}>
                            {rem.enfermeroAsignado || 'Enfermera inactiva'}
                          </option>
                        )}
                      {nurses.map((nurse) => (
                        <option key={nurse.id} value={nurse.id}>{nurse.nombre}</option>
                      ))}
                    </select>
                    {assignmentErrors[rem.id] && (
                      <span className="form-error" role="alert">{assignmentErrors[rem.id]}</span>
                    )}
                  </label>
                ) : canAssignReminders ? (
                  <p className="reminder-assignment-summary">
                    Responsable: {rem.enfermeroAsignado || rem.enfermero || 'Sin asignar'}
                  </p>
                ) : null}

                {rem.observaciones && (
                  <p className="reminder-notes">
                    <em>Observación:</em> {rem.observaciones}
                  </p>
                )}

                {isDone && rem.fechaHoraAdministrada && (
                  <div className="reminder-audit-info">
                    <CheckCircle2 size={14} />
                    <span>
                      Administrada a las{' '}
                      {new Date(rem.fechaHoraAdministrada).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      por {rem.enfermero || 'Enfermería de turno'}
                    </span>
                  </div>
                )}
              </div>

              <div className="reminder-actions-col">
                {canAdminister && !isDone && !isOmitted ? (
                  <>
                    <button
                      type="button"
                      className="action-btn action-btn--primary"
                      onClick={() => handleAdministerClick(rem)}
                    >
                      <Check size={16} /> Marcar Administrada
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn--secondary action-btn--small"
                      onClick={() => setOmitModalReminder(rem)}
                    >
                      Omitir dosis
                    </button>
                  </>
                ) : canAdminister ? (
                  <button
                    type="button"
                    className="action-btn action-btn--secondary action-btn--small"
                    onClick={() => handleAdministerClick(rem)}
                    title="Registrar dosis adicional / advertencia"
                  >
                    Repetir registro
                  </button>
                ) : null}

                {onOpenEmergencyModal && (
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="Ficha crítica de emergencia"
                    onClick={() => onOpenEmergencyModal(rem.idPaciente)}
                  >
                    <ShieldAlert size={16} />
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* MODAL HU 5: Advertencia de prevención de errores (dosis duplicadas o fuera de horario) */}
      {warningModalReminder && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--warning">
            <div className="warning-dialog-content">
              <div className="warning-icon-badge">
                <AlertTriangle size={36} />
              </div>
              <h3>
                {warningType === 'DUPLICATE'
                  ? '¡ADVERTENCIA DE SEGURIDAD: DOSIS DUPLICADA!'
                  : '¡ADVERTENCIA: DOSIS FUERA DE HORARIO!'}
              </h3>
              <p>
                {warningType === 'DUPLICATE' ? (
                  <>
                    El sistema detectó que la dosis de{' '}
                    <strong>{warningModalReminder.medicamento}</strong> para el paciente{' '}
                    <strong>{warningModalReminder.pacienteNombre}</strong> ya figura como{' '}
                    <strong>ADMINISTRADA</strong>. Suministrar una dosis doble puede generar toxicidad.
                  </>
                ) : (
                  <>
                    Esta dosis está programada para las{' '}
                    <strong>{warningModalReminder.horario}</strong> y la hora actual del turno no
                    corresponde a esta toma. Verifique la indicación médica.
                  </>
                )}
              </p>

              <div className="safety-checklist">
                <strong>Verificación obligatoria de los 5 correctos:</strong>
                <ul>
                  <li>✓ Paciente correcto: {warningModalReminder.pacienteNombre}</li>
                  <li>✓ Medicamento correcto: {warningModalReminder.medicamento}</li>
                  <li>✓ Dosis correcta: {warningModalReminder.dosis}</li>
                  <li>✓ Vía de administración verificada</li>
                  <li>✓ Horario correcto confirmado</li>
                </ul>
              </div>

              <div className="dialog-buttons">
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setWarningModalReminder(null)}
                >
                  Cancelar (Prevenir error)
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--danger"
                  onClick={confirmWarningAdministration}
                >
                  Confirmar bajo mi responsabilidad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Omitir Dosis */}
      {omitModalReminder && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--small">
            <header className="modal-header">
              <div>
                <span className="section-kicker">REGISTRO DE NOVEDAD</span>
                <h2>Omitir Administración</h2>
              </div>
            </header>
            <div className="form-content">
              <p>
                Indique el motivo por el cual no se administró{' '}
                <strong>{omitModalReminder.medicamento}</strong> a{' '}
                <strong>{omitModalReminder.pacienteNombre}</strong>:
              </p>
              <select
                value={omitReason}
                onChange={(e) => setOmitReason(e.target.value)}
                className="select-full"
              >
                <option value="Orden médica de suspensión">Orden médica de suspensión</option>
                <option value="Paciente dormido / reposo">Paciente dormido / reposo</option>
                <option value="Vómitos / intolerancia gástrica">Vómitos / intolerancia gástrica</option>
                <option value="Falta de fármaco en farmacia">Falta de fármaco en farmacia</option>
                <option value="Rechazo del paciente o tutor">Rechazo del paciente o tutor</option>
              </select>
              <div className="dialog-buttons" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="action-btn action-btn--secondary"
                  onClick={() => setOmitModalReminder(null)}
                >
                  Volver
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--primary"
                  onClick={handleConfirmOmit}
                >
                  Registrar Omisión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
