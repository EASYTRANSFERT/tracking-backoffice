import type { UserRole } from '@/types/roles'

/** Une étape de la visite : l'élément désigné par son attribut `data-tour`, ou aucun (fenêtre centrée). */
export interface ProductTourStep {
  target?: string
  title: string
  description: string
}

/** Entrée du menu latéral, désignée par le nom de sa route (attribut posé par AppSidebar). */
const nav = (routeName: string, title: string, description: string): ProductTourStep => ({ target: `nav-${routeName}`, title, description })

const welcome = (description: string): ProductTourStep => ({ title: 'Bienvenue sur KAYBIC', description })

/** Fin commune : le compte, le thème et la possibilité de revoir la visite. */
const accountSteps: ProductTourStep[] = [
  { target: 'color-mode', title: 'Mode clair ou sombre', description: 'Basculez l’affichage selon votre confort ; le choix est retenu sur cet appareil.' },
  { target: 'user-menu', title: 'Votre compte', description: 'Paramètres, déconnexion, et « Revoir la visite » pour relancer ce tutoriel à tout moment.' },
]

/** Le menu latéral est masqué sur petit écran : ses étapes sont alors sautées et ce bouton les remplace. */
const menuToggle: ProductTourStep = { target: 'menu-toggle', title: 'Le menu', description: 'Ouvrez le menu pour accéder à toutes les rubriques.' }

export const productTourSteps: Record<UserRole, ProductTourStep[]> = {
  operator: [
    welcome('Une visite rapide de l’espace opérateur : vous y gérez les entreprises clientes de la plateforme et leurs offres.'),
    menuToggle,
    nav('dashboard', 'Accueil', 'L’état de la plateforme en un coup d’œil : entreprises actives, en attente, suspendues.'),
    nav('companies', 'Entreprises', 'Créez une entreprise, attribuez-lui une offre, ajoutez son administrateur, suspendez-la ou réactivez-la.'),
    nav('offers', 'Offres', 'Le catalogue des offres proposées aux entreprises : limites, options et tarifs.'),
    nav('demo-requests', 'Demandes de démo', 'Les prospects qui ont demandé une démonstration : suivez chaque demande jusqu’à sa conversion.'),
    nav('audit-logs', 'Journal d’audit', 'Toutes les actions sensibles réalisées sur la plateforme, toutes entreprises confondues.'),
    nav('platform-monitoring', 'Supervision', 'L’état technique de la plateforme.'),
    { target: 'page-actions', title: 'Actions rapides', description: 'Les actions principales de chaque page se trouvent ici, en haut à droite.' },
    ...accountSteps,
  ],
  administrator: [
    welcome('Une visite rapide de l’espace administrateur : vous y organisez votre entreprise, ses équipes et leurs missions.'),
    menuToggle,
    nav('admin-dashboard', 'Accueil', 'Les chiffres clés de votre entreprise : agents actifs, équipes, appareils à activer.'),
    nav('admin-users', 'Employés', 'Créez ou importez les comptes : administrateurs, superviseurs, chefs d’équipe et agents.'),
    nav('admin-teams', 'Équipes', 'Regroupez les agents en équipes, chacune avec son chef d’équipe.'),
    nav('admin-sites', 'Sites', 'Les lieux d’intervention, leur zone de pointage et le planning des agents.'),
    nav('admin-missions', 'Missions', 'Les missions confiées à un superviseur, avec leurs sites.'),
    nav('admin-checks', 'Contrôles', 'Les contrôles de présence envoyés aux agents pendant leur service.'),
    nav('admin-periods', 'Périodes', 'Les périodes de travail à valider puis clôturer, équipe par équipe.'),
    nav('admin-adjustments', 'Régularisations', 'Les corrections apportées aux pointages, avec leur motif.'),
    nav('admin-devices', 'Appareils', 'Les téléphones des agents : activation, remplacement, révocation.'),
    nav('admin-qr-codes', 'QR codes', 'Les QR codes à afficher sur chaque site pour le pointage.'),
    nav('admin-audit-logs', 'Journal d’audit', 'Toutes les actions sensibles réalisées dans votre entreprise.'),
    ...accountSteps,
    { target: 'onboarding-start', title: 'Par où commencer ?', description: 'Ce bouton vous guide étape par étape pour mettre votre entreprise en place : comptes, équipes, missions, sites…' },
  ],
  supervisor: [
    welcome('Une visite rapide de l’espace superviseur : vous y suivez vos missions, vos sites et la présence de vos équipes.'),
    menuToggle,
    nav('supervisor-dashboard', 'Accueil', 'Vos missions en cours et à venir, vos sites et vos équipes.'),
    nav('supervisor-missions', 'Mes missions', 'Les missions qui vous sont confiées, avec leurs sites et leur planning.'),
    nav('supervisor-checks', 'Contrôles', 'Déclenchez et suivez les contrôles de présence de vos agents.'),
    nav('supervisor-periods', 'Périodes', 'Validez les pointages de vos équipes, période par période.'),
    nav('supervisor-adjustments', 'Régularisations', 'Corrigez un pointage erroné, avec son motif.'),
    ...accountSteps,
    { target: 'onboarding-start', title: 'Par où commencer ?', description: 'Ce bouton vous guide étape par étape dans vos premières actions.' },
  ],
}
