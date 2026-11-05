import { http, HttpResponse } from 'msw'

import type { DemoRequestResponse, DemoRequestStatus, UpdateDemoRequestRequest } from '@/types/demo-request'

type Problem = (status: number, code: string, detail: string) => Response
type Page = <T>(request: Request, items: T[]) => { items: T[]; nextCursor: string | null }

const statuses: DemoRequestStatus[] = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'CONVERTED', 'CLOSED']
const operatorId = 'usr_0192f1c47d3a7b219e553f0a2c8d4e10'

// Une demande par statut, dont une avec historique : de quoi parcourir tout le suivi en mode démonstration.
const demoRequests: DemoRequestResponse[] = [
  {
    id: 'dmr_mock_005', fullName: 'Awa Koné', company: 'Sécurité Plus CI', email: 'awa.kone@securiteplus.ci', phone: '+225 07 00 00 00 01',
    message: '40 agents répartis sur 6 sites à Abidjan.', status: 'NEW', history: [],
    createdAt: '2026-11-04T09:12:00.000Z', updatedAt: '2026-11-04T09:12:00.000Z',
  },
  {
    id: 'dmr_mock_004', fullName: 'Moussa Traoré', company: 'Propreté Express', email: 'm.traore@proprete-express.sn',
    message: 'Nous cherchons à suivre nos équipes de nettoyage de nuit.', status: 'CONTACTED',
    notes: 'Rappeler après le 10 novembre.',
    history: [{ at: '2026-11-03T15:00:00.000Z', actorId: operatorId, changes: { status: { from: 'NEW', to: 'CONTACTED' }, notes: { from: null, to: 'Rappeler après le 10 novembre.' } } }],
    createdAt: '2026-11-02T10:30:00.000Z', updatedAt: '2026-11-03T15:00:00.000Z',
  },
  {
    id: 'dmr_mock_003', fullName: 'Fatou Diallo', company: 'Gardiennage Atlantique', email: 'fatou@gardiennage-atlantique.com', phone: '+221 77 000 00 02',
    status: 'DEMO_SCHEDULED', demoAt: '2026-11-12T10:00:00.000Z',
    history: [
      { at: '2026-10-29T11:00:00.000Z', actorId: operatorId, changes: { status: { from: 'NEW', to: 'CONTACTED' } } },
      { at: '2026-10-30T09:00:00.000Z', actorId: operatorId, changes: { status: { from: 'CONTACTED', to: 'DEMO_SCHEDULED' }, demoAt: { from: null, to: '2026-11-12T10:00:00.000Z' } } },
    ],
    createdAt: '2026-10-28T08:00:00.000Z', updatedAt: '2026-10-30T09:00:00.000Z',
  },
  {
    id: 'dmr_mock_002', fullName: 'Jean-Marc Kouassi', company: 'Logistique Lagune', email: 'jm.kouassi@lagune-logistique.ci',
    status: 'CONVERTED', demoAt: '2026-10-15T14:00:00.000Z', history: [],
    createdAt: '2026-10-05T16:45:00.000Z', updatedAt: '2026-10-16T08:00:00.000Z',
  },
  {
    id: 'dmr_mock_001', fullName: 'Aminata Sow', company: 'Étudiante', email: 'aminata.sow@example.com',
    message: 'Projet de fin d’études.', status: 'CLOSED', notes: 'Hors cible.', history: [],
    createdAt: '2026-09-20T12:00:00.000Z', updatedAt: '2026-09-21T09:00:00.000Z',
  },
]

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function demoRequestHandlers(api: (path: string) => string, problem: Problem, page: Page) {
  const find = (id: unknown) => demoRequests.find((item) => item.id === String(id))

  return [
    http.get(api('/platform/demo-requests'), ({ request }) => {
      const params = new URL(request.url).searchParams
      const status = params.get('status')
      const q = params.get('q')
      if (status && !statuses.includes(status as DemoRequestStatus)) return problem(400, 'VALIDATION_FAILED', 'Statut inconnu.')
      if (q && q.length > 100) return problem(400, 'VALIDATION_FAILED', 'Recherche trop longue.')
      const filtered = demoRequests
        .filter((item) => !status || item.status === status)
        .filter((item) => !q || normalize(`${item.fullName} ${item.company} ${item.email}`).includes(normalize(q)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return HttpResponse.json(page(request, filtered))
    }),
    http.get(api('/platform/demo-requests/:id'), ({ params }) => {
      const item = find(params.id)
      return item ? HttpResponse.json(item) : problem(404, 'NOT_FOUND', 'Demande introuvable.')
    }),
    http.patch(api('/platform/demo-requests/:id'), async ({ params, request }) => {
      const item = find(params.id)
      if (!item) return problem(404, 'NOT_FOUND', 'Demande introuvable.')
      const payload = (await request.json()) as UpdateDemoRequestRequest
      if (payload.status && !statuses.includes(payload.status)) return problem(400, 'VALIDATION_FAILED', 'Statut inconnu.')
      if (payload.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return problem(400, 'VALIDATION_FAILED', 'Adresse courriel invalide.')
      const record = item as unknown as Record<string, unknown>
      const changes: DemoRequestResponse['history'][number]['changes'] = {}
      for (const [key, value] of Object.entries(payload)) {
        const previous = record[key] ?? null
        if (previous === value) continue
        changes[key] = { from: previous, to: value }
        if (value === null) delete record[key]
        else record[key] = value
      }
      const at = new Date().toISOString()
      const callerId = request.headers.get('Authorization')?.replace('Bearer mock-access-token-', '')
      if (Object.keys(changes).length) item.history.push({ at, actorId: callerId, changes })
      item.updatedAt = at
      return HttpResponse.json(item)
    }),
  ]
}
