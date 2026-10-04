// Keep desktop/tablet controls legible when browser chrome reduces available height.
export function displayLayout(width, height, viewportWidth, viewportHeight, display = 'tv') {
  const fit = Math.min(viewportWidth / width, viewportHeight / height)
  const scale = display === 'pc' ? Math.max(.85, Math.min(1.15, viewportWidth / width))
    : display === 'tablet' ? Math.max(.8, Math.min(1.2, viewportWidth / width)) : fit
  const canvasWidth = width * scale
  const canvasHeight = height * scale
  return { scale, canvasWidth, canvasHeight,
    left: Math.max(0, (viewportWidth - canvasWidth) / 2),
    top: display === 'tv' ? Math.max(0, (viewportHeight - canvasHeight) / 2) : 0,
    scroll: display !== 'tv' }
}
