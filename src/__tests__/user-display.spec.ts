import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useUserDisplay } from '@/composables/useUserDisplay'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'
import type { EnterpriseUser } from '@/types/administrator'
import type { UserResponse } from '@/types/user'

const admin: EnterpriseUser = {
  id: 'usr_admin', employeeNumber: 'A1', firstName: 'Jécolia', lastName: 'Tiéléo', email: 'a@x.ci', phone: '+2250700000000',
  role: 'administrator', status: 'active', createdAt: '2026-10-01T00:00:00.000Z',
}

describe('useUserDisplay', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows the name and the real role of a known account', () => {
    useAdministratorStore().users = [admin]
    const { userName } = useUserDisplay()
    expect(userName('usr_admin')).toBe('Jécolia Tiéléo')
    expect(userName('usr_admin', true)).toBe('Jécolia Tiéléo · Administrateur')
  })

  it('recognises the signed-in user even when the API cannot return their profile', () => {
    useAuthStore().currentUser = { id: 'usr_me', names: 'Yann Kouassi' } as UserResponse
    expect(useUserDisplay().userName('usr_me', true)).toBe('Yann Kouassi (vous)')
  })

  it('never shows a raw id nor a guessed role for an account it cannot read', () => {
    const { userName } = useUserDisplay()
    expect(userName('usr_01a13b5a837b77128565115e8cfc6dba', true)).toBe('un autre utilisateur')
    expect(userName(undefined)).toBe('—')
  })
})
