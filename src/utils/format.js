export function fmtDateTime(v) {
  if (!v) return '—'
  let d
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, da] = s.split('-').map(Number)
    d = new Date(y, mo - 1, da)
  } else {
    d = new Date(v)
  }
  if (isNaN(d.getTime())) return s
  let h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const dd = String(d.getDate()).padStart(2, '0')
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec']
  const mon = months[d.getMonth()]
  const yy = String(d.getFullYear()).slice(-2)
  return `${h}:${min} ${ampm} , ${dd} ${mon} ${yy}`
}