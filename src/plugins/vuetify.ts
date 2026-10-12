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
    },

    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },

    VChip: {
      rounded: 'xl',
      size: 'small',
    },
  },
})
