import * as THREE from 'three'
import { createTextSprite } from './viewCubeData'
import { FixedPosObject, ObjectPosition } from './fixedPosObject'

/**
 * An axis object to visualize the 2 axes in a simple way.
 * The X axis is red and the Y axis is green by default
 */
export class Axes2dHelper extends FixedPosObject {
  private axes: THREE.LineSegments
  private xText: THREE.Sprite
  private yText: THREE.Sprite

  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    size = 100
  ) {
    super(camera, renderer, size, ObjectPosition.LEFT_BOTTOM)
    const vertices = [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0]

    const colors = [1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0]

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
    this.axes.position.set(-1, -1, 0)
    this.add(this.axes)

    this.xText = createTextSprite('X')
    this.xText.position.set(1.5, -1, 0)
    this.add(this.xText)

    this.yText = createTextSprite('Y')
    this.yText.position.set(-1, 1.5, 0)
    this.add(this.yText)
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
  }
}
