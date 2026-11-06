// Show the full text of truncated table cells on hover.
// Cells that already define their own title keep it.
export function installTableTooltips() {
  if (typeof document === 'undefined') return () => {}

  let activeCell = null

  function clearAutoTitle(cell) {
    if (cell && cell.dataset.autoTitle === '1') {
      cell.removeAttribute('title')
      delete cell.dataset.autoTitle
    }
  }

  function onPointerOver(event) {
    const target = event.target
    const cell = target instanceof Element ? target.closest('td, th') : null
    if (!cell || !cell.closest('table.table')) {
      clearAutoTitle(activeCell)
      activeCell = null
      return
    }
    if (activeCell && activeCell !== cell) {
      clearAutoTitle(activeCell)
      activeCell = null
    }
    // Never override a title set by the page.
    if (cell.hasAttribute('title')) return
    // Skip action/control cells; a tooltip there would cover the controls.
    if (cell.querySelector('button, a, input, select, textarea, svg')) return
    if (cell.scrollWidth <= cell.clientWidth + 1) return
    const text = (cell.innerText || '').trim().replace(/\s+/g, ' ')
    if (!text) return
    cell.setAttribute('title', text)
    cell.dataset.autoTitle = '1'
    activeCell = cell
  }

  document.addEventListener('mouseover', onPointerOver)
  return () => document.removeEventListener('mouseover', onPointerOver)
}
