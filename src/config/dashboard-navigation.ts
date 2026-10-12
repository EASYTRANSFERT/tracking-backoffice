import dashboardIcon from '@/assets/Group 17.svg'
import buildingIcon from '@/assets/building (1).png'
import offerIcon from '@/assets/coin.png'
import type { NavigationItem } from '@/types/roles'

export const dashboardNavigation: NavigationItem[] = [
  {
    title: 'Dashboard',
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
    title: 'Supervision',
    routeName: 'platform-monitoring',
    icon: 'mdi-monitor-dashboard',
    allowedRoles: ['operator'],
  },
  {
    title: 'Dashboard',
    routeName: 'admin-dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['administrator'],
  },
  {
    title: 'Utilisateurs',
    routeName: 'admin-users',
    icon: 'mdi-account-group-outline',
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
    title: 'QR codes',
    routeName: 'admin-qr-codes',
    icon: 'mdi-qrcode-scan',
    allowedRoles: ['administrator'],
  },
]
