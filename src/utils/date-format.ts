/** Date et heure en toutes lettres (« mardi 3 novembre 2026 à 10:30 »), ou un libellé quand elle manque. */
export const formatLongDateTime = (value?: string, fallback = 'Non renseignée') => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
  : fallback
