import * as THREE from 'three'

/**
 * Enum to define postion of the object.
 */
export enum ObjectPosition {
  LEFT_BOTTOM = 0,
  LEFT_TOP = 1,
  RIGHT_TOP = 2,
  RIGHT_BOTTOM = 4
}

const clock = new THREE.Clock()

/**
 * A customizable object with fixed postion in viewport
 */
export class FixedPosObject extends THREE.Object3D {
  protected objectCamera: THREE.OrthographicCamera
  protected renderer: THREE.WebGLRenderer
  protected camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  protected objectDim: number
  protected objectPos: ObjectPosition
  protected animating: boolean

  /**
   * Construct one instance of this class
   * @param camera Camera used in your canvas
   * @param renderer Renderer used in your canvas
   * @param dimension Size of area ocupied by this object. Because width and height of this area is same, 
   * it is single value. The real size of the objet will be calculated automatically considering rotation.
   * @param pos Position of the object
   */
  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    dimension: number = 150,
    pos: ObjectPosition = ObjectPosition.RIGHT_TOP
  ) {
    super()

    this.camera = camera
    this.renderer = renderer

    this.objectCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 4)
    this.objectCamera.position.set(0, 0, 2)

    this.objectDim = dimension
    this.objectPos = pos
    this.animating = false
  }

  /**
   * Function called by constructor to initialize the object. The children class can override this function
   * to add its own initialization logic.
   */
  initialize() {}

  /**
   * Render this object
   */
  render() {
    const delta = clock.getDelta()
    if (this.animating) this.animate(delta)

    this.updateOrientation()

    // Store autoClear flag value
    const autoClear = this.renderer.autoClear
    this.renderer.autoClear = false

    this.renderer.clearDepth()
    const viewport = new THREE.Vector4()
    this.renderer.getViewport(viewport)
    const pos = this.calculateViewportPos()
    this.renderer.setViewport(pos.x, pos.y, this.objectDim, this.objectDim)
    this.renderer.render(this, this.objectCamera)
    this.renderer.setViewport(viewport.x, viewport.y, viewport.z, viewport.w)

    // Restore autoClear flag vlaue
    this.renderer.autoClear = autoClear
  }

  /**
   * Animation loop
   * @param delta The seconds passed since the time clock's oldTime was set and sets clock's oldTime to the
   * current time.
   */
  protected animate(_delta: number) {
    // Do nothing for now. The children class can override this function to add its own logic.
  }

  /**
   * Free the GPU-related resources allocated by this instance. Call this method whenever this instance
   * is no longer used in your app.
   */
  dispose() {}

  protected updateOrientation() {
    this.quaternion.copy(this.camera.quaternion).invert()
    this.updateMatrixWorld()
  }

  protected calculatePosInViewport(
    offsetX: number,
    offsetY: number,
    bbox: THREE.Box2
  ) {
    const x = ((offsetX - bbox.min.x) / this.objectDim) * 2 - 1
    const y = -((offsetY - bbox.min.y) / this.objectDim) * 2 + 1
    return { x, y }
  }

  protected calculateViewportPos() {
    const domElement = this.renderer.domElement
    const canvasWidth = domElement.offsetWidth
    const canvasHeight = domElement.offsetHeight
    const pos = this.objectPos
    const length = this.objectDim
    let x = canvasWidth - length
    let y = canvasHeight - length
    switch (pos) {
      case ObjectPosition.LEFT_BOTTOM:
        x = 0
        y = 0
        break
      case ObjectPosition.LEFT_TOP:
        x = 0
        break
      case ObjectPosition.RIGHT_BOTTOM:
        y = 0
        break
    }
    return { x, y }
  }

  protected calculateViewportBbox() {
    const domElement = this.renderer.domElement
    const canvasWidth = domElement.offsetWidth
    const canvasHeight = domElement.offsetHeight
    const pos = this.objectPos
    const length = this.objectDim
    const bbox = new THREE.Box2(
      new THREE.Vector2(canvasWidth - length, 0),
      new THREE.Vector2(canvasWidth, length)
    )
    switch (pos) {
      case ObjectPosition.LEFT_BOTTOM:
        bbox.set(
          new THREE.Vector2(0, canvasHeight - length),
          new THREE.Vector2(length, canvasHeight)
        )
        break
      case ObjectPosition.LEFT_TOP:
        bbox.set(new THREE.Vector2(0, 0), new THREE.Vector2(length, length))
        break
      case ObjectPosition.RIGHT_BOTTOM:
        bbox.set(
          new THREE.Vector2(canvasWidth - length, canvasHeight - length),
          new THREE.Vector2(canvasWidth, canvasHeight)
        )
        break
    }
    return bbox
  }
}
