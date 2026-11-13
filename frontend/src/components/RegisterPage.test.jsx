import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterPage from './RegisterPage.jsx'
import { register } from '../services/api.js'

vi.mock('../services/api.js', () => ({
  register: vi.fn(),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows fields according to the selected account role', () => {
    render(<RegisterPage onBackToLogin={vi.fn()} onRegistered={vi.fn()} />)

    expect(screen.getByLabelText('Teléfono (opcional)')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Médico' }))

    expect(screen.getByLabelText('Matrícula profesional')).toBeTruthy()
    expect(screen.getByLabelText('Especialidad')).toBeTruthy()
    expect(screen.getByLabelText('Código de habilitación')).toBeTruthy()
    expect(screen.queryByLabelText('Teléfono (opcional)')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Enfermería' }))
    expect(screen.getByLabelText('Matrícula profesional')).toBeTruthy()
    expect(screen.queryByLabelText('Especialidad')).toBeNull()
  })

  it('shows password mismatch feedback without calling the API', async () => {
    render(<RegisterPage onBackToLogin={vi.fn()} onRegistered={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Familia Ficticia' },
    })
    fireEvent.change(screen.getByLabelText('DNI'), {
      target: { value: '12345678' },
    })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'familia@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Fictitious123!' },
    })
    fireEvent.change(screen.getByLabelText('Repetir contraseña'), {
      target: { value: 'Different123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Las contraseñas no coinciden.')
    expect(register).not.toHaveBeenCalled()
  })
})
