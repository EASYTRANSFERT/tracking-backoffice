import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },

  theme: {
    defaultTheme: 'kaybicLight',

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
