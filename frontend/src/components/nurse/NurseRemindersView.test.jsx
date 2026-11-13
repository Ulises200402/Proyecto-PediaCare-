import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NurseRemindersView from './NurseRemindersView.jsx'

const reminder = {
  id: 21,
  idPaciente: 5,
  pacienteNombre: 'Paciente Ficticio',
  dni: '12345678',
  medicamento: 'Medicamento de prueba',
  dosis: '5 ml',
  horario: '10:00',
  fechaHoraProgramada: '2020-01-01 10:00:00',
  enfermero: 'Enfermería de prueba',
  observaciones: '',
  esAlertaUrgente: false,
}

describe('NurseRemindersView', () => {
  it('does not submit an already administered reminder again', () => {
    const onAdministerDose = vi.fn()
    render(
      <NurseRemindersView
        reminders={[{ ...reminder, estado: 'Administrada' }]}
        onAdministerDose={onAdministerDose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ver alerta de dosis duplicada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar advertencia' }))

    expect(onAdministerDose).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not offer an update button for an omitted reminder', () => {
    render(
      <NurseRemindersView
        reminders={[{ ...reminder, estado: 'Omitida' }]}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Ver alerta de dosis duplicada' })).toBeNull()
  })

  it('still offers administration for a pending reminder', () => {
    const onAdministerDose = vi.fn()
    render(
      <NurseRemindersView
        reminders={[{ ...reminder, estado: 'Pendiente' }]}
        onAdministerDose={onAdministerDose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Marcar Administrada' }))

    expect(onAdministerDose).toHaveBeenCalledWith(reminder.id)
  })
})
