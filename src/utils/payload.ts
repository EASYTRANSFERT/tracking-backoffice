/** Champs de `next` qui diffèrent de `current` : une modification n'envoie que ce qui change, jamais l'ensemble du formulaire. */
export function changedFields<T extends object>(current: Partial<T>, next: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(next).filter(([key, value]) => value !== undefined && value !== (current as Record<string, unknown>)[key]),
  ) as Partial<T>
}
