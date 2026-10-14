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
    prototypeOnly: true,
  },
  {
    title: 'Dashboard',
    routeName: 'admin-dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['administrator'],
  },
  {
    title: 'Agents',
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
    prototypeOnly: true,
  },
  {
    title: 'Missions',
    routeName: 'admin-missions',
    icon: 'mdi-clipboard-text-clock-outline',
    allowedRoles: ['administrator'],
    prototypeOnly: true,
  },
  {
    title: 'QR codes',
    routeName: 'admin-qr-codes',
    icon: 'mdi-qrcode-scan',
    allowedRoles: ['administrator'],
    prototypeOnly: true,
  },
  {
    title: 'Dashboard',
    routeName: 'supervisor-dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['supervisor'],
  },
  {
    title: 'Agents', routeName: 'supervisor-users', icon: 'mdi-account-group-outline', allowedRoles: ['supervisor'],
  },
  {
    title: 'Équipes', routeName: 'supervisor-teams', icon: 'mdi-account-multiple-outline', allowedRoles: ['supervisor'],
  },
  {
    title: 'Dashboard',
    routeName: 'team-leader-dashboard',
    iconSrc: dashboardIcon,
    allowedRoles: ['teamLeader'],
  },
  {
    title: 'Agents', routeName: 'team-leader-users', icon: 'mdi-account-group-outline', allowedRoles: ['teamLeader'],
  },
  {
    title: 'Équipes', routeName: 'team-leader-teams', icon: 'mdi-account-multiple-outline', allowedRoles: ['teamLeader'],
  },
]
