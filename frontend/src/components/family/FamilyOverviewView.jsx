import {
  ArrowRight,
  CheckCircle,
  Clock3,
  HeartPulse,
  ShieldAlert,
  Syringe,
  UsersRound,
} from 'lucide-react'

export default function FamilyOverviewView({
  childrenPatients,
  appointments,
  vaccines,
  consultations,
  onNavigate,
  tutorId,
}) {
  const currentChild = childrenPatients[0]

  if (!currentChild) {
    return (
      <div className="family-overview">
        <section className="empty-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <UsersRound size={42} style={{ color: 'var(--pine)', marginBottom: '1rem' }} />
          <h2>Bienvenido/a al Portal Familiar de PediaCare+</h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 1rem' }}>
            Tu cuenta de Padre/Madre está activa con el <strong>ID de Tutor #{tutorId || '—'}</strong>.
            Aún no se han registrado fichas pediátricas asociadas a tu usuario en la base de datos.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '480px', margin: '0 auto' }}>
            Al momento de la consulta pediátrica, el médico ingresará tu ID de tutor y el registro de tu hijo/a aparecerá automáticamente aquí.
          </p>
        </section>
      </div>
    )
  }

  // Próximo turno de los hijos
  const upcomingAppointment = appointments.find((a) => a.estado === 'Confirmado' || a.estado === 'Programado')

  // Próxima vacuna
  const nextVaccine = vaccines.find((v) => v.estado === 'Pendiente')

  // Última consulta médica
  const lastConsultation = consultations.find((c) => c.idPaciente === currentChild.id) || consultations[0]

  return (
    <div className="family-overview">
      {/* HU 4: La madre puede ver el estado actualizado del paciente en la app/web */}
      <section className="patient-banner" aria-label="Hijo seleccionado">
        <span className="patient-banner__avatar">
          {currentChild.nombre.slice(0, 2).toUpperCase()}
        </span>
        <div className="patient-banner__identity">
          <span>SEGUIMIENTO DE SALUD</span>
          <strong>{currentChild.nombre}</strong>
          <small>{currentChild.edad} · {currentChild.estadoGeneral || 'Seguimiento al día'}</small>
        </div>
        <span className="patient-banner__status">
          <CheckCircle size={15} /> Estado al día
        </span>
        <button
          className="patient-banner__select"
          onClick={() => onNavigate('Mis hijos')}
          type="button"
        >
          Ver ficha completa <ArrowRight size={14} />
        </button>
      </section>

      <div className="parent-overview-grid">
        {/* Tarjeta de Próximo Turno */}
        <section className="appointment-feature">
          <div className="appointment-feature__topline">
            <span className="section-kicker">PRÓXIMO TURNO MÉDICO</span>
            <span className="appointment-feature__tag">Confirmado</span>
          </div>

          {upcomingAppointment ? (
            <>
              <div className="appointment-feature__date">
                <span className="appointment-feature__day">
                  {new Date(upcomingAppointment.fechaHora).getDate()}
                </span>
                <span>
                  {new Date(upcomingAppointment.fechaHora).toLocaleDateString('es-AR', {
                    month: 'short',
                    weekday: 'short',
                  }).toUpperCase()}
                </span>
              </div>
              <div className="appointment-feature__details">
                <h2>{upcomingAppointment.motivo}</h2>
                <p>{upcomingAppointment.medicoNombre} · {upcomingAppointment.especialidad}</p>
                <span>
                  <Clock3 size={15} />{' '}
                  {new Date(upcomingAppointment.fechaHora).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {upcomingAppointment.consultorio}
                </span>
              </div>
            </>
          ) : (
            <div className="appointment-feature__details">
              <h2>No tenés turnos pendientes</h2>
              <p>Podés agendar un turno de control cuando lo necesites.</p>
            </div>
          )}

          <div className="appointment-feature__footer">
            <span>Centro de Salud Pediátrico</span>
            <button onClick={() => onNavigate('Turnos')} type="button">
              Gestionar turnos <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* Tarjeta de Próxima Vacuna */}
        <section className="vaccine-panel">
          <div className="panel-title-row">
            <div>
              <span className="section-kicker">CALENDARIO NACIONAL DE VACUNACIÓN</span>
              <h2>Próxima Vacuna</h2>
            </div>
            <span className="vaccine-panel__icon">
              <Syringe size={19} />
            </span>
          </div>

          {nextVaccine ? (
            <>
              <div className="vaccine-panel__name">{nextVaccine.nombre}</div>
              <div className="vaccine-panel__date">
                {new Date(nextVaccine.proximaDosis).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                })}{' '}
                <span>{nextVaccine.diasRestantes ? `en ${nextVaccine.diasRestantes} días` : 'próximamente'}</span>
              </div>
              <div className="progress-track">
                <span style={{ width: '65%' }} />
              </div>
              <p>Recordatorio automático activado · Aviso por App y Correo</p>
            </>
          ) : (
            <p>Esquema de vacunación completo para la edad.</p>
          )}
        </section>

        {/* Tarjeta de Información Importante (Alergias) */}
        <section className="care-summary">
          <div className="panel-title-row">
            <div>
              <span className="section-kicker">INFORMACIÓN CLÍNICA CLAVE</span>
              <h2>Ficha de {currentChild.nombre.split(' ')[0]}</h2>
            </div>
            <ShieldAlert size={19} />
          </div>
          <div className="care-summary__line">
            <span>Alergias registradas</span>
            <strong className="text-danger">{currentChild.alergias || 'Ninguna registrada'}</strong>
          </div>
          <div className="care-summary__line">
            <span>Enfermedades crónicas</span>
            <strong>{currentChild.enfermedadesCronicas || 'Ninguna registrada'}</strong>
          </div>
          <div className="care-summary__line">
            <span>Pediatra de cabecera</span>
            <strong>{currentChild.pediatraCabecera || 'Dra. Lucía Benítez'}</strong>
          </div>
          <p>Esta información se comparte de forma segura con el equipo de guardia médica en caso de emergencia.</p>
        </section>

        {/* Actividad Reciente */}
        <section className="activity-panel">
          <div className="panel-title-row">
            <div>
              <span className="section-kicker">ACTIVIDAD RECIENTE</span>
              <h2>Últimas novedades</h2>
            </div>
            <button
              className="text-action"
              onClick={() => onNavigate('Historial clínico')}
              type="button"
            >
              Ver historial <ArrowRight size={14} />
            </button>
          </div>

          {lastConsultation && (
            <div className="activity-row">
              <span className="activity-row__icon">
                <HeartPulse size={17} />
              </span>
              <div>
                <strong>{lastConsultation.motivo}</strong>
                <span>{lastConsultation.diagnostico} · {lastConsultation.medicoNombre}</span>
              </div>
              <time>
                {new Date(lastConsultation.fechaConsulta).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </time>
            </div>
          )}

          <div className="activity-row">
            <span className="activity-row__icon activity-row__icon--mint">
              <Syringe size={17} />
            </span>
            <div>
              <strong>Vacuna registrada</strong>
              <span>Triple viral aplicada · Refuerzo</span>
            </div>
            <time>02 AGO</time>
          </div>
        </section>
      </div>
    </div>
  )
}
