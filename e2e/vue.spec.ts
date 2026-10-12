import { test, expect } from '@playwright/test'

test('redirects the root route to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
})

test('renders the operator company catalogue', async ({ page }) => {
  await page.goto('/dashboard/companies')
  await expect(page.getByRole('heading', { name: 'Entreprises', exact: true })).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Ageroute')
  await expect(page.getByText('Suspendue', { exact: true })).toBeVisible()
})
