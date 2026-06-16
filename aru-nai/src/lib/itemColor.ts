const COLORS = [
  'bg-red-100 text-red-500',
  'bg-orange-100 text-orange-500',
  'bg-amber-100 text-amber-600',
  'bg-green-100 text-green-600',
  'bg-teal-100 text-teal-600',
  'bg-blue-100 text-blue-500',
  'bg-violet-100 text-violet-500',
  'bg-pink-100 text-pink-500',
]

export function getItemColor(name: string): string {
  if (!name) return COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}
