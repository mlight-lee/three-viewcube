import * as THREE from 'three'
import { DEFAULT_FACENAMES, FaceNames } from './faceNames'
import { FACES } from './viewCubeData'
import { ViewCube } from './viewCube'

const MAIN_COLOR = 0xdddddd
const HOVER_COLOR = 0xf2f5ce
const OUTLINE_COLOR = 0xcccccc

interface OrbitControlsLike {
  target: THREE.Vector3
  addEventListener: (eventName: string, listener: () => void) => void
  removeEventListener: (eventName: string, listener: () => void) => void
}

/**
 * Enum to define postion of view cube.
 */
export enum ViewCubePos {
  LEFT_BOTTOM = 0,
  LEFT_TOP = 1,
  RIGHT_TOP = 2,
  RIGHT_BOTTOM = 4
}

/**
 * Options to customize view cube
 */
export interface ViewCubeOptions {
  /**
   *Position of view cube
   */
  pos?: ViewCubePos
  /**
   * Size of area ocupied by view cube. Because width and height of this area is same, it is single value.
   * The real size of view cube will be calculated automatically considering rotation.
   */
  dimension?: number
  /**
   * Face color of view cube
   */
  faceColor?: number
  /**
   * Color when hovering on face, edge, and corner of view cube
   */
  hoverColor?: number
  /**
   * Edge color of view cube
   */
  outlineColor?: number
  /**
   * Text in each face of view cube
   */
  faceNames?: FaceNames
}

/**
 * Default option values
 */
export const DEFAULT_VIEWCUBE_OPTIONS: ViewCubeOptions = {
  pos: ViewCubePos.RIGHT_TOP,
  dimension: 150,
  faceColor: MAIN_COLOR,
  hoverColor: HOVER_COLOR,
  outlineColor: OUTLINE_COLOR,
  faceNames: DEFAULT_FACENAMES
}

const clock = new THREE.Clock()

/**
 * A highly customizable standalone view cube addon for three.js.
 */
export class ViewCubeHelper extends THREE.Object3D {
  private cube: ViewCube
  private cubePos: ViewCubePos
  private cubeDim: number
  private cubeCamera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private domElement: HTMLElement
  private animating: boolean
  private turnRate: number
  private radius: number
  private targetQuaternion: THREE.Quaternion
  private q1: THREE.Quaternion
  private q2: THREE.Quaternion
  private controls: OrbitControlsLike | undefined
  private controlsChangeEvent: { listener: () => void }
  private target: THREE.Vector3

  /**
   * Construct one instance of view cube helper
   * @param camera Camera used in your canvas
   * @param renderer Renderer used in your canvas
   * @param options Options to customize view cube helper
   */
  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    options: ViewCubeOptions = DEFAULT_VIEWCUBE_OPTIONS
  ) {
    super()

    const mergedOptions: ViewCubeOptions = {
      ...DEFAULT_VIEWCUBE_OPTIONS,
      ...options
    }
    this.cube = new ViewCube(
      2,
      0.2,
      true,
      mergedOptions.faceColor,
      mergedOptions.outlineColor,
      mergedOptions.faceNames
    )
    this.add(this.cube)

    this.camera = camera
    this.renderer = renderer
    this.domElement = renderer.domElement
    this.animating = false
    this.target = new THREE.Vector3()

    this.cubeCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 4)
    this.cubeCamera.position.set(0, 0, 2)

    this.cubeDim = mergedOptions.dimension!
    this.cubePos = mergedOptions.pos!

    this.turnRate = 2 * Math.PI // turn rate in angles per second

    this.targetQuaternion = new THREE.Quaternion()

    this.q1 = new THREE.Quaternion()
    this.q2 = new THREE.Quaternion()
    this.radius = 0

    this.controlsChangeEvent = { listener: () => this.updateOrientation() }

    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseClick = this.handleMouseClick.bind(this)
    this.listen(this.domElement)
  }

  /**
   * Set associated obit controls
   * @param controls The associated orbit controls
   */
  setControls(controls: OrbitControlsLike) {
    if (this.controls) {
      this.controls.removeEventListener(
        'change',
        this.controlsChangeEvent.listener
      )
      this.target = new THREE.Vector3()
    }

    if (!controls) return

    this.controls = controls
    controls.addEventListener('change', this.controlsChangeEvent.listener)
    this.target = controls.target
  }

  /**
   * Render this view cube
   */
  render() {
    const delta = clock.getDelta()
    if (this.animating) this.animate(delta)

    // Store autoClear flag value
    const autoClear = this.renderer.autoClear
    this.renderer.autoClear = false

    this.renderer.clearDepth()
    const viewport = new THREE.Vector4()
    this.renderer.getViewport(viewport)
    const domElement = this.renderer.domElement
    const pos = this.calculateViewportPos(
      domElement.offsetWidth,
      domElement.offsetHeight,
      this.cubePos,
      this.cubeDim
    )
    this.renderer.setViewport(pos.x, pos.y, this.cubeDim, this.cubeDim)
    this.renderer.render(this, this.cubeCamera)
    this.renderer.setViewport(viewport.x, viewport.y, viewport.z, viewport.w)

    // Restore autoClear flag vlaue
    this.renderer.autoClear = autoClear
  }

  /**
   * Animation loop
   * @param delta The seconds passed since the time clock's oldTime was set and sets clock's oldTime to the
   * current time.
   */
  private animate(delta: number) {
    if (this.animating === false) return

    const step = delta * this.turnRate

    // animate position by doing a slerp and then scaling the position on the unit sphere
    this.q1.rotateTowards(this.q2, step)
    this.camera.position
      .set(0, 0, 1)
      .applyQuaternion(this.q1)
      .multiplyScalar(this.radius)
      .add(this.target)

    // animate orientation
    this.camera.quaternion.rotateTowards(this.targetQuaternion, step)

    this.updateOrientation()

    if (this.q1.angleTo(this.q2) === 0) {
      this.animating = false
    }
  }

  /**
   * Free the GPU-related resources allocated by this instance. Call this method whenever this instance
   * is no longer used in your app.
   */
  dispose() {
    this.cube.dispose()
  }

  private updateOrientation() {
    this.quaternion.copy(this.camera.quaternion).invert()
    this.updateMatrixWorld()
  }

  private listen(domElement: HTMLElement) {
    domElement.addEventListener('mousemove', this.handleMouseMove)
    domElement.addEventListener('click', this.handleMouseClick)
  }

  private handleMouseClick(event: MouseEvent) {
    if (this.animating === true) return false

    const bbox = this.calculateViewportBbox(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight,
      this.cubePos,
      this.cubeDim
    )
    if (bbox.containsPoint(new THREE.Vector2(event.offsetX, event.offsetY))) {
      const pos = this.calculatePosInViewport(
        event.offsetX,
        event.offsetY,
        bbox
      )
      this.checkSideTouch(pos.x, pos.y)
      this.animating = true
    }
  }

  private handleMouseMove(event: MouseEvent) {
    const bbox = this.calculateViewportBbox(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight,
      this.cubePos,
      this.cubeDim
    )
    if (bbox.containsPoint(new THREE.Vector2(event.offsetX, event.offsetY))) {
      const pos = this.calculatePosInViewport(
        event.offsetX,
        event.offsetY,
        bbox
      )
      this.checkSideOver(pos.x, pos.y)
    }
  }

  private calculatePosInViewport(
    offsetX: number,
    offsetY: number,
    bbox: THREE.Box2
  ) {
    const x = ((offsetX - bbox.min.x) / this.cubeDim) * 2 - 1
    const y = -((offsetY - bbox.min.y) / this.cubeDim) * 2 + 1
    return { x, y }
  }

  private checkSideTouch(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.cubeCamera)
    const intersects = raycaster.intersectObjects(this.cube.children, true)
    if (intersects.length) {
      for (const { object } of intersects) {
        if (object.name) {
          this.prepareAnimationData(object.name, this.target)
          break
        }
      }
    }
  }

  private checkSideOver(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.cubeCamera)
    const intersects = raycaster.intersectObjects(this.cube.children, true)
    // unhover
    this.cube.traverse(function (obj) {
      if (obj.name) {
        const mesh = obj as THREE.Mesh
        ;(mesh.material as THREE.MeshBasicMaterial).color.setHex(MAIN_COLOR)
      }
    })
    // check hover
    if (intersects.length) {
      for (const { object } of intersects) {
        if (object.name) {
          object.parent!.children.forEach(function (child) {
            if (child.name === object.name) {
              const mesh = child as THREE.Mesh
              ;(mesh.material as THREE.MeshBasicMaterial).color.setHex(
                HOVER_COLOR
              )
            }
          })
          break
        }
      }
    }
  }

  private calculateViewportPos(
    canvasWidth: number,
    canvasHeight: number,
    pos: ViewCubePos,
    length: number
  ) {
    let x = canvasWidth - length
    let y = canvasHeight - length
    switch (pos) {
      case ViewCubePos.LEFT_BOTTOM:
        x = 0
        y = 0
        break
      case ViewCubePos.LEFT_TOP:
        x = 0
        break
      case ViewCubePos.RIGHT_BOTTOM:
        y = 0
        break
    }
    return { x, y }
  }

  private calculateViewportBbox(
    canvasWidth: number,
    canvasHeight: number,
    pos: ViewCubePos,
    length: number
  ) {
    const bbox = new THREE.Box2(
      new THREE.Vector2(canvasWidth - length, 0),
      new THREE.Vector2(canvasWidth, length)
    )
    switch (pos) {
      case ViewCubePos.LEFT_BOTTOM:
        bbox.set(
          new THREE.Vector2(0, canvasHeight - length),
          new THREE.Vector2(length, canvasHeight)
        )
        break
      case ViewCubePos.LEFT_TOP:
        bbox.set(new THREE.Vector2(0, 0), new THREE.Vector2(length, length))
        break
      case ViewCubePos.RIGHT_BOTTOM:
        bbox.set(
          new THREE.Vector2(canvasWidth - length, canvasHeight - length),
          new THREE.Vector2(canvasWidth, canvasHeight)
        )
        break
    }
    return bbox
  }

  private prepareAnimationData(side: string, focusPoint: THREE.Vector3Like) {
    const targetPosition = new THREE.Vector3(0, 0, 1)
    switch (side) {
      case FACES.FRONT:
        this.targetQuaternion.setFromEuler(new THREE.Euler())
        break
      case FACES.RIGHT:
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0))
        break
      case FACES.BACK:
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0))
        break
      case FACES.LEFT:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(0, -Math.PI * 0.5, 0)
        )
        break
      case FACES.TOP:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.5, 0, 0)
        )
        break
      case FACES.BOTTOM:
        this.targetQuaternion.setFromEuler(new THREE.Euler(Math.PI * 0.5, 0, 0))
        break

      case FACES.TOP_FRONT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, 0, 0)
        )
        break
      case FACES.TOP_RIGHT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, Math.PI * 0.5, 0, 'YXZ')
        )
        break
      case FACES.TOP_BACK_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, Math.PI, 0, 'YXZ')
        )
        break
      case FACES.TOP_LEFT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 0.5, 0, 'YXZ')
        )
        break

      case FACES.BOTTOM_FRONT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, 0, 0)
        )
        break
      case FACES.BOTTOM_RIGHT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, Math.PI * 0.5, 0, 'YXZ')
        )
        break
      case FACES.BOTTOM_BACK_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, Math.PI, 0, 'YXZ')
        )
        break
      case FACES.BOTTOM_LEFT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 0.5, 0, 'YXZ')
        )
        break

      case FACES.FRONT_RIGHT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(0, Math.PI * 0.25, 0)
        )
        break
      case FACES.BACK_RIGHT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(0, Math.PI * 0.75, 0)
        )
        break
      case FACES.BACK_LEFT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(0, -Math.PI * 0.75, 0)
        )
        break
      case FACES.FRONT_LEFT_EDGE:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(0, -Math.PI * 0.25, 0)
        )
        break

      case FACES.TOP_FRONT_RIGHT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 1.75, 0)
        )
        break
      case FACES.TOP_BACK_RIGHT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 1.25, 0)
        )
        break
      case FACES.TOP_BACK_LEFT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 0.75, 0)
        )
        break
      case FACES.TOP_FRONT_LEFT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 0.25, 0)
        )
        break

      case FACES.BOTTOM_FRONT_RIGHT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 1.75, 0)
        )
        break
      case FACES.BOTTOM_BACK_RIGHT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 1.25, 0)
        )
        break
      case FACES.BOTTOM_BACK_LEFT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 0.75, 0)
        )
        break
      case FACES.BOTTOM_FRONT_LEFT_CORNER:
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 0.25, 0)
        )
        break

      default:
        console.error(
          `ViewCubeControls: Invalid face, edge, or corner name '${side}'!`
        )
        break
    }

    this.radius = this.camera.position.distanceTo(focusPoint)
    targetPosition
      .applyQuaternion(this.targetQuaternion)
      .multiplyScalar(this.radius)
      .add(focusPoint)

    const dummy = new THREE.Object3D()
    dummy.position.copy(focusPoint)

    dummy.lookAt(this.camera.position)
    this.q1.copy(dummy.quaternion)

    dummy.lookAt(targetPosition)
    this.q2.copy(dummy.quaternion)
  }
}
