const KEYS = {
  memberId: 'aru_nai_member_id',
  familyId: 'aru_nai_family_id',
  memberName: 'aru_nai_member_name',
  familyName: 'aru_nai_family_name',
} as const

export const storage = {
  getMemberId: () => localStorage.getItem(KEYS.memberId),
  getFamilyId: () => localStorage.getItem(KEYS.familyId),
  getMemberName: () => localStorage.getItem(KEYS.memberName),
  getFamilyName: () => localStorage.getItem(KEYS.familyName),

  setSession: (params: {
    memberId: string
    familyId: string
    memberName: string
    familyName: string
  }) => {
    localStorage.setItem(KEYS.memberId, params.memberId)
    localStorage.setItem(KEYS.familyId, params.familyId)
    localStorage.setItem(KEYS.memberName, params.memberName)
    localStorage.setItem(KEYS.familyName, params.familyName)
  },

  clear: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  },

  isLoggedIn: () => {
    return !!(
      localStorage.getItem(KEYS.memberId) &&
      localStorage.getItem(KEYS.familyId)
    )
  },
}
