/** Rayon de tolérance autour d'un site : en dessous, l'imprécision du GPS rendrait les pointages inutilisables. */
export const MIN_TOLERANCE_RADIUS_M = 100

/** Règle de saisie du rayon : un entier d'au moins 100 m. */
export const toleranceRadiusRule = (value: unknown) =>
  (Number.isInteger(Number(value)) && String(value).trim() !== '' && Number(value) >= MIN_TOLERANCE_RADIUS_M)
  || `Le rayon doit être d’au moins ${MIN_TOLERANCE_RADIUS_M} m`
