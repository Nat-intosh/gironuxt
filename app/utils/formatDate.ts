export function formatDateFrench(date: string | Date): string {
  const d = new Date(date)
  
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  
  const dayName = days[d.getDay()]
  const dayNum = d.getDate()
  const monthName = months[d.getMonth()]
  const hours = d.getHours()
  const minutes = d.getMinutes()
  
  let timeString
  if (hours === 12) {
    timeString = 'midi'
    if (minutes > 0) {
      timeString += ` ${minutes}`
    }
  } else {
    timeString = `${hours} heure${hours > 1 ? 's' : ''}`
    if (minutes > 0) {
      timeString += ` ${minutes}`
    }
  }
  
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} ${monthName} à ${timeString}`
}


export function formatDateRangeFrench(startDate: string | Date, endDate?: string | Date | null): string {
  if (!endDate) return formatDateFrench(startDate)

  const start = new Date(startDate)
  const end = new Date(endDate)

  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

  const startDay = start.getDate()
  const startMonth = months[start.getMonth()]
  const endDay = end.getDate()
  const endMonth = months[end.getMonth()]

  // Same month: "du 2 au 5 avril"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `Du ${startDay} au ${endDay} ${endMonth}`
  }

  // Different months: "du 2 avril au 5 mai"
  return `Du ${startDay} ${startMonth} au ${endDay} ${endMonth}`
}