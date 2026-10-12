import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { mockEnterpriseUsers, mockMissions, mockSites } from '@/mocks/administrator-data'
import type { EnterpriseUserInput, MissionInput, SiteInput } from '@/types/administrator'

export const useAdministratorStore = defineStore('administrator', () => {
  const users = ref(structuredClone(mockEnterpriseUsers))
  const sites = ref(structuredClone(mockSites))
  const missions = ref(structuredClone(mockMissions))

  const activeUsersCount = computed(() => users.value.filter((user) => user.status === 'active').length)
  const invitedUsersCount = computed(() => users.value.filter((user) => user.status === 'invited').length)
  const activeSitesCount = computed(() => sites.value.filter((site) => site.status === 'active').length)
  const ongoingMissionsCount = computed(() => missions.value.filter((mission) => mission.status === 'ongoing').length)

  const getUserById = (id: string) => users.value.find((user) => user.id === id)
  const getSiteById = (id: string) => sites.value.find((site) => site.id === id)
  const getMissionById = (id: string) => missions.value.find((mission) => mission.id === id)

  function createUser(input: EnterpriseUserInput) {
    const id = `user-${Date.now()}`
    users.value.unshift({ ...input, id, status: 'invited', createdAt: new Date().toISOString() })
    return id
  }

  function updateUser(id: string, input: EnterpriseUserInput) {
    const user = getUserById(id)
    if (user) Object.assign(user, input)
  }

  function toggleUserStatus(id: string) {
    const user = getUserById(id)
    if (user) user.status = user.status === 'disabled' ? 'active' : 'disabled'
  }

  function importUsers(count: number) {
    const now = Date.now()
    for (let index = 0; index < count; index += 1) {
      users.value.unshift({
        id: `imported-${now}-${index}`,
        employeeNumber: `IMP-${String(now).slice(-4)}-${index + 1}`,
        firstName: `Utilisateur`,
        lastName: `Importé ${index + 1}`,
        email: `importe.${now}.${index + 1}@entreprise.ci`,
        phone: '+225 00 00 00 00 00',
        role: 'agent',
        team: 'À affecter',
        status: 'invited',
        createdAt: new Date().toISOString(),
      })
    }
  }

  function createSite(input: SiteInput) {
    const id = `site-${Date.now()}`
    sites.value.unshift({ ...input, id, qrCode: `KBA-${id.toUpperCase()}`, status: 'active', createdAt: new Date().toISOString() })
    return id
  }

  function updateSite(id: string, input: SiteInput) {
    const site = getSiteById(id)
    if (site) Object.assign(site, input)
  }

  function toggleSiteStatus(id: string) {
    const site = getSiteById(id)
    if (site) site.status = site.status === 'active' ? 'inactive' : 'active'
  }

  function regenerateQrCode(id: string) {
    const site = getSiteById(id)
    if (site) site.qrCode = `KBA-${id.toUpperCase()}-${Date.now()}`
  }

  function createMission(input: MissionInput) {
    const id = `mission-${Date.now()}`
    missions.value.unshift({ ...input, id, status: 'scheduled' })
    return id
  }

  function updateMission(id: string, input: MissionInput) {
    const mission = getMissionById(id)
    if (mission) Object.assign(mission, input)
  }

  function cancelMission(id: string) {
    const mission = getMissionById(id)
    if (mission) mission.status = 'cancelled'
  }

  return {
    users, sites, missions,
    activeUsersCount, invitedUsersCount, activeSitesCount, ongoingMissionsCount,
    getUserById, getSiteById, getMissionById,
    createUser, updateUser, toggleUserStatus, importUsers,
    createSite, updateSite, toggleSiteStatus, regenerateQrCode,
    createMission, updateMission, cancelMission,
  }
})
