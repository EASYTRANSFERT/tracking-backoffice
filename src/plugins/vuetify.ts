import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import { applyColorMode, storedColorMode, themeNames } from '@/composables/useColorMode'

const initialMode = storedColorMode()
applyColorMode(initialMode)

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },

  theme: {
    defaultTheme: themeNames[initialMode],

    themes: {
      kaybicLight: {
        dark: false,

        colors: {
          primary: '#D80F16',
          secondary: '#848484',
          background: '#F6F6F7',
          surface: '#FFFFFF',
          'surface-variant': '#F1F2F4',
          'on-background': '#252830',
          'on-surface': '#252830',
          error: '#B3261E',
          success: '#2E7D4F',
          warning: '#A76000',
        },
      },

      // Noir pur (#000000) en fond ; les cartes sont à peine plus claires pour rester lisibles. Le rouge reste la couleur principale.
      kaybicDark: {
        dark: true,

        colors: {
          primary: '#E5252B',
          secondary: '#9A9EA8',
          background: '#000000',
          surface: '#0B0B0B',
          'surface-variant': '#1A1A1A',
          'on-background': '#F2F2F2',
          'on-surface': '#F2F2F2',
          error: '#FF5A52',
          success: '#4CAF7A',
          warning: '#E0A040',
        },
      },
    },
  },

  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 1,
    },

    VBtn: {
      rounded: 'lg',
      style: 'text-transform: none; letter-spacing: 0;',
    },

    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },

    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },

    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },

    VDialog: {
      scrollable: true,
    },

    // En-tête figé : avec beaucoup de lignes, c'est le tableau qui défile (hauteur bornée dans main.css).
    VTable: {
      fixedHeader: true,
    },

    VChip: {
      rounded: 'xl',
      size: 'small',
    },
  },
})
