import { ref } from 'vue'

/** Suit une action asynchrone en cours, pour afficher un indicateur sur le bouton qui la déclenche. */
export function useBusy() {
  const isBusy = ref(false)

  async function run<T>(task: () => Promise<T>) {
    isBusy.value = true
    try {
      return await task()
    } finally {
      isBusy.value = false
    }
  }

  return { isBusy, run }
}
