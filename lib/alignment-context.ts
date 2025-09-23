import type {
  AlignmentContextDetail,
  AlignmentItemType,
  AlignmentRecord,
} from '@/types/alignment'

const ID_FIELD_MAP: Record<'functional' | 'ord', Record<AlignmentItemType, keyof AlignmentRecord>> = {
  functional: {
    pillar: 'functional_pillar_id',
    category: 'functional_category_id',
    goal: 'functional_goal_id',
    program: 'functional_program_id',
  },
  ord: {
    pillar: 'ord_pillar_id',
    category: 'ord_category_id',
    goal: 'ord_goal_id',
    program: 'ord_program_id',
  },
}

const NAME_FIELD_MAP: Record<'functional' | 'ord', keyof AlignmentRecord> = {
  functional: 'functional_name',
  ord: 'ord_name',
}

const PATH_FIELD_MAP: Record<'functional' | 'ord', keyof AlignmentRecord> = {
  functional: 'functional_path',
  ord: 'ord_path',
}

const ROLE_LABEL: Record<'functional' | 'ord', string> = {
  functional: 'Functional',
  ord: 'ORD',
}

function resolveId(
  alignment: AlignmentRecord,
  role: 'functional' | 'ord',
  itemType: AlignmentItemType,
): string | null {
  const field = ID_FIELD_MAP[role][itemType]
  const value = alignment[field]
  return value ?? null
}

function buildSummary(detail: AlignmentContextDetail): string {
  const { itemRole, itemType, relatedItemRole, relatedItemType, alignment, relatedItemName, relatedItemPath } = detail
  const parts = [
    `${ROLE_LABEL[itemRole]} ${itemType} is linked to ${ROLE_LABEL[relatedItemRole]} ${relatedItemType ?? 'item'}`,
    `Strength: ${alignment.alignment_strength}`,
  ]

  if (alignment.alignment_rationale) {
    parts.push(`Rationale: ${alignment.alignment_rationale}`)
  }

  if (relatedItemName) {
    parts.push(`Related name: ${relatedItemName}`)
  }

  if (relatedItemPath) {
    parts.push(`Related path: ${relatedItemPath}`)
  }

  return parts.join(' | ')
}

export function deriveAlignmentContext(
  itemType: AlignmentItemType,
  itemId: string,
  alignments: AlignmentRecord[] = [],
): AlignmentContextDetail[] {
  return alignments
    .map((alignment) => {
      const functionalId = alignment.functional_type
        ? resolveId(alignment, 'functional', alignment.functional_type)
        : null
      const ordId = alignment.ord_type
        ? resolveId(alignment, 'ord', alignment.ord_type)
        : null

      const isFunctionalMatch =
        alignment.functional_type === itemType && functionalId === itemId
      const isOrdMatch = alignment.ord_type === itemType && ordId === itemId

      if (!isFunctionalMatch && !isOrdMatch) {
        return null
      }

      const itemRole: 'functional' | 'ord' = isFunctionalMatch ? 'functional' : 'ord'

      const relatedItemRole: 'functional' | 'ord' =
        itemRole === 'functional' ? 'ord' : 'functional'

      const relatedItemType =
        relatedItemRole === 'functional'
          ? alignment.functional_type
          : alignment.ord_type

      const relatedItemId = relatedItemType
        ? resolveId(alignment, relatedItemRole, relatedItemType)
        : null

      const relatedItemName = alignment[NAME_FIELD_MAP[relatedItemRole]] ?? null
      const relatedItemPath = alignment[PATH_FIELD_MAP[relatedItemRole]] ?? null

      const detail: AlignmentContextDetail = {
        itemType,
        itemId,
        itemRole,
        relatedItemRole,
        relatedItemType: relatedItemType ?? null,
        relatedItemId,
        relatedItemName,
        relatedItemPath,
        alignment,
        summary: '',
      }

      detail.summary = buildSummary(detail)
      return detail
    })
    .filter(Boolean)
}

export async function fetchAlignmentContext(
  itemType: AlignmentItemType,
  itemId: string,
): Promise<AlignmentContextDetail[]> {
  if (!itemType || !itemId) return []

  const response = await fetch(
    `/api/alignments?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(itemId)}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch alignments for ${itemType} ${itemId}`)
  }

  const data = (await response.json()) as { alignments?: AlignmentRecord[] }
  const records = data.alignments ?? []
  return deriveAlignmentContext(itemType, itemId, records)
}

type SelectionMap = {
  pillars: string[]
  categories: string[]
  goals: string[]
  programs: string[]
}

export async function fetchAlignmentsForSelections(
  selections: SelectionMap,
): Promise<AlignmentContextDetail[]> {
  const targets: Array<{ itemType: AlignmentItemType; itemId: string }> = []
  const seen = new Set<string>()

  const pushTarget = (itemType: AlignmentItemType, itemId: string) => {
    if (!itemId || itemId === 'all') return
    const key = `${itemType}:${itemId}`
    if (seen.has(key)) return
    seen.add(key)
    targets.push({ itemType, itemId })
  }

  selections.pillars.forEach((id) => pushTarget('pillar', id))
  selections.categories.forEach((id) => pushTarget('category', id))
  selections.goals.forEach((id) => pushTarget('goal', id))
  selections.programs.forEach((id) => pushTarget('program', id))

  if (targets.length === 0) return []

  const results = await Promise.all(
    targets.map(async ({ itemType, itemId }) => {
      try {
        return await fetchAlignmentContext(itemType, itemId)
      } catch (error) {
        console.error('Failed to fetch alignments for selection:', error)
        return []
      }
    }),
  )

  return results.flat()
}
