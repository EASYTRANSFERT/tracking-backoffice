# Intégration frontend de l’API

## Séparation des responsabilités

- Les pages et composants gèrent uniquement l’affichage, les formulaires et la navigation.
- Les stores Pinia conservent l’état, la pagination et adaptent les DTO aux modèles d’affichage.
- Les services Axios sont les seuls fichiers qui connaissent les routes HTTP.
- `api-client.ts` ajoute le Bearer token et rejoue une requête après renouvellement de session.
- Chaque commande de création ou mutation reçoit une nouvelle valeur `Idempotency-Key`.

## Session et cache

- La session d’authentification est conservée dans `sessionStorage`.
- L’access token, le refresh token rotatif et leur expiration sont supprimés à la déconnexion.
- Les données métier restent en mémoire dans Pinia afin de ne pas conserver de données personnelles dans le navigateur.
- Les indicateurs `hasLoaded` évitent de recharger les catalogues à chaque navigation.
- Les caches opérateur et entreprise sont vidés à la déconnexion.
- Une actualisation restaure la session puis recharge uniquement les données nécessaires au profil actif.

## Services disponibles

### Entreprises — `tenant.service.ts`

- lister et consulter les entreprises ;
- créer et modifier une entreprise ;
- activer ou suspendre une entreprise ;
- attribuer une offre avec l’endpoint `plan`.

### Offres — `offer.service.ts`

- lister les offres ;
- créer une offre.

Swagger ne fournit pas de modification ni de suppression d’offre. Ces actions sont masquées avec l’API réelle.

### Utilisateurs — `user.service.ts`

- lister et consulter les utilisateurs ;
- créer et modifier un utilisateur ;
- désactiver un utilisateur ;
- modifier son mot de passe.

Swagger ne fournit pas de réactivation ni d’import en masse. Ces actions restent limitées au mode mock.

### Équipes — `team.service.ts`

- lister et consulter les équipes ;
- créer, renommer et supprimer une équipe.

## Pagination

Les entreprises, offres, utilisateurs et équipes utilisent la pagination par curseur du Swagger. Chaque store conserve le curseur suivant, l’historique des curseurs précédents et le numéro de page affiché.

Les stores ne chargent plus artificiellement 200 éléments pour les paginer côté navigateur. Les tables de prototype restent paginées localement tant qu’aucun endpoint n’existe.

## Profils

- **Opérateur KAYBIC** : entreprises et offres réelles ; supervision visible uniquement avec les mocks.
- **Administrateur entreprise** : CRUD utilisateurs et équipes ; sites, missions et QR codes uniquement avec les mocks.
- **Superviseur** : tableau de bord et consultation en lecture seule des utilisateurs et équipes autorisés.
- **Chef d’équipe (`TEAM_LEAD`)** : consultation en lecture seule limitée au périmètre renvoyé par l’API.

Le backend reste responsable du RBAC, du tenant et du périmètre d’équipe.

## Changement de mot de passe

`PasswordChangeForm.vue` réalise la saisie et la validation. `ChangePasswordPage.vue` appelle `authStore.changePassword`, qui délègue à `userService.updatePassword` :

`PATCH /users/{userId}/password`

## Mode mock MSW

`src/mocks/handlers.ts` reproduit les 25 opérations publiées dans le Swagger : authentification, TOTP, renouvellement, déconnexion, step-up, entreprises, offres, utilisateurs, mot de passe et équipes.

Les handlers utilisent des motifs indépendants du domaine. Le mode mock continue donc de fonctionner si `VITE_API_BASE_URL` change.

```env
VITE_ENABLE_MOCKS=true
```

Il faut redémarrer Vite après une modification du fichier `.env`.

| Profil | E-mail | Mot de passe | TOTP |
|---|---|---|---|
| Opérateur | `operateur@kaybic.africa` | `Password123!` | `123456` |
| Administrateur | `admin@entreprise.test` | `Password123!` | `123456` |
| Superviseur | `superviseur@entreprise.test` | `Password123!` | `123456` |
| Chef d’équipe | `chef.equipe@entreprise.test` | `Password123!` | `123456` |

## Données absentes du Swagger actuel

Le Swagger ne publie pas encore d’endpoint pour les sites, missions, QR codes, appareils, pointages, rapports, journaux d’audit ou interventions support.

- Ces menus sont cachés hors mode mock.
- Les widgets non alimentables ont été remplacés par des données réellement disponibles.
- Les chiffres calculés sur une page API portent la mention « sur la page chargée ».
- Les colonnes non fournies par les DTO ont été retirées des tables réelles.

Quand de nouveaux endpoints seront publiés, ajouter dans l’ordre : les types, le service, le store, puis connecter les composants existants.
