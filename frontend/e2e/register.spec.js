import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Sesión no iniciada.' }),
    }),
  )
})

test('registration fields change with the selected role', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Crear cuenta/ }).click()

  await page.getByRole('button', { name: 'Médico' }).click()
  await expect(page.getByLabel('Matrícula profesional')).toBeVisible()
  await expect(page.getByLabel('Especialidad')).toBeVisible()
  await expect(page.getByLabel('Código de habilitación')).toBeVisible()

  await page.getByRole('button', { name: 'Enfermería' }).click()
  await expect(page.getByLabel('Matrícula profesional')).toBeVisible()
  await expect(page.getByLabel('Especialidad')).toHaveCount(0)

  await page.getByRole('button', { name: 'Padre / Madre' }).click()
  await expect(page.getByLabel('Teléfono (opcional)')).toBeVisible()
  await expect(page.getByLabel('Matrícula profesional')).toHaveCount(0)
})

test('password mismatch is announced before any registration request', async ({ page }) => {
  let registrationRequests = 0
  await page.route('**/api/auth/register', async (route) => {
    registrationRequests += 1
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'fake-token', user: { id: 1 } }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /Crear cuenta/ }).click()
  await page.getByLabel('Nombre completo').fill('Familia Ficticia')
  await page.getByLabel('DNI').fill('12345678')
  await page.getByLabel('Correo electrónico').fill('familia@example.test')
  await page.getByLabel('Contraseña', { exact: true }).fill('Fictitious123!')
  await page.getByLabel('Repetir contraseña', { exact: true }).fill('Different123!')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page.getByRole('alert')).toHaveText('Las contraseñas no coinciden.')
  expect(registrationRequests).toBe(0)
})
