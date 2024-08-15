import * as THREE from 'three'
import { FixedPosObject, ObjectPosition } from './fixedPosObject'

/**
 * An axis object to visualize the 2 axes in a simple way.
 * The X axis is red and the Y axis is green by default
 */
export class Axes2dHelper extends FixedPosObject {
  private axes: THREE.LineSegments

  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    size = 100) {
    super(camera, renderer, size, ObjectPosition.LEFT_BOTTOM)
    const vertices = [
      0,
      0,
      0,
      size,
      0,
      0,
      0,
      0,
      0,
      0,
      size,
      0
    ]

    const colors = [1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0]

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      toneMapped: false
    })

    this.axes = new THREE.LineSegments(geometry, material)
    this.add(this.axes)
  }

  setColors(xAxisColor: THREE.Color, yAxisColor: THREE.Color) {
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
   * Free the GPU-related resources allocated by this instance. Call this method whenever this instance
   * is no longer used in your app.
   */
  dispose() {
    this.axes.geometry.dispose()
    const material = this.axes.material as THREE.LineBasicMaterial
    material.dispose()
  }
}
