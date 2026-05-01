// 沙盘网格配置
export const CELL = 0.35          // 每格世界坐标大小
export const COLS = 10            // 列数
export const ROWS = 8             // 行数
export const OX: number = -(COLS * CELL) / 2   // 网格左边界 X = -1.75
export const OZ: number = -(ROWS * CELL) / 2   // 网格上边界 Z = -1.40

/** 给定占位左上角(col, row)和尺寸，返回物品视觉中心的世界坐标 */
export function footprintCenter(
  col: number, row: number,
  gw: number, gh: number
): [number, number] {
  return [
    OX + (col + gw / 2) * CELL,
    OZ + (row + gh / 2) * CELL,
  ]
}

/** 给定世界坐标，返回对应物品左上角格子 (col, row)，已 clamp 到合法范围 */
export function worldToTopLeft(
  wx: number, wz: number,
  gw: number, gh: number
): [number, number] {
  const col = Math.round((wx - OX) / CELL - gw / 2)
  const row = Math.round((wz - OZ) / CELL - gh / 2)
  return [
    Math.max(0, Math.min(COLS - gw, col)),
    Math.max(0, Math.min(ROWS - gh, row)),
  ]
}
