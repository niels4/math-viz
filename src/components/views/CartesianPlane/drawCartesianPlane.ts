export const drawCartesianPlane = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 1

  const x0 = Math.floor(width / 2) + 0.5
  const y0 = Math.floor(height / 2) + 0.5

  ctx.beginPath()
  ctx.moveTo(0, y0)
  ctx.lineTo(width, y0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x0, 0)
  ctx.lineTo(x0, height)
  ctx.stroke()

  ctx.strokeStyle = "#0ff"
  ctx.fillStyle = "#0ff"
  ctx.beginPath()
  ctx.arc(width / 2 - 120, height / 2 + 89, 50, 0, Math.PI * 2)
  ctx.fill()
}
