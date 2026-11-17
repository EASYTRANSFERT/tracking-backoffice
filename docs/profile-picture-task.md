# Tâche back-office : photo de profil des chefs d'équipe et des agents

## Contexte
L'API exige désormais une photo de profil à la création d'un chef d'équipe (`TEAM_LEAD`) ou d'un agent (`AGENT`). Sans photo, la création est refusée (400 `PROFILE_PHOTO_REQUIRED`). Les comptes back-office (admin, superviseur, opérateur) ne changent pas : ils se créent toujours en JSON, sans photo.

## Ce qui change côté API

**1. Création : `POST /users`**
- Pour un `TEAM_LEAD` ou un `AGENT`, la requête doit être en `multipart/form-data`, avec :
  - les champs habituels (`names`, `email`, `phone`, `role`, `teamId`, `password`) en champs texte ;
  - la photo dans le champ `photo`.
- Photo acceptée : JPEG, PNG ou WebP, 5 Mo au plus. Le type est vérifié sur le contenu du fichier, pas sur son extension.
- `role` doit être une seule valeur (`AGENT` ou `TEAM_LEAD`), jamais une liste.

**2. Nouvelle route : `PUT /users/:id/profile-photo`**
- `multipart/form-data`, champ `photo` obligatoire. Réservée aux rôles Admin et Operator.
- Ajoute ou remplace la photo d'un compte, y compris les comptes créés avant cette règle.
- Renvoie le `UserResponse` à jour.

**3. Lecture : `GET /users`, `GET /users/:id` et la réponse de création**
- Deux nouveaux champs :
  - `profilePhotoUrl?: string` : URL signée temporaire, absente si le compte n'a pas de photo ;
  - `profilePhotoUrlExpiresIn?: number` : sa durée de validité en secondes (300 par défaut).
- L'URL expire : ne pas la stocker ni la mettre en cache longtemps. Relire l'utilisateur, ou la liste, en donne une neuve.

**4. Nouveaux codes d'erreur**

| Code | Statut | Message à afficher |
|---|---|---|
| `PROFILE_PHOTO_REQUIRED` | 400 | Ajoutez une photo de profil pour un chef d'équipe ou un agent. |
| `PROFILE_PHOTO_INVALID` | 400 | La photo doit être une image JPEG, PNG ou WebP de 5 Mo au plus. |
| `PROFILE_PHOTO_UPLOAD_FAILED` | 502 | La photo n'a pas pu être enregistrée. Réessayez dans un instant. |
| (aucun code) | 413 | La photo dépasse 5 Mo. |

## Travail à faire dans `tracking-backoffice`

### 1. Types
`src/types/user.ts`, dans `UserResponse` :
```ts
/** URL signée temporaire, absente si le compte n'a pas de photo. Ne pas la stocker. */
profilePhotoUrl?: string
profilePhotoUrlExpiresIn?: number
```

`src/types/administrator.ts` :
- `EnterpriseUser` : ajouter `photoUrl?: string` ;
- `EnterpriseUserInput` : ajouter `photo?: File`.

### 2. Service : `src/Services/user.service.ts`
Envoyer un `FormData` quand une photo est fournie, et garder le JSON sinon.

```ts
function toFormData(payload: CreateUserRequest, photo: File): FormData {
  const body = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== '') body.append(key, String(value))
  }
  body.append('photo', photo)
  return body
}

// dans userService :
async create(payload: CreateUserRequest, photo?: File): Promise<UserResponse> {
  const body = photo ? toFormData(payload, photo) : payload
  const response = await apiClient.post<UserResponse>('/users', body, { headers: idempotencyHeaders() })
  return response.data
},

async replaceProfilePhoto(userId: string, photo: File): Promise<UserResponse> {
  const body = new FormData()
  body.append('photo', photo)
  const response = await apiClient.put<UserResponse>(`/users/${userId}/profile-photo`, body, { headers: idempotencyHeaders() })
  return response.data
},
```

Points d'attention :
- Ne pas fixer `Content-Type` à la main : axios pose lui-même `multipart/form-data` avec la séparation entre les parties (`boundary`). C'est déjà ainsi pour l'import des matricules.
- `role` doit être une valeur unique. Une liste deviendrait `"AGENT,TEAM_LEAD"` en FormData et serait refusée. Le serveur ajoute lui-même `AGENT` à un chef d'équipe.

### 3. Store : `src/stores/administrator.store.ts` et `src/stores/mappers.ts`
- `createUser(input)` : passer `input.photo` en second argument de `userService.create(...)`.
- Nouvelle action `replaceUserPhoto(id: string, file: File)` : appeler `userService.replaceProfilePhoto`, puis `replaceUser(mapUser(résultat))`.
- `mapUser` : ajouter `photoUrl: user.profilePhotoUrl`.

### 4. Formulaire : `src/Components/users/UserForm.vue`
- Ajouter un `v-file-input` :
  - `accept="image/jpeg,image/png,image/webp"`, `prepend-icon="mdi-camera"` ;
  - affiché seulement en création, et seulement pour les rôles chef d'équipe et agent (la condition `roleCanHaveTeam` existe déjà).
- Règles de validation côté client, pour un retour immédiat (le serveur revérifie) :
  - obligatoire si le rôle est `teamLeader` ou `agent` ;
  - type JPEG, PNG ou WebP ;
  - 5 Mo au plus.
- Aperçu dans un `v-avatar` avec `URL.createObjectURL(file)`. Libérer l'URL avec `URL.revokeObjectURL` au changement de fichier et au démontage.
- Vider la photo quand le rôle passe à superviseur ou administrateur, dans le `watch(() => data.role, …)` existant.
- Inclure `photo` dans le payload émis par `submit`.

### 5. Affichage
- **Tableau des utilisateurs (`UserTable.vue`)** : un `v-avatar` avec `user.photoUrl`, et les initiales en repli.
- **Fiche utilisateur (`admin-user-details`)** :
  - la photo en plus grand ;
  - un bouton « Changer la photo » qui ouvre un sélecteur de fichier et appelle `replaceUserPhoto` ;
  - un badge « Photo manquante » pour un chef d'équipe ou un agent sans photo. C'est le cas des comptes existants, et d'un compte promu chef d'équipe, car le changement de rôle n'exige pas de photo.
- Si l'image ne se charge pas (`@error` sur l'`<img>`, URL expirée), recharger l'utilisateur une fois pour obtenir une URL neuve.

### 6. Erreurs : `src/utils/api-error.ts`
Ajouter les messages des 4 cas du tableau plus haut (les 3 codes et le 413).

### 7. Mocks : `src/mocks/handlers.ts`
- `POST /users` : accepter un `FormData` (`await request.formData()`) et renvoyer un `profilePhotoUrl` factice.
- Ajouter un handler pour `PUT /users/:id/profile-photo`.

## Critères de recette
- [ ] Créer un agent sans photo : le formulaire bloque. Si l'appel part quand même, le message `PROFILE_PHOTO_REQUIRED` s'affiche.
- [ ] Créer un agent ou un chef d'équipe avec une photo JPEG, PNG ou WebP : le compte est créé et la photo s'affiche dans la liste et sur la fiche.
- [ ] Un fichier de plus de 5 Mo, ou qui n'est pas une image : le message d'erreur s'affiche.
- [ ] Créer un superviseur ou un administrateur : aucun champ photo, la création marche comme avant.
- [ ] Sur la fiche d'un agent existant sans photo : le badge « Photo manquante » s'affiche, et « Changer la photo » ajoute la photo.
- [ ] Remplacer une photo existante : la nouvelle s'affiche.