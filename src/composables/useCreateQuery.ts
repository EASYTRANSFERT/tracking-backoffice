import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Ouvre la création demandée par un lien `?create=1` (guide de démarrage), puis retire le paramètre de l'adresse. */
export function useCreateQuery(open: () => void) {
  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    if (!route.query.create) return
    open()
    void router.replace({ query: { ...route.query, create: undefined } })
  })
}
