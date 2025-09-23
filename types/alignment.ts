export type AlignmentStrength = 'strong' | 'moderate' | 'weak' | 'informational'
export type AlignmentItemType = 'pillar' | 'category' | 'goal' | 'program'

type MaybeString = string | null | undefined

export interface AlignmentRecord {
  id: string
  functional_type: AlignmentItemType
  functional_pillar_id?: MaybeString
  functional_category_id?: MaybeString
  functional_goal_id?: MaybeString
  functional_program_id?: MaybeString
  ord_type: AlignmentItemType
  ord_pillar_id?: MaybeString
  ord_category_id?: MaybeString
  ord_goal_id?: MaybeString
  ord_program_id?: MaybeString
  alignment_strength: AlignmentStrength
  alignment_rationale?: MaybeString
  created_by?: MaybeString
  created_at: string
  updated_at?: MaybeString
  functional_name?: MaybeString
  functional_path?: MaybeString
  functional_function?: MaybeString
  ord_name?: MaybeString
  ord_path?: MaybeString
}

export interface AlignmentContextDetail {
  itemType: AlignmentItemType
  itemId: string
  itemRole: 'functional' | 'ord'
  relatedItemRole: 'functional' | 'ord'
  relatedItemType: AlignmentItemType | null
  relatedItemId: MaybeString
  relatedItemName?: MaybeString
  relatedItemPath?: MaybeString
  alignment: AlignmentRecord
  summary: string
}
