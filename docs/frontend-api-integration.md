# Intégration frontend de l’API

## Séparation des responsabilités

- Les pages et composants gèrent uniquement l’affichage, les formulaires et la navigation.
- Les stores Pinia conservent l’état de l’interface et adaptent les DTO API aux modèles d’affichage.
- Les services Axios sont les seuls fichiers qui connaissent les routes HTTP.
- `api-client.ts` ajoute le Bearer token et rejoue une requête après renouvellement de session.
- Chaque commande de création ou mutation reçoit une nouvelle valeur `Idempotency-Key`.

## Services ajoutés

### Entreprises — `tenant.service.ts`

- lister et consulter les entreprises ;
- créer et modifier une entreprise ;
- activer ou suspendre une entreprise ;
- attribuer une offre avec l’endpoint `plan`.

Le formulaire ne transmet que les champs documentés par Swagger : nom, code pays, fuseau horaire, période contractuelle et offre. Les contacts et le premier administrateur ne font pas partie de `CreateTenantDto`.

### Offres — `offer.service.ts`

- lister les offres ;
- créer une offre.

Swagger ne fournit pas de modification ni de suppression d’offre. Ces actions sont donc masquées lorsque l’application utilise l’API réelle. Le prix a également été retiré des écrans API, car il n’existe pas dans `OfferResponse`.

### Utilisateurs — `user.service.ts`

- lister et consulter les utilisateurs ;
- créer et modifier un utilisateur ;
- désactiver un utilisateur ;
- modifier son mot de passe.

Swagger ne fournit pas de réactivation ni d’import en masse. L’interface ne présente ces actions qu’en mode mock.

### Équipes — `team.service.ts`

- lister et consulter les équipes ;
- créer, renommer et supprimer une équipe.

Le DTO de création d’équipe ne contient que `name`. Le chef d’équipe est déterminé par l’utilisateur portant le rôle `TEAM_LEAD` et son `teamId`.

## Authentification et step-up

La session est stockée dans `sessionStorage`, restaurée au démarrage et renouvelée avec le refresh token. Le endpoint `/auth/step-up` utilise désormais le client Axios authentifié. `authStore.stepUp(code)` remplace l’access token par le token élevé sans perdre le refresh token.

## Mode mock et mode réel

- `VITE_ENABLE_MOCKS=true` : les stores conservent les données locales et MSW intercepte l’authentification.
- `VITE_ENABLE_MOCKS=false` : les stores chargent les entreprises, offres, utilisateurs et équipes depuis l’API.

Les sites, missions, QR codes, appareils, journaux et interventions support restent locaux, car aucun endpoint correspondant n’est exposé dans la version Swagger analysée. Ils ne doivent pas être raccordés à une route inventée.
