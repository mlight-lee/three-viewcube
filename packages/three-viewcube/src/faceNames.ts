/**
 * Interface to define text in each face of view cube
 */
export interface FaceNames {
  top: string
  front: string
  right: string
  back: string
  left: string
  bottom: string
}

/**
 * Default texts in each face of view cube
 */
export const DEFAULT_FACENAMES: FaceNames = {
  top: 'TOP',
  front: 'FRONT',
  right: 'RIGHT',
  back: 'BACK',
  left: 'LEFT',
  bottom: 'BOTTOM'
}
