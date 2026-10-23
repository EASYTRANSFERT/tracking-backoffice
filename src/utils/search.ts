/** Texte comparable pour une recherche : sans accents, en minuscules, sans espaces autour. */
export const normalizeForSearch = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr').trim()

/**
 * Vrai si la recherche est vide, ou si l'un des textes la contient, sans tenir compte
 * des accents ni de la casse (« equipe » trouve « Équipe »). Accepte null : un champ
 * Vuetify effacé par sa croix vaut null.
 */
export function matchesSearch(query: string | null | undefined, ...values: (string | null | undefined)[]) {
  const normalizedQuery = normalizeForSearch(query ?? '')
  return !normalizedQuery || values.some((value) => Boolean(value) && normalizeForSearch(value!).includes(normalizedQuery))
}
