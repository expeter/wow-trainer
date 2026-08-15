export type DiagramDirection = 'forward' | 'backward' | 'left' | 'right'

export interface DiagramPoint {
  x: number
  y: number
}

export function stepDiagramMovement(
  point: DiagramPoint,
  pressed: ReadonlySet<DiagramDirection>,
  seconds: number,
  speed = 24,
): DiagramPoint {
  const horizontal = Number(pressed.has('right')) - Number(pressed.has('left'))
  const vertical = Number(pressed.has('backward')) - Number(pressed.has('forward'))
  const length = Math.hypot(horizontal, vertical) || 1
  return {
    x: Math.max(5, Math.min(95, point.x + horizontal / length * speed * seconds)),
    y: Math.max(5, Math.min(95, point.y + vertical / length * speed * seconds)),
  }
}
