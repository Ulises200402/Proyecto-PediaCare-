import { useState } from 'react'
import {
  AlertTriangle,
  Pill,
  PhoneCall,
  Search,
  ShieldAlert,
  User,
  X,
  Clock,
  Activity,
} from 'lucide-react'

export default function EmergencyProfileModal({ isOpen, onClose, patients, initialPatientId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || patients[0]?.id || 1)

  if (!isOpen) return null

  const filteredPatients = patients.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.id).includes(searchTerm)
  )

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0]

  return (
    <div className="emergency-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="emergency-title">
      <div className="emergency-modal-container">
        {/* Encabezado de Emergencia */}
        <header className="emergency-modal-header">
          <div className="emergency-header-title">
            <span className="emergency-badge">
              <ShieldAlert size={22} className="emergency-icon-pulse" />
              <span>PERFIL DE EMERGENCIA · INFORMACIÓN CRÍTICA</span>
            </span>
            <p id="emergency-title">Acceso rápido e inmediato a datos vitales del paciente</p>
          </div>
          <button
            className="emergency-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal de emergencia"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        {/* Buscador Rápido de Paciente (HU 3: acceso en menos de 3 seg) */}
        <div className="emergency-search-bar">
          <div className="input-shell emergency-search-input">
            <Search size={18} className="input-shell__icon" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre o ID para guardia / emergencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                className="emergency-clear-search"
                onClick={() => setSearchTerm('')}
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selector horizontal rápido de pacientes */}
          <div className="emergency-patient-chips">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`emergency-chip ${p.id === activePatient?.id ? 'is-active' : ''}`}
                onClick={() => setSelectedPatientId(p.id)}
              >
                <span className="emergency-chip-dot" />
                <strong>{p.nombre}</strong>
                <small>#{p.id} · {p.edad}</small>
              </button>
            ))}
          </div>
        </div>

        {activePatient ? (
          <div className="emergency-body">
            {/* Tarjeta de Identificación Rápida */}
            <div className="emergency-identity-card">
              <div className="emergency-avatar">
                {activePatient.nombre.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="emergency-identity-info">
                <div className="emergency-identity-top">
                  <h2>{activePatient.nombre}</h2>
                  <span className="emergency-blood-badge">
                    Grupo: <strong>{activePatient.grupoSanguineo || '0+'}</strong>
                  </span>
                </div>
                <div className="emergency-identity-meta">
                  <span><strong>ID:</strong> #{activePatient.id}</span>
                  <span><strong>Edad:</strong> {activePatient.edad}</span>
                  <span><strong>Sexo:</strong> {activePatient.sexo}</span>
                  <span><strong>Nacimiento:</strong> {activePatient.fechaNacimiento}</span>
                  <span><strong>Pediatra:</strong> {activePatient.pediatraCabecera || 'Dra. Lucía Benítez'}</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: ALERGIAS (MÁXIMA PRIORIDAD - ALERTA ROJA) */}
            <section className="emergency-alert-block emergency-alert-block--danger">
              <div className="emergency-block-title">
                <AlertTriangle size={22} />
                <h3>ALERGIAS REGISTRADAS (CRÍTICO)</h3>
              </div>
              <div className="emergency-alert-content">
                <p className="emergency-alert-text">
                  {activePatient.alergias || 'No se registran alergias reportadas en el sistema.'}
                </p>
                <small className="emergency-warning-hint">
                  Verificar con los tutores antes de suministrar fármacos, antibióticos o contraste.
                </small>
              </div>
            </section>

            {/* SECCIÓN 2: ENFERMEDADES CRÓNICAS Y ANTECEDENTES */}
            <div className="emergency-two-col">
              <section className="emergency-alert-block emergency-alert-block--warning">
                <div className="emergency-block-title">
                  <Activity size={20} />
                  <h3>Enfermedades crónicas / Diagnósticos base</h3>
                </div>
                <div className="emergency-block-body">
                  <p>{activePatient.enfermedadesCronicas || 'Sin enfermedades crónicas reportadas.'}</p>
                </div>
              </section>

              {/* SECCIÓN 3: MEDICACIÓN ACTUAL */}
              <section className="emergency-alert-block emergency-alert-block--info">
                <div className="emergency-block-title">
                  <Pill size={20} />
                  <h3>Medicación en curso</h3>
                </div>
                <div className="emergency-block-body">
                  <p>{activePatient.medicacionActual || 'No tiene medicación activa actualmente.'}</p>
                </div>
              </section>
            </div>

            {/* SECCIÓN 4: CONTACTO DE URGENCIA / TUTORES */}
            <section className="emergency-contacts-block">
              <div className="emergency-block-title">
                <PhoneCall size={20} />
                <h3>Contacto de Emergencia / Tutores Responsables</h3>
              </div>
              <div className="emergency-contacts-grid">
                <div className="emergency-contact-card">
                  <div className="emergency-contact-role">TUTOR PRINCIPAL (1)</div>
                  <strong>{activePatient.tutor1Nombre || 'Tutor Responsable'}</strong>
                  <a
                    href={`tel:${activePatient.tutor1Telefono || ''}`}
                    className="emergency-phone-btn"
                  >
                    <PhoneCall size={16} />
                    <span>{activePatient.tutor1Telefono || '+54 9 11 4521-8890'}</span>
                    <span className="emergency-call-label">Llamar ahora</span>
                  </a>
                </div>

                {activePatient.tutor2Nombre && (
                  <div className="emergency-contact-card">
                    <div className="emergency-contact-role">TUTOR SECUNDARIO (2)</div>
                    <strong>{activePatient.tutor2Nombre}</strong>
                    <a
                      href={`tel:${activePatient.tutor2Telefono || ''}`}
                      className="emergency-phone-btn"
                    >
                      <PhoneCall size={16} />
                      <span>{activePatient.tutor2Telefono}</span>
                      <span className="emergency-call-label">Llamar</span>
                    </a>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="emergency-empty-state">
            <User size={36} />
            <p>No se encontró ningún paciente con el criterio indicado.</p>
          </div>
        )}

        <footer className="emergency-modal-footer">
          <span className="emergency-footer-note">
            <Clock size={15} />
            Información médica protegida · Destinada exclusivamente a personal de guardia y profesionales habilitados.
          </span>
          <button className="emergency-dismiss-btn" onClick={onClose} type="button">
            Cerrar ficha de emergencia
          </button>
        </footer>
      </div>
    </div>
  )
}

