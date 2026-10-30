import { AxiosError, type AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { userService } from '@/Services/user.service'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'
import { assignableRoleOptions, userRoleErrorMessage } from '@/utils/user-role'
import type { UserResponse } from '@/types/user'

const apiError = (status: number, data: unknown) => new AxiosError('error', 'ERR_BAD_REQUEST', undefined, undefined, { status, data } as AxiosResponse)
const user: UserResponse = { id: 'usr_1', matricule: 'M-1', names: 'Assia Jean', phone: '+2250700000001', roles: ['AGENT'], status: 'ACTIVE', createdAt: '', updatedAt: '' }

describe('user role', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('never offers the administrator role', () => {
    expect(assignableRoleOptions.map((option) => option.value)).toEqual(['supervisor', 'teamLeader', 'agent'])
  })

  it('translates the role refusals', () => {
    expect(userRoleErrorMessage(apiError(409, { code: 'LAST_ADMIN_REQUIRED' }))).toMatch(/au moins un administrateur/)
    expect(userRoleErrorMessage(apiError(403, { code: 'ROLE_NOT_ASSIGNABLE' }))).toMatch(/ne peut pas être attribué/)
    expect(userRoleErrorMessage(apiError(409, { code: 'OTHER' }))).toBeNull()
  })

  it('steps up with the TOTP code, then sends only the roles', async () => {
    const stepUp = vi.spyOn(useAuthStore(), 'stepUp').mockResolvedValue()
    const update = vi.spyOn(userService, 'updateRoles').mockResolvedValue({ ...user, roles: ['SUPERVISOR'] })
    const store = useAdministratorStore()
    await store.changeUserRole('usr_1', 'supervisor', '123456')
    expect(stepUp).toHaveBeenCalledWith('123456')
    expect(update).toHaveBeenCalledWith('usr_1', { roles: ['SUPERVISOR'] })
    expect(store.findUser('usr_1')?.role).toBe('supervisor')
  })
})
