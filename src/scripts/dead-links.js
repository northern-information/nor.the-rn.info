// Opens a dead-link popover on hover (see lib/deadLinks.js). Tap, click and
// keyboard open it without this script.
for (const button of document.querySelectorAll('.link-dead-skull')) {
  const note = button.popoverTargetElement
  if (!note) continue
  button.addEventListener('mouseenter', () => {
    if (!note.matches(':popover-open')) note.showPopover()
  })
  button.addEventListener('mouseleave', () => {
    if (note.matches(':popover-open')) note.hidePopover()
  })
}
