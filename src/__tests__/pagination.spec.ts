import { describe, expect, it, vi } from 'vitest'

import { listAllPages } from '@/utils/pagination'

describe('listAllPages', () => {
  it('follows nextCursor until the last page', async () => {
    const pages: Record<string, { items: number[]; nextCursor?: string | null }> = {
      start: { items: [1, 2], nextCursor: 'b' },
      b: { items: [3, 4], nextCursor: 'c' },
      c: { items: [5], nextCursor: null },
    }
    const fetchPage = vi.fn(async ({ cursor }: { cursor?: string; limit: number }) => pages[cursor ?? 'start']!)

    await expect(listAllPages(fetchPage)).resolves.toEqual([1, 2, 3, 4, 5])
    expect(fetchPage).toHaveBeenCalledTimes(3)
    expect(fetchPage).toHaveBeenNthCalledWith(2, { cursor: 'b', limit: 200 })
  })

  it('makes a single call when there is only one page', async () => {
    const fetchPage = vi.fn(async () => ({ items: ['a'] }))

    await expect(listAllPages(fetchPage)).resolves.toEqual(['a'])
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })
})
