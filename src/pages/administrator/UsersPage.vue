<script setup lang="ts">
import { storeToRefs } from 'pinia'; import { useRouter } from 'vue-router'; import UserTable from '@/Components/users/UserTable.vue'; import PageHeader from '@/Components/layout/PageHeader.vue'; import { useAdministratorStore } from '@/stores/administrator.store'; import type { EnterpriseUser } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore(); const { users } = storeToRefs(store)
const view = (user: EnterpriseUser) => router.push({ name: 'admin-user-details', params: { userId: user.id } }); const edit = (user: EnterpriseUser) => router.push({ name: 'admin-user-edit', params: { userId: user.id } })
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Utilisateurs</template><template #description>Gérez les membres, leurs rôles et leurs équipes.</template><template #actions><v-btn variant="outlined" color="secondary" prepend-icon="mdi-file-upload-outline" :to="{ name: 'admin-user-import' }">Importer</v-btn><v-btn color="primary" prepend-icon="mdi-account-plus-outline" :to="{ name: 'admin-user-create' }">Nouvel utilisateur</v-btn></template></PageHeader><UserTable :users="users" @view="view" @edit="edit" @change-status="store.toggleUserStatus($event.id)" /></div></template>

