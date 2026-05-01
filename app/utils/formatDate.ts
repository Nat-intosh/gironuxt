export function formatDateFrench(date: string | Date): string {
  const d = new Date(date)
  
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  
  const dayName = days[d.getDay()]
  const dayNum = d.getDate()
  const monthName = months[d.getMonth()]
  const hours = d.getHours()
  const minutes = d.getMinutes()
  
  let timeString = `${hours} heure${hours > 1 ? 's' : ''}`
  if (minutes > 0) {
    timeString += ` ${minutes}`
  }
  
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} ${monthName} à ${timeString}`
}
