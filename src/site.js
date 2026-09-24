export const site = {
  title: "DennyQi's Blog",
  subtitle: 'Intelligence is Compression',
  author: 'DennyQi',
  /** Name under the avatar in the sidebar overview. */
  displayName: 'Xingzhi',
  avatar: '/avatar.jpg',
  description: 'A personal notebook — algorithms, logic, physics, music and readings.',
  perPage: 10,
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** 2024-11-08 -> "November 8, 2024" — fixed locale so SSR and the client agree. */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

export function formatMonthDay(iso) {
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1].slice(0, 3)} ${d}`
}

export function readingTime(minutes) {
  return `${minutes} min read`
}
