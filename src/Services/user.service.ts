import { apiClient } from './api-client'

import type { UserResponse } from '@/types/user'

export const userService = {
  async findOne(userId: string): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(
      `/users/${userId}`,
    )

    return response.data
  },
}
