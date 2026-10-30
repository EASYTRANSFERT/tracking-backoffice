import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'
import { enterpriseRoleLabels, nameOr } from '@/utils/people'

/**
 * Nom d'un compte à partir de son identifiant (l'API ne renvoie souvent que celui-là).
 * Un superviseur ne peut lire que les comptes de son périmètre : pour un autre compte on n'affiche jamais
 * l'identifiant brut, ni un rôle supposé, mais un libellé neutre.
 */
export function useUserDisplay() {
  const administratorStore = useAdministratorStore()
  const authStore = useAuthStore()

  /** `withRole` ajoute le rôle réel du compte quand on le connaît : « Prénom Nom · Administrateur ». */
  function userName(id?: string, withRole = false) {
    if (!id) return '—'
    const known = administratorStore.findUser(id)
    if (known) return withRole ? `${nameOr(known)} · ${enterpriseRoleLabels[known.role]}` : nameOr(known)
    if (id === authStore.currentUser?.id) return `${authStore.currentUser.names} (vous)`
    return 'un autre utilisateur'
  }

  return { userName }
}
