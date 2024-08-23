import * as THREE from 'three'

/**
 * Enum to define postion of the gizmo.
 */
export enum ObjectPosition {
  LEFT_BOTTOM = 0,
  LEFT_TOP = 1,
  RIGHT_TOP = 2,
  RIGHT_BOTTOM = 4
}

/**
 * A customizable gizmo with fixed postion in viewport
 */
export class FixedPosGizmo<
  TEventMap extends THREE.Object3DEventMap = THREE.Object3DEventMap
> extends THREE.Object3D<TEventMap> {
  protected gizmoCamera: THREE.OrthographicCamera
  protected renderer: THREE.WebGLRenderer
  protected camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  protected gizmoDim: number
  protected gizmoPos: ObjectPosition

  /**
   * Construct one instance of this gizmo
   * @param camera Camera used in your canvas
   * @param renderer Renderer used in your canvas
   * @param dimension Size of area ocupied by this gizmo. Because width and height of this area is same,
   * it is single value. The real size of the objet will be calculated automatically considering rotation.
   * @param pos Position of the gizmo
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

    this.gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 4)
    this.gizmoCamera.position.set(0, 0, 2)

    this.gizmoDim = dimension
    this.gizmoPos = pos

    this.initialize()
  }

  /**
   * Function called by constructor to initialize this gizmo. The children class can override this function
   * to add its own initialization logic.
   */
  initialize() {}

  /**
   * Update and rerender this gizmo
   */
  update() {
    this.updateOrientation()

    // Store autoClear flag value
    const autoClear = this.renderer.autoClear
    this.renderer.autoClear = false

    this.renderer.clearDepth()
    const viewport = new THREE.Vector4()
    this.renderer.getViewport(viewport)
    const pos = this.calculateViewportPos()
    this.renderer.setViewport(pos.x, pos.y, this.gizmoDim, this.gizmoDim)
    this.renderer.render(this, this.gizmoCamera)
    this.renderer.setViewport(viewport.x, viewport.y, viewport.z, viewport.w)

    // Restore autoClear flag vlaue
    this.renderer.autoClear = autoClear
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
    const x = ((offsetX - bbox.min.x) / this.gizmoDim) * 2 - 1
    const y = -((offsetY - bbox.min.y) / this.gizmoDim) * 2 + 1
    return { x, y }
  }

  protected calculateViewportPos() {
    const domElement = this.renderer.domElement
    const canvasWidth = domElement.offsetWidth
    const canvasHeight = domElement.offsetHeight
    const pos = this.gizmoPos
    const length = this.gizmoDim
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
    const pos = this.gizmoPos
    const length = this.gizmoDim
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
