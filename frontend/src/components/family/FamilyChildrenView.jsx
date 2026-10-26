import {
  FileHeart,
  HeartPulse,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'

export default function FamilyChildrenView({ childrenPatients, onNavigateToHistory, tutorId }) {
  return (
    <div className="family-children-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">PORTAL FAMILIAR</span>
          <h2>Mis Hijos ({childrenPatients.length})</h2>
          <p>Pacientes asociados directamente a tu cuenta de tutor/a.</p>
        </div>
      </div>

      {childrenPatients.length === 0 ? (
        <div className="empty-panel">
          <UsersRound size={36} />
          <h3>No tenés pacientes vinculados a tu cuenta aún</h3>
          <p>
            Para que tu hijo/a aparezca aquí, el médico pediatra debe dar de alta su ficha clínica
            indicando tu <strong>ID de Tutor (#{tutorId || '—'})</strong>.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--pine-soft)' }}>
            Proporcionale este número a tu pediatra al momento de la consulta o alta clínica.
          </p>
        </div>
      ) : (
        <div className="children-grid">
          {childrenPatients.map((child) => (
            <article className="child-card" key={child.id}>
              <header className="child-card__header">
                <span className="patient-avatar-large">
                  {child.nombre.slice(0, 2).toUpperCase()}
                </span>
                <div className="child-card__identity">
                  <h3>{child.nombre}</h3>
                  <span className="child-age-pill">{child.edad} · {child.sexo}</span>
                  <span className="child-id">Ficha clínica #{child.id}</span>
                </div>
              </header>

              <div className="child-card__body">
                <div className="child-info-row">
                  <span>Fecha de nacimiento:</span>
                  <strong>{child.fechaNacimiento}</strong>
                </div>
                <div className="child-info-row">
                  <span>Grupo sanguíneo:</span>
                  <strong>{child.grupoSanguineo || '0+'}</strong>
                </div>
                <div className="child-info-row">
                  <span>Pediatra asignada:</span>
                  <strong>{child.pediatraCabecera || 'Dra. Lucía Benítez'}</strong>
                </div>

                <div className="child-alert-box child-alert-box--danger">
                  <ShieldAlert size={16} />
                  <div>
                    <strong>Alergias registradas:</strong>
                    <p>{child.alergias || 'Sin alergias conocidas'}</p>
                  </div>
                </div>

                <div className="child-alert-box child-alert-box--info">
                  <HeartPulse size={16} />
                  <div>
                    <strong>Enfermedades crónicas:</strong>
                    <p>{child.enfermedadesCronicas || 'Ninguna'}</p>
                  </div>
                </div>
              </div>

              <footer className="child-card__footer">
                <button
                  type="button"
                  className="action-btn action-btn--primary action-btn--full"
                  onClick={() => onNavigateToHistory(child.id)}
                >
                  <FileHeart size={16} /> Ver Historial Clínico
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
