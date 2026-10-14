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

  await page.getByText('Solibra', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Activer' })).toBeEnabled()

  await page.getByRole('link', { name: 'Créer un administrateur' }).click()
  await expect(page).toHaveURL(/\/dashboard\/companies\/company-solibra\/administrators\/new$/)
  await expect(page.getByRole('heading', { name: 'Nouvel administrateur' })).toBeVisible()
})

test('uses the authenticated operator name in the dashboard header', async ({ page }) => {
  await loginAs(page, 'operateur@kaybic.africa')
  await expect(page.getByRole('heading', { name: 'Bonjour Martial Djezou' })).toBeVisible()
})

test('opens the agent directory from the administrator navigation', async ({ page }) => {
  await loginAs(page, 'admin@entreprise.test')
  await expect(page.getByRole('heading', { name: 'Missions récentes' })).toBeVisible()
  await expect(page.getByText('Actions rapides', { exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Agents', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/users$/)
  await expect(page.getByRole('heading', { name: 'Agents', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Équipes', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/teams$/)
  await expect(page.getByRole('heading', { name: 'Équipes', exact: true })).toBeVisible()
})

test('creates an agent without assigning a team', async ({ page }) => {
  await loginAs(page, 'admin@entreprise.test')
  await page.getByRole('link', { name: 'Agents', exact: true }).click()
  await page.getByRole('link', { name: 'Nouvel agent' }).click()

  await page.getByLabel('Prénom').fill('Nadia')
  await page.getByLabel('Nom', { exact: true }).fill('Koné')
  await page.getByLabel('Matricule').fill('AG-099')
  await page.getByLabel('E-mail professionnel').fill('nadia.kone@entreprise.test')
  await page.getByLabel('Téléphone').fill('+2250700000099')
  await page.getByLabel('Mot de passe temporaire').fill('MotDePasse123!')

  await expect(page.getByText('Facultatif — l’agent pourra être ajouté à une équipe plus tard.')).toBeVisible()
  await page.getByRole('button', { name: 'Créer et inviter' }).click()

  await expect(page.getByRole('heading', { name: 'Nadia Koné' })).toBeVisible()
  await expect(page.getByText('Aucune — ce rôle n’exige pas d’équipe')).toBeVisible()
})

test('creates a team with its required supervisor', async ({ page }) => {
  await loginAs(page, 'admin@entreprise.test')
  await page.getByRole('link', { name: 'Équipes', exact: true }).click()
  await page.getByRole('link', { name: 'Nouvelle équipe' }).click()

  await page.getByLabel('Nom de l’équipe').fill('Équipe Plateau')
  await page.getByLabel('Superviseur').click()
  await page.getByRole('option', { name: 'Yann Kouassi' }).click()

  const creationRequest = page.waitForRequest(
    (request) => request.url().endsWith('/teams') && request.method() === 'POST',
  )
  await page.getByRole('button', { name: 'Créer l’équipe' }).click()

  const payload = (await creationRequest).postDataJSON()
  expect(payload).toMatchObject({
    name: 'Équipe Plateau',
    supervisorUserId: 'user-2',
  })
  await expect(page.getByRole('table')).toContainText('Équipe Plateau')
  await expect(page.getByRole('table')).toContainText('Yann Kouassi')
})

for (const [email, settingsPath] of [
  ['operateur@kaybic.africa', '/dashboard/settings'],
  ['admin@entreprise.test', '/admin/settings'],
] as const) {
  test(`opens password settings for ${email}`, async ({ page }) => {
    await loginAs(page, email)
    await page.getByRole('link', { name: 'Paramètres', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${settingsPath}$`))
    await expect(page.getByRole('heading', { name: 'Paramètres', exact: true })).toBeVisible()

    await page.getByRole('link', { name: /Changer le mot de passe/ }).click()
    await expect(page).toHaveURL(/\/dashboard\/account\/password$/)
    await expect(page.getByRole('heading', { name: 'Sécurité du compte' })).toBeVisible()
  })
}

test('shows assigned missions on the supervisor dashboard', async ({ page }) => {
  await loginAs(page, 'superviseur@entreprise.test')
  await expect(page.getByRole('heading', { name: 'Mes missions' })).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Inventaire mensuel Vridi')
  await expect(page.getByRole('table')).toContainText('Contrôle dépôt Yopougon')

  await page.getByRole('link', { name: 'Agents', exact: true }).click()
  await expect(page).toHaveURL(/\/supervisor\/users$/)
  await expect(page.getByRole('heading', { name: 'Agents', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Équipes', exact: true }).click()
  await expect(page).toHaveURL(/\/supervisor\/teams$/)
  await expect(page.getByRole('heading', { name: 'Équipes', exact: true })).toBeVisible()
})
