import type { TierRule } from '../types/arcade'

export const tierRules: TierRule[] = [
  { id: 'trooper', name: 'Arcade Trooper', label: 'Prize Tier 1', minPoints: 50, spots: '6000 spots; 4696 left when checked', tone: 'blue' },
  { id: 'ranger', name: 'Arcade Ranger', label: 'Prize Tier 2', minPoints: 75, spots: '4000 spots; 3897 left when checked', tone: 'silver' },
  { id: 'champion', name: 'Arcade Champion', label: 'Prize Tier 3', minPoints: 95, spots: '3000 spots; 2968 left when checked', tone: 'gold' },
  { id: 'legend', name: 'Arcade Legend', label: 'Prize Tier 4', minPoints: 120, spots: '2500 spots; 2500 left when checked', tone: 'green' },
]

export const noTier: TierRule = {
  id: 'none',
  name: 'No Tier Yet',
  label: 'Below 50 Arcade Points',
  minPoints: 0,
  spots: '-',
  tone: 'muted',
}
