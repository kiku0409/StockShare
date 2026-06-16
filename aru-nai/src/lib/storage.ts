const KEYS = {
  memberId: 'aru_nai_member_id',
  familyId: 'aru_nai_family_id',
  memberName: 'aru_nai_member_name',
  familyName: 'aru_nai_family_name',
} as const

const get = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

export const storage = {
  getMemberId: () => get(KEYS.memberId),
  getFamilyId: () => get(KEYS.familyId),
  getMemberName: () => get(KEYS.memberName),
  getFamilyName: () => get(KEYS.familyName),

  setSession: (params: {
    memberId: string
    familyId: string
    memberName: string
    familyName: string
  }) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.memberId, params.memberId)
    localStorage.setItem(KEYS.familyId, params.familyId)
    localStorage.setItem(KEYS.memberName, params.memberName)
    localStorage.setItem(KEYS.familyName, params.familyName)
  },

  clear: () => {
    if (typeof window === 'undefined') return
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  },

  isLoggedIn: () => {
    if (typeof window === 'undefined') return false
    return !!(localStorage.getItem(KEYS.memberId) && localStorage.getItem(KEYS.familyId))
  },
}
