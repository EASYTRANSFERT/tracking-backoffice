import { test, expect, type Page } from '@playwright/test'

async function loginAs(
  page: Page,
  email: string,
) {
  await page.goto('/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill('Password123!')
  await page.getByRole('button', { name: 'Me connecter' }).click()
  await page.locator('#totp-code').fill('123456')
  await page.getByRole('button', { name: 'Confirmer' }).click()
}

test('redirects the root route to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
})

test('protects authenticated routes', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

const profileCases = [
  ['operateur@kaybic.africa', '/dashboard'],
  ['admin@entreprise.test', '/admin'],
  ['superviseur@entreprise.test', '/supervisor'],
  ['chef.equipe@entreprise.test', '/team-leader'],
] as const

for (const [email, expectedPath] of profileCases) {
  test(`redirects ${email} to ${expectedPath}`, async ({ page }) => {
    await loginAs(page, email)
    await expect(page).toHaveURL(new RegExp(`${expectedPath}$`))
  })
}

test('renders the operator company catalogue', async ({ page }) => {
  await loginAs(page, 'operateur@kaybic.africa')
  await page.getByText('Entreprises', { exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Entreprises', exact: true })).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Ageroute')
  await expect(page.getByText('Suspendue', { exact: true })).toBeVisible()
})
