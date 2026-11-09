import { useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Mail,
  MessageSquare,
  Settings,
  Smartphone,
  Calendar,
  Pill,
  HeartPulse,
} from 'lucide-react'

export default function FamilyNotificationsView({
  notifications,
  notificationSettings,
  onUpdateSettings,
  onMarkAsRead,
  readOnly = false,
}) {
  const [activeTab, setActiveTab] = useState('inbox') // 'inbox' | 'settings'
  const [editedSettings, setEditedSettings] = useState(null)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const settings = editedSettings || notificationSettings

  const unreadCount = notifications.filter((n) => !n.leida).length

  function handleToggleChannel(channel) {
    setEditedSettings((prev) => ({
      ...(prev || notificationSettings),
      ...prev,
      canales: {
        ...(prev || notificationSettings).canales,
        [channel]: !(prev || notificationSettings).canales[channel],
      },
    }))
  }

  function handleToggleType(type) {
    setEditedSettings((prev) => ({
      ...(prev || notificationSettings),
      ...prev,
      tipos: {
        ...(prev || notificationSettings).tipos,
        [type]: !(prev || notificationSettings).tipos[type],
      },
    }))
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setFormError('')
    setIsSaving(true)
    const saved = await onUpdateSettings(settings)
    setIsSaving(false)
    if (!saved) {
      setFormError('No se pudieron guardar las preferencias. Intentá nuevamente.')
      return
    }
    setEditedSettings(settings)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="family-notifications-view">
      <div className="panel-title-row">
        <div>
          <span className="section-kicker">CENTRO DE ALERTAS Y COMUNICACIÓN (HU 4)</span>
          <h2>Notificaciones y Preferencias</h2>
          <p>Mantenete informada sobre cada novedad clínica de tus hijos.</p>
        </div>

        <div className="consultations-filters">
          <button
            type="button"
            className={`filter-pill ${activeTab === 'inbox' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <Bell size={15} />
            Bandeja de Novedades {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'settings' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={15} />
            Configurar Notificaciones (HU 4)
          </button>
        </div>
      </div>

      {activeTab === 'inbox' ? (
        <div className="notifications-inbox">
          {notifications.length === 0 ? (
            <div className="empty-panel">
              <Bell size={32} />
              <h3>No tenés notificaciones pendientes</h3>
              <p>Las alertas de turnos, vacunas y consultas aparecerán aquí.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.leida
              return (
                <article
                  key={notif.id}
                  className={`notification-item ${isUnread ? 'notification-item--unread' : ''}`}
                >
                  <div className="notif-icon-col">
                    <span className="notif-type-icon">
                      {notif.tipo === 'consulta' && <HeartPulse size={18} />}
                      {notif.tipo === 'medicacion' && <Pill size={18} />}
                      {notif.tipo === 'turno' && <Calendar size={18} />}
                      {notif.tipo === 'vacuna' && <Bell size={18} />}
                    </span>
                  </div>

                  <div className="notif-content-col">
                    <div className="notif-topline">
                      <h4>{notif.titulo}</h4>
                      <span className="notif-date">{notif.fecha}</span>
                    </div>
                    <p className="notif-message">{notif.mensaje}</p>

                    <div className="notif-footer-meta">
                      <span className="notif-child-tag">Hijo/a: {notif.pacienteNombre}</span>
                      <span className="notif-channel-tag">
                        Medio:{' '}
                        {notif.canal === 'APP' && '📱 Notificación en App'}
                        {notif.canal === 'EMAIL' && '✉️ Correo electrónico'}
                        {notif.canal === 'SMS' && '💬 Mensaje SMS'}
                      </span>
                    </div>
                  </div>

                  <div className="notif-read-col">
                    {isUnread && !readOnly ? (
                      <button
                        type="button"
                        className="icon-action-btn"
                        title="Marcar como leída"
                        aria-label={`Marcar como leída: ${notif.titulo}`}
                        onClick={() => onMarkAsRead(notif.id)}
                      >
                        <Check size={16} />
                      </button>
                    ) : isUnread ? (
                      <span className="text-muted">No leída</span>
                    ) : (
                      <CheckCheck size={16} className="text-muted" title="Leída" />
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      ) : (
        /* Panel de Configuración de Notificaciones (HU 4) */
        <div className="notifications-settings-panel data-panel">
          <header className="data-panel__heading panel-title-row">
            <div>
              <span className="section-kicker">PERSONALIZACIÓN DE AVISOS (HU 4)</span>
              <h2>¿Por qué medios y qué novedades querés recibir?</h2>
              <p>Activá o desactivá libremente los canales de comunicación según tu preferencia.</p>
            </div>
          </header>

          <form onSubmit={handleSaveSettings} className="settings-form">
            {/* Canales: App, Email, SMS (HU 4) */}
            <fieldset className="settings-group">
              <legend>Canales de recepción de notificaciones:</legend>

              <label className="toggle-label">
                <div className="toggle-text">
                  <Smartphone size={18} />
                  <div>
                    <strong>Notificaciones dentro de la aplicación</strong>
                    <small>Avisos en la bandeja de novedades de PediaCare+.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.canales.app}
                  onChange={() => handleToggleChannel('app')}
                  disabled={readOnly}
                />
              </label>

              <label className="toggle-label">
                <div className="toggle-text">
                  <Mail size={18} />
                  <div>
                    <strong>Correo electrónico (no disponible)</strong>
                    <small>Este prototipo no envía correos.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                />
              </label>

              <label className="toggle-label">
                <div className="toggle-text">
                  <MessageSquare size={18} />
                  <div>
                    <strong>Mensajes SMS (no disponibles)</strong>
                    <small>Este prototipo no envía mensajes de texto.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                />
              </label>
            </fieldset>

            {/* Tipos de avisos */}
            <fieldset className="settings-group">
              <legend>Tipos de eventos para recibir avisos automáticos:</legend>

              <label className="toggle-label">
                <div className="toggle-text">
                  <div>
                    <strong>Recordatorios de turnos próximos</strong>
                    <small>Avisos 24 horas y 2 horas antes de la consulta pediátrica.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tipos.turnos}
                  onChange={() => handleToggleType('turnos')}
                  disabled={readOnly}
                />
              </label>

              <label className="toggle-label">
                <div className="toggle-text">
                  <div>
                    <strong>Avisos de medicación</strong>
                    <small>Notificación cuando se registra una dosis.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tipos.medicacion}
                  onChange={() => handleToggleType('medicacion')}
                  disabled={readOnly}
                />
              </label>

              <label className="toggle-label">
                <div className="toggle-text">
                  <div>
                    <strong>Actualizaciones e informes de consultas</strong>
                    <small>Aviso cuando el pediatra publica un nuevo informe o diagnóstico clínico.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tipos.consultas}
                  onChange={() => handleToggleType('consultas')}
                  disabled={readOnly}
                />
              </label>

              <label className="toggle-label">
                <div className="toggle-text">
                  <div>
                    <strong>Avisos de vacunas</strong>
                    <small>Notificación cuando se registra una aplicación.</small>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tipos.vacunas}
                  onChange={() => handleToggleType('vacunas')}
                  disabled={readOnly}
                />
              </label>

            </fieldset>

            <div className="settings-form-actions">
              {!readOnly && (
                <button type="submit" className="action-btn action-btn--primary" disabled={isSaving}>
                  {isSaving ? 'Guardando…' : 'Guardar preferencias'}
                </button>
              )}
              {savedSuccess && (
                <span className="saved-success-msg">
                  <Check size={16} /> ¡Preferencias guardadas correctamente!
                </span>
              )}
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
          </form>
        </div>
      )}
    </div>
  )
}
