import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthenticatedDashboard from './AuthenticatedDashboard.jsx'

describe('AuthenticatedDashboard emergency profile access', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('hides emergency-profile controls from parents', () => {
    render(
      <AuthenticatedDashboard
        isDemo
        user={{ id: 101, name: 'Tutor Ficticio', role: 'PADRE_MADRE' }}
        onLogout={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Ficha de Emergencia' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Emergencia' })).toBeNull()
  })

  it('keeps emergency-profile controls available to professionals', () => {
    render(
      <AuthenticatedDashboard
        isDemo
        user={{ id: 102, name: 'Profesional Ficticio', role: 'MEDICO' }}
        onLogout={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Ficha de Emergencia' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Emergencia' })).toBeTruthy()
  })
})
