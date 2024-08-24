import * as THREE from 'three'
import { DEFAULT_FACENAMES, FaceNames } from './faceNames'
import { FACES } from './viewCubeData'
import { ViewCube } from './viewCube'
import { FixedPosGizmo, ObjectPosition } from './fixedPosGizmo'

const MAIN_COLOR = 0xdddddd
const HOVER_COLOR = 0xf2f5ce
const OUTLINE_COLOR = 0xcccccc

/**
 * Options to customize view cube
 */
export interface ViewCubeOptions {
  /**
   * Position of view cube
   */
  pos?: ObjectPosition
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
 * Default view cube option values
 */
export const DEFAULT_VIEWCUBE_OPTIONS: ViewCubeOptions = {
  pos: ObjectPosition.RIGHT_TOP,
  dimension: 150,
  faceColor: MAIN_COLOR,
  hoverColor: HOVER_COLOR,
  outlineColor: OUTLINE_COLOR,
  faceNames: DEFAULT_FACENAMES
}

export interface ViewCubeEvent extends THREE.Object3DEventMap {
  change: { quaternion: THREE.Quaternion }
}

/**
 * A highly customizable standalone view cube gizmo for three.js.
 */
export class ViewCubeGizmo extends FixedPosGizmo<ViewCubeEvent> {
  private cube: ViewCube

  /**
   * Construct one instance of view cube gizmo
   * @param camera Camera used in your canvas
   * @param renderer Renderer used in your canvas
   * @param options Options to customize view cube gizmo
   */
  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    options: ViewCubeOptions = DEFAULT_VIEWCUBE_OPTIONS
  ) {
    const mergedOptions: ViewCubeOptions = {
      ...DEFAULT_VIEWCUBE_OPTIONS,
      ...options
    }
    super(camera, renderer, options.dimension!, options.pos!)

    this.cube = new ViewCube(
      2,
      0.2,
      true,
      mergedOptions.faceColor,
      mergedOptions.outlineColor,
      mergedOptions.faceNames
    )
    this.add(this.cube)

    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseClick = this.handleMouseClick.bind(this)
    this.listen(renderer.domElement)
  }

  /**
   * Free the GPU-related resources allocated by this instance. Call this method whenever this instance
   * is no longer used in your app.
   */
  dispose() {
    this.cube.dispose()
  }

  private listen(domElement: HTMLElement) {
    domElement.addEventListener('mousemove', this.handleMouseMove)
    domElement.addEventListener('click', this.handleMouseClick)
  }

  private handleMouseClick(event: MouseEvent) {
    const bbox = this.calculateViewportBbox()
    if (bbox.containsPoint(new THREE.Vector2(event.offsetX, event.offsetY))) {
      const pos = this.calculatePosInViewport(
        event.offsetX,
        event.offsetY,
        bbox
      )
      this.checkSideTouch(pos.x, pos.y)
    }
  }

  private handleMouseMove(event: MouseEvent) {
    const bbox = this.calculateViewportBbox()
    if (bbox.containsPoint(new THREE.Vector2(event.offsetX, event.offsetY))) {
      const pos = this.calculatePosInViewport(
        event.offsetX,
        event.offsetY,
        bbox
      )
      this.checkSideOver(pos.x, pos.y)
    }
  }

  private checkSideTouch(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.gizmoCamera)
    const intersects = raycaster.intersectObjects(this.cube.children, true)
    if (intersects.length) {
      for (const { object } of intersects) {
        if (object.name) {
          const quaternion = this.getRotation(object.name)
          this.dispatchEvent({
            type: 'change',
            quaternion: quaternion
          })
          break
        }
      }
    }
  }

  private checkSideOver(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.gizmoCamera)
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

  private getRotation(side: string) {
    const targetQuaternion = new THREE.Quaternion()
    switch (side) {
      case FACES.FRONT:
        targetQuaternion.setFromEuler(new THREE.Euler())
        break
      case FACES.RIGHT:
        targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0))
        break
      case FACES.BACK:
        targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0))
        break
      case FACES.LEFT:
        targetQuaternion.setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0))
        break
      case FACES.TOP:
        targetQuaternion.setFromEuler(new THREE.Euler(-Math.PI * 0.5, 0, 0))
        break
      case FACES.BOTTOM:
        targetQuaternion.setFromEuler(new THREE.Euler(Math.PI * 0.5, 0, 0))
        break

      case FACES.TOP_FRONT_EDGE:
        targetQuaternion.setFromEuler(new THREE.Euler(-Math.PI * 0.25, 0, 0))
        break
      case FACES.TOP_RIGHT_EDGE:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, Math.PI * 0.5, 0, 'YXZ')
        )
        break
      case FACES.TOP_BACK_EDGE:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, Math.PI, 0, 'YXZ')
        )
        break
      case FACES.TOP_LEFT_EDGE:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 0.5, 0, 'YXZ')
        )
        break

      case FACES.BOTTOM_FRONT_EDGE:
        targetQuaternion.setFromEuler(new THREE.Euler(Math.PI * 0.25, 0, 0))
        break
      case FACES.BOTTOM_RIGHT_EDGE:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, Math.PI * 0.5, 0, 'YXZ')
        )
        break
      case FACES.BOTTOM_BACK_EDGE:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, Math.PI, 0, 'YXZ')
        )
        break
      case FACES.BOTTOM_LEFT_EDGE:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 0.5, 0, 'YXZ')
        )
        break

      case FACES.FRONT_RIGHT_EDGE:
        targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.25, 0))
        break
      case FACES.BACK_RIGHT_EDGE:
        targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.75, 0))
        break
      case FACES.BACK_LEFT_EDGE:
        targetQuaternion.setFromEuler(new THREE.Euler(0, -Math.PI * 0.75, 0))
        break
      case FACES.FRONT_LEFT_EDGE:
        targetQuaternion.setFromEuler(new THREE.Euler(0, -Math.PI * 0.25, 0))
        break

      case FACES.TOP_FRONT_RIGHT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 1.75, 0)
        )
        break
      case FACES.TOP_BACK_RIGHT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 1.25, 0)
        )
        break
      case FACES.TOP_BACK_LEFT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 0.75, 0)
        )
        break
      case FACES.TOP_FRONT_LEFT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 0.25, 0)
        )
        break

      case FACES.BOTTOM_FRONT_RIGHT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 1.75, 0)
        )
        break
      case FACES.BOTTOM_BACK_RIGHT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 1.25, 0)
        )
        break
      case FACES.BOTTOM_BACK_LEFT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.25, -Math.PI * 0.75, 0)
        )
        break
      case FACES.BOTTOM_FRONT_LEFT_CORNER:
        targetQuaternion.setFromEuler(
          new THREE.Euler(Math.PI * 0.25, -Math.PI * 0.25, 0)
        )
        break

      default:
        console.error(
          `[ViewCubeGizmo]: Invalid face, edge, or corner name '${side}'!`
        )
        break
    }
    return targetQuaternion
  }
}
