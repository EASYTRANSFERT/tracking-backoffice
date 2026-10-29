import dashboardIcon from '@/assets/Group 17.svg'
import buildingIcon from '@/assets/building (1).png'
import offerIcon from '@/assets/coin.png'
import type { NavigationItem } from '@/types/roles'

export const dashboardNavigation: NavigationItem[] = [
  {
    title: 'Acceuil',
    routeName: 'dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['operator'],
  },
  {
    title: 'Entreprises',
    routeName: 'companies',
    iconSrc: buildingIcon,
    allowedRoles: ['operator'],
  },
  {
    title: 'Offres',
    routeName: 'offers',
    iconSrc: offerIcon,
    allowedRoles: ['operator'],
  },
  {
    title: 'Journal d’audit',
    routeName: 'audit-logs',
    icon: 'mdi-history',
    allowedRoles: ['operator'],
  },
  {
    title: 'Supervision',
    routeName: 'platform-monitoring',
    icon: 'mdi-monitor-dashboard',
    allowedRoles: ['operator'],
    prototypeOnly: true,
  },
  {
    title: 'Acceuil',
    routeName: 'admin-dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['administrator'],
  },
  {
    title: 'Employés',
    routeName: 'admin-users',
    icon: 'mdi-account-group-outline',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Équipes',
    routeName: 'admin-teams',
    icon: 'mdi-account-multiple-outline',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Sites',
    routeName: 'admin-sites',
    icon: 'mdi-map-marker-radius-outline',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Missions',
    routeName: 'admin-missions',
    icon: 'mdi-clipboard-text-clock-outline',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Périodes',
    routeName: 'admin-periods',
    icon: 'mdi-calendar-range',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Appareils',
    routeName: 'admin-devices',
    icon: 'mdi-cellphone-link',
    allowedRoles: ['administrator'],
  },
  {
    title: 'QR codes',
    routeName: 'admin-qr-codes',
    icon: 'mdi-qrcode-scan',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Journal d’audit',
    routeName: 'admin-audit-logs',
    icon: 'mdi-history',
    allowedRoles: ['administrator'],
  },
  {
    title: 'Acceuil',
    routeName: 'supervisor-dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['supervisor'],
  },
  {
    title: 'Mes missions',
    routeName: 'supervisor-missions',
    icon: 'mdi-clipboard-text-clock-outline',
    allowedRoles: ['supervisor'],
  },
  {
    title: 'Périodes',
    routeName: 'supervisor-periods',
    icon: 'mdi-calendar-range',
    allowedRoles: ['supervisor'],
  },

]
