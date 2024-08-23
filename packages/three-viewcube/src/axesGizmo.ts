import * as THREE from 'three'
import { createTextSprite } from './viewCubeData'
import { FixedPosGizmo, ObjectPosition } from './fixedPosGizmo'

/**
 * Options to customize axes
 */
export interface AxesOptions {
  /**
   * Position of axes
   */
  pos?: ObjectPosition
  /**
   * Size of area ocupied by view cube. Because width and height of this area is same, it is single value.
   * The real size of view cube will be calculated automatically considering rotation.
   */
  size?: number
  /**
   * Flag to show z-axis
   */
  hasZAxis?: boolean
}

/**
 * Default axes option values
 */
export const DEFAULT_AXES_OPTIONS: AxesOptions = {
  pos: ObjectPosition.LEFT_BOTTOM,
  size: 100,
  hasZAxis: true
}

/**
 * An axis gizmo to visualize the axes in a simple way.
 * The X axis is red, the Y axis is green, and the Z axis is blue by default
 */
export class AxesGizmo extends FixedPosGizmo {
  private axes: THREE.LineSegments
  private xText: THREE.Sprite
  private yText: THREE.Sprite
  private zText?: THREE.Sprite
  private hasZAxis: boolean

  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    options: AxesOptions
  ) {
    const mergedOptions: AxesOptions = {
      ...DEFAULT_AXES_OPTIONS,
      ...options
    }
    super(camera, renderer, mergedOptions.size, options.pos)
    this.hasZAxis = mergedOptions.hasZAxis!

    const vertices = [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0]
    const colors = [1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0]
    if (this.hasZAxis) {
      vertices.push(0, 0, 0, 0, 0, 2)
      colors.push(0, 0, 1, 0, 0.6, 1)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    )
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      toneMapped: false
    })

    this.axes = new THREE.LineSegments(geometry, material)
    this.axes.position.set(-1, -1, -1)
    this.add(this.axes)

    this.xText = createTextSprite('X')
    this.xText.position.set(1.5, -1, -1)
    this.add(this.xText)

    this.yText = createTextSprite('Y')
    this.yText.position.set(-1, 1.5, -1)
    this.add(this.yText)

    if (this.hasZAxis) {
      this.zText = createTextSprite('Z')
      this.zText.position.set(-1, -1, 1.5)
      this.add(this.zText)
    }
  }

  /**
   * Set color of x-axis and y-axis
   * @param xAxisColor color of x-axis
   * @param yAxisColor color of y-axis
   */
  setLineColors(xAxisColor: THREE.Color, yAxisColor: THREE.Color) {
    const color = new THREE.Color()
    const array = this.axes.geometry.attributes.color.array

    color.set(xAxisColor)
    color.toArray(array, 0)
    color.toArray(array, 3)

    color.set(yAxisColor)
    color.toArray(array, 6)
    color.toArray(array, 9)

    this.axes.geometry.attributes.color.needsUpdate = true

    return this
  }

  /**
   * Set text color
   * @param color text color
   */
  setTextColor(color: THREE.Color) {
    this.xText.material.color = color
    this.yText.material.color = color
  }

  /**
   * Free the GPU-related resources allocated by this instance. Call this method whenever this instance
   * is no longer used in your app.
   */
  dispose() {
    this.axes.geometry.dispose()
    const material = this.axes.material as THREE.LineBasicMaterial
    material.dispose()

    this.xText.geometry.dispose()
    this.xText.material.dispose()

    this.yText.geometry.dispose()
    this.yText.material.dispose()

    if (this.hasZAxis) {
      this.zText?.geometry.dispose()
      this.zText?.material.dispose()
    }
  }
}
