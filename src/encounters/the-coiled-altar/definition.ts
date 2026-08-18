import RAID_PLAN from '../../../inbox/the-coiled-altar.png'
import type { EvidenceEncounterDefinition } from '../../platform/encounters/evidenceFullFight'

export const definition = {
  id: 'the-coiled-altar', name: 'The Coiled Altar', order: 7,
  summary: "Route Zul'jan's venom into frontal cleanup, survive Malacrass manifestations, and intercept Soulbinding fragments.",
  sourceAsOf: '2026-08-16', sourceNote: 'Maintained pre-live guide and PTR spell data; exact counts, geometry, and recurrence remain configurable.',
  arenaKind: 'rectangle', arena2dId: 'coiled_altar_raidplan', arena2dLabel: 'Coiled Altar supplied raid plan', learn2dBackground: RAID_PLAN, boardClass: 'coiled-altar-2d-board', start: { x: 0, z: 20 },
  arena3d: { id: 'coiled_altar_world', label: 'Coiled Altar toxic-depths platform', shape: 'rectangle', width: 100, depth: 60, anchors: [{ id: 'seal', label: 'Central altar seal', x: 0, z: 0 }, { id: 'zuljan', label: "Zul'jan", x: -20, z: -10 }, { id: 'malacrass', label: 'Hex Lord Malacrass', x: 20, z: -10 }, { id: 'escape', label: 'Guillotine escape', x: 44, z: 15 }], theme: { kind: 'coiled-altar', layout: 'coiled-altar', surroundings: 'toxic-depths', platform: 'floating', material: 'ritual-altar-stone', floor: '#25201c', boundary: '#b18b5e', accent: '#d3b577', center: '#6e4c36', poison: '#95c522', fog: 'toxic-haze' } },
  bosses: [{ id: 'altar-zuljan', name: "Zul'jan", position: { x: -20, z: -10 }, color: '#78bb61' }, { id: 'altar-malacrass', name: 'Hex Lord Malacrass', position: { x: 20, z: -10 }, color: '#9270c0' }],
  phases: [
    {
      name: "Zul'jan",
      description: 'Create, carry, and place venom in the future Sever lane while resolving Guillotine and the outward Widow’s Kiss escape.',
      stepIds: ['fangs-safe', 'toxic-deluge', 'volatile-venom', 'venom-deposit', 'sever', 'guillotine', 'widows-kiss'],
      roleResponsibilities: [
        { role: 'tank', responsibilities: ['Aim Sever through the prepared venom lane while keeping every non-tank outside the cleanup frontal.'] },
        { role: 'healer', responsibilities: ['Track the venom carrier, cover the assigned Guillotine group, and move outward for Widow’s Kiss after the soak.'] },
        { role: 'melee', responsibilities: ['Collect and deposit venom only when assigned, leave Sever, then join the correct five-player Guillotine group.'] },
        { role: 'ranged', responsibilities: ['Place Toxic Deluge and carried venom in the assigned lane, then escape far from the Widow’s Kiss epicenter.'] },
      ],
    },
    {
      name: 'Hex Lord Malacrass',
      description: 'Walk against Dreadmarch toward the central recovery point and kite each Manifestation without contact or an edge fall.',
      stepIds: ['dreadmarch', 'manifestation'],
      roleResponsibilities: [
        { role: 'tank', responsibilities: ['Hold Malacrass near the recovery route and keep the forced march and Manifestation paths clear of the platform edge.'] },
        { role: 'healer', responsibilities: ['Heal players fighting Dreadmarch movement and support the fixated target while maintaining contact-free spacing.'] },
        { role: 'melee', responsibilities: ['Walk against Dreadmarch toward center and disengage from a fixating Manifestation before contact.'] },
        { role: 'ranged', responsibilities: ['Recover centrally from Dreadmarch and kite a fixating Manifestation away from the raid and cleanup lanes.'] },
      ],
    },
    {
      name: 'Soulbinding',
      description: 'Intercept assigned Soul Fragments at the altar and use the declared Main action before they reach Malacrass.',
      stepIds: ['soulbinding'],
      roleResponsibilities: [
        { role: 'tank', responsibilities: ['Keep Malacrass stable while moving into the assigned fragment lane and using Main before the fragment arrives.'] },
        { role: 'healer', responsibilities: ['Cover fragment owners and intercept the assigned fragment with Main without abandoning the central healing route.'] },
        { role: 'melee', responsibilities: ['Meet the assigned Soul Fragment near the altar and use Main before it can reach Malacrass.'] },
        { role: 'ranged', responsibilities: ['Watch the outer fragment route, intercept the assigned Soul Fragment, and confirm Main before contact.'] },
      ],
    },
    {
      name: 'Coiled Union',
      description: 'Resolve the combined cleanup frontal and residual hazards, then return to the altar seal as both boss systems overlap.',
      stepIds: ['blighted-sever', 'coiled-union'],
      roleResponsibilities: [
        { role: 'tank', responsibilities: ['Aim Blighted Sever through prepared venom and manifestations, then bring both bosses into the planned altar position.'] },
        { role: 'healer', responsibilities: ['Cover the combined cleanup overlap and finish inside the altar safe region without touching residual hazards.'] },
        { role: 'melee', responsibilities: ['Leave Blighted Sever, avoid residual contact zones, and return to the seal only after the frontal clears.'] },
        { role: 'ranged', responsibilities: ['Keep the combined frontal lane empty, preserve an outer escape route, and collapse safely to the altar seal.'] },
      ],
    },
  ], resource: { label: 'Venom objects', initial: 0, maximum: 6, lethal: 7 },
  tacticFields: [{ id: 'venom-lanes', label: 'Venom cleanup lanes', kind: 'region', value: ['left-sever', 'right-sever'] }, { id: 'guillotine-groups', label: 'Guillotine groups', kind: 'group', value: ['group-one', 'group-two'] }, { id: 'fragment-owners', label: 'Soul fragment owners', kind: 'action-owner', value: 'player' }],
  steps: [
    { id: 'fangs-safe', label: 'Fangs of the Coiled Altar', prompt: 'Move into the central hourglass while Noxious Ground expands.', advice: 'Reach the seal-side safe region before the poison closes in.', duration2d: 5, duration3d: 7, position: { x: 0, z: 0 }, radius: 9, intent: 'enter', color: '#d0b36b' },
    { id: 'toxic-deluge', label: 'Toxic Deluge', prompt: 'Dodge the impact that creates your assigned Coalesced Venom.', advice: 'Leave the four-yard impact before collecting its venom.', duration2d: 4, duration3d: 5, position: { x: -27, z: 12 }, radius: 7, intent: 'avoid', color: '#7dbb55', resourceDelta: 1 },
    { id: 'volatile-venom', label: 'Volatile Venom', prompt: 'Collect the globule and carry its five-yard danger circle away.', advice: 'Enter the venom only when your carrier lockout is clear.', duration2d: 5, duration3d: 6, position: { x: -30, z: 12 }, radius: 5, intent: 'enter', color: '#8ac65e' },
    { id: 'venom-deposit', label: 'Venom deposit', prompt: 'Drop the carried venom inside the future Sever cleanup lane.', advice: 'Reach the left frontal lane before Volatile Venom expires.', duration2d: 5, duration3d: 6, position: { x: -20, z: -20 }, radius: 6, intent: 'enter', color: '#a4cf62' },
    { id: 'sever', label: 'Sever', prompt: 'Leave Zul’jan’s frontal while it destroys the prepared venom.', advice: 'Keep every non-tank outside the cleanup cone.', duration2d: 4, duration3d: 5, position: { x: -20, z: -12 }, radius: 12, intent: 'avoid', color: '#d6a45f', resourceDelta: -1 },
    { id: 'guillotine', label: 'Guillotine', prompt: 'Join the assigned five-player soak around the marked target.', advice: 'Reach the nine-yard group soak before the axe lands.', duration2d: 5, duration3d: 6, position: { x: 0, z: 16 }, radius: 9, intent: 'enter', color: '#d66f5c' },
    { id: 'widows-kiss', label: "Widow's Kiss", prompt: 'Run far from the axe epicenter after the successful soak.', advice: 'Reach the outer escape anchor before the forty-yard eruption.', duration2d: 6, duration3d: 8, position: { x: 44, z: 15 }, radius: 6, intent: 'enter', color: '#e1b35f' },
    { id: 'dreadmarch', label: 'Dreadmarch', prompt: 'Walk against the forced march and stop before the platform edge.', advice: 'Reach the central recovery anchor while the gaze controls movement.', duration2d: 6, duration3d: 8, position: { x: 0, z: -14 }, radius: 7, intent: 'enter', color: '#a681d0' },
    { id: 'manifestation', label: 'Manifestation of Dread', prompt: 'Keep the fixating manifestation away from contact and frontal cleanup.', advice: 'Leave the manifestation contact zone before it knocks you off.', duration2d: 5, duration3d: 6, position: { x: 22, z: 4 }, radius: 9, intent: 'avoid', color: '#9d72bd' },
    { id: 'soulbinding', label: 'Soulbinding', prompt: 'Use Main on your assigned Soul Fragment before it reaches Malacrass.', advice: 'Intercept the fragment and use the declared Main action.', duration2d: 6, duration3d: 7, position: { x: 0, z: 0 }, radius: 6, intent: 'action', color: '#c3a6e4', requiredAction: 'mainAbility' },
    { id: 'blighted-sever', label: 'Blighted Sever', prompt: 'Leave the combined frontal while prepared venom and manifestations are cleared.', advice: 'Keep the raid outside the combined cleanup line.', duration2d: 5, duration3d: 6, position: { x: 0, z: -10 }, radius: 13, intent: 'avoid', color: '#b88b5e' },
    { id: 'coiled-union', label: 'Coiled Union', prompt: 'Return to the altar seal as both boss systems overlap.', advice: 'Finish inside the central safe region without touching residual hazards.', duration2d: 5, duration3d: 7, position: { x: 0, z: 0 }, radius: 9, intent: 'enter', color: '#d0b36b' },
  ],
} as const satisfies EvidenceEncounterDefinition
