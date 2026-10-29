import { computed } from 'vue'
import { useTheme } from 'vuetify'

export type ColorMode = 'light' | 'dark'

const STORAGE_KEY = 'kaybic.color-mode'

/** Noms des thèmes Vuetify (plugins/vuetify.ts) selon le mode. */
export const themeNames = { light: 'kaybicLight', dark: 'kaybicDark' } as const

/** Mode choisi lors d'une visite précédente ; clair par défaut. */
export function storedColorMode(): ColorMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Le CSS (main.css) et la variante Tailwind `dark:` s'appuient sur cet attribut de <html>. */
export function applyColorMode(mode: ColorMode) {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
}

export function useColorMode() {
  const theme = useTheme()
  const isDark = computed(() => theme.global.name.value === themeNames.dark)

  function setMode(mode: ColorMode) {
    theme.global.name.value = themeNames[mode]
    applyColorMode(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour cette visite seulement.
    }
  }

  const toggle = () => setMode(isDark.value ? 'light' : 'dark')

  /** Écrans publics (connexion, MFA…) : toujours clairs, sans toucher au choix enregistré. */
  function showLight() {
    theme.global.name.value = themeNames.light
    applyColorMode('light')
  }

  /** Tableau de bord : on retrouve le mode choisi par l'utilisateur. */
  function showStored() {
    const mode = storedColorMode()
    theme.global.name.value = themeNames[mode]
    applyColorMode(mode)
  }

  return { isDark, setMode, toggle, showLight, showStored }
}
