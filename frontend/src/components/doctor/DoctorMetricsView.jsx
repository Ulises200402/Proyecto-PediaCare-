import {
  Activity,
  BarChart3,
  Calendar,
  FileCheck,
  TrendingUp,
  Users,
} from 'lucide-react'

export default function DoctorMetricsView({ consultations, metrics, isDemo }) {

  const now = new Date()
  const isCurrentMonth = (consultation) => {
    const date = new Date(String(consultation.fechaConsulta).replace(' ', 'T'))
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }
  const isPreviousMonth = (consultation) => {
    const date = new Date(String(consultation.fechaConsulta).replace(' ', 'T'))
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth()
  }
  const consultasMes = metrics?.totalConsultasMes ??
    consultations.filter(isCurrentMonth).length
  const consultasHoy = metrics?.consultasHoy ??
    consultations.filter((consultation) => consultation.esHoy).length
  const pacientesDistintos = metrics?.pacientesDistintos ??
    new Set(consultations.filter(isCurrentMonth).map((consultation) => consultation.idPaciente)).size
  const consultasMesAnterior = metrics?.consultasMesAnterior ??
    consultations.filter(isPreviousMonth).length

  const motivos = metrics && metrics.motivosFrecuentes.length > 0
    ? metrics.motivosFrecuentes.map((m) => ({
        label: m.label,
        count: m.count,
        percentage: Math.round((m.count / Math.max(1, consultasMes)) * 100),
      }))
    : []

  const evolucionMensual = [
    { mes: 'Mes anterior', total: consultasMesAnterior },
    { mes: 'Mes actual', total: consultasMes, actual: true },
  ]

  return (
    <div className="metrics-view">
      {/* HU 1: Resumen de consultas realizadas en el mes */}
      <section className="metric-strip" aria-label="Indicadores del mes">
        <div className="metric-item">
          <span>CONSULTAS REALIZADAS EN EL MES</span>
          <strong>{consultasMes}</strong>
          <small className="metric-item__positive">
            <TrendingUp size={14} /> {isDemo ? 'Datos ficticios de demostración' : 'Datos de la API'}
          </small>
        </div>
        <div className="metric-item">
          <span>PACIENTES DISTINTOS ATENDIDOS</span>
          <strong>{pacientesDistintos}</strong>
          <small>
            <Users size={14} /> Fichas activas
          </small>
        </div>
        <div className="metric-item">
          <span>CONSULTAS DEL DÍA</span>
          <strong>{consultasHoy}</strong>
          <small>
            <Calendar size={14} /> Jornada en curso
          </small>
        </div>
        <div className="metric-item">
          <span>CERTIFICADOS Y APTITUDES</span>
          <strong>{motivos.length}</strong>
          <small><FileCheck size={14} /> Motivos distintos registrados</small>
        </div>
      </section>

      <div className="metrics-grid">
        {/* Gráfico / Evolución mensual */}
        <section className="data-panel">
          <header className="data-panel__heading panel-title-row">
            <div>
              <span className="section-kicker">EVOLUCIÓN CLÍNICA</span>
              <h2>Comparación mensual</h2>
            </div>
            <BarChart3 size={20} />
          </header>

          <div className="chart-bar-container">
            {evolucionMensual.map((item) => {
              const max = Math.max(20, item.total * 1.5)
              const heightPercent = Math.min(100, Math.round((item.total / max) * 100))
              return (
                <div className="chart-column" key={item.mes}>
                  <div className="chart-column-track">
                    <div
                      className={`chart-column-fill ${item.actual ? 'chart-column-fill--active' : ''}`}
                      style={{ height: `${Math.max(15, heightPercent)}%` }}
                    >
                      <span className="chart-value">{item.total}</span>
                    </div>
                  </div>
                  <span className="chart-label">{item.mes}</span>
                </div>
              )
            })}
          </div>
          <div className="chart-footer-note">
            <span>Cálculo automático de consultas acumuladas desde la base de datos (HU 1).</span>
          </div>
        </section>

        {/* Motivos de Consulta más frecuentes */}
        <section className="data-panel">
          <header className="data-panel__heading panel-title-row">
            <div>
              <span className="section-kicker">EPIDEMIOLOGÍA PEDIÁTRICA</span>
              <h2>Motivos de Consulta Frecuentes</h2>
            </div>
            <Activity size={20} />
          </header>

          <div className="progress-list">
            {motivos.length === 0 ? (
              <p className="empty-panel">Todavía no hay motivos de consulta registrados este mes.</p>
            ) : motivos.map((diag) => (
              <div className="progress-item" key={diag.label}>
                <div className="progress-item__info">
                  <strong>{diag.label}</strong>
                  <span>{diag.count} consultas ({diag.percentage}%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${diag.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
