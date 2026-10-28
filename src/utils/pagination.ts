/** Page d'une liste paginée par curseur, telle que la renvoie l'API. */
interface CursorPage<T> {
  items: T[]
  nextCursor?: string | null
}

/** Toutes les pages d'une liste, en suivant nextCursor jusqu'à la dernière (200 éléments par appel). */
export async function listAllPages<T>(fetchPage: (query: { cursor?: string; limit: number }) => Promise<CursorPage<T>>): Promise<T[]> {
  const items: T[] = []
  let cursor: string | undefined
  do {
    const page = await fetchPage({ cursor, limit: 200 })
    items.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return items
}
