import * as THREE from 'three'
import { DEFAULT_FACENAMES, FaceNames } from './viewCubeData'
import { ViewCube } from './viewCube'

const MAIN_COLOR = 0xdddddd
const HOVER_COLOR = 0xf2f5ce
const OUTLINE_COLOR = 0xcccccc

export enum ViewCubePos {
  LEFT_BOTTOM = 0,
  LEFT_TOP = 1,
  RIGHT_TOP = 2,
  RIGHT_BOTTOM = 4
}

export interface ViewCubeOptions {
  pos?: ViewCubePos
  length?: number
  faceColor?: number
  hoverColor?: number
  outlineColor?: number
  faceNames?: FaceNames
}

export const DEFAULT_VIEWCUBE_OPTIONS: ViewCubeOptions = {
  pos: ViewCubePos.RIGHT_TOP,
  length: 128,
  faceColor: MAIN_COLOR,
  hoverColor: HOVER_COLOR,
  outlineColor: OUTLINE_COLOR,
  faceNames: DEFAULT_FACENAMES
}

export class ViewCubeControls extends THREE.Object3D {
  private cube: ViewCube
  private cubePos: ViewCubePos
  private cubeDim: number
  private orthoCamera: THREE.OrthographicCamera
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private domElement: HTMLElement
  private animating: boolean
  private turnRate: number
  private dummy: THREE.Object3D
  private radius: number
  private targetPosition: THREE.Vector3
  private targetQuaternion: THREE.Quaternion
  private q1: THREE.Quaternion
  private q2: THREE.Quaternion

  public center: THREE.Vector3
  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    domElement: HTMLElement,
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
    this.domElement = domElement
    this.animating = false
    this.center = new THREE.Vector3()

    // const raycaster = new THREE.Raycaster()
    // const mouse = new THREE.Vector2()
    this.dummy = new THREE.Object3D()

    this.orthoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 4)
    this.orthoCamera.position.set(0, 0, 2)

    this.cubeDim = mergedOptions.length!
    this.cubePos = mergedOptions.pos!

    this.turnRate = 2 * Math.PI // turn rate in angles per second

    this.targetPosition = new THREE.Vector3()
    this.targetQuaternion = new THREE.Quaternion()

    this.q1 = new THREE.Quaternion()
    this.q2 = new THREE.Quaternion()
    this.radius = 0
  }

  render(renderer: THREE.WebGLRenderer) {
    this.quaternion.copy(this.camera.quaternion).invert()
    this.updateMatrixWorld()
    renderer.clearDepth()
    const viewport = new THREE.Vector4()
    renderer.getViewport(viewport)
    const domElement = renderer.domElement
    const pos = this.calculateViewportPos(
      domElement.offsetWidth, 
      domElement.offsetHeight,
      this.cubePos,
      this.cubeDim
    )
    renderer.setViewport(pos.x, pos.y, this.cubeDim, this.cubeDim)
    renderer.render(this, this.orthoCamera)
    renderer.setViewport(
      viewport.x,
      viewport.y,
      viewport.z,
      viewport.w
    )
  }

  update(delta: number) {
    const step = delta * this.turnRate

    // animate position by doing a slerp and then scaling the position on the unit sphere
    this.q1.rotateTowards(this.q2, step)
    this.camera.position
      .set(0, 0, 1)
      .applyQuaternion(this.q1)
      .multiplyScalar(this.radius)
      .add(this.center)

    // animate orientation
    this.camera.quaternion.rotateTowards(this.targetQuaternion, step)

    if (this.q1.angleTo(this.q2) === 0) {
      this.animating = false
    }
  }

  dispose() {
    this.cube.dispose()
  }

  handleClick(event: MouseEvent) {
    if (this.animating === true) return false

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const rect = this.domElement.getBoundingClientRect()
    const offsetX = rect.left + (this.domElement.offsetWidth - this.cubeDim)
    const offsetY = rect.top + (this.domElement.offsetHeight - this.cubeDim)
    mouse.x = ((event.clientX - offsetX) / (rect.right - offsetX)) * 2 - 1
    mouse.y = -((event.clientY - offsetY) / (rect.bottom - offsetY)) * 2 + 1

    raycaster.setFromCamera(mouse, this.orthoCamera)

    const intersects = raycaster.intersectObject(this.cube)

    if (intersects.length > 0) {
      //const intersection = intersects[0]
      //const object = intersection.object
      this.prepareAnimationData(this.cube, this.center)
      this.animating = true
      return true
    } else {
      return false
    }
  }

  private calculateViewportPos(
    canvasWidth: number,
    canvasHeight: number,
    pos: ViewCubePos,
    length: number
  ) {
    let x = 0
    let y = 0
    switch(pos) {
      case ViewCubePos.LEFT_TOP:
        y = canvasHeight - length
        break
      case ViewCubePos.RIGHT_TOP:
        x = canvasWidth - length
        y = canvasHeight - length
        break
      case ViewCubePos.RIGHT_BOTTOM:
        x = canvasWidth - length
        break
    }
    return {x, y}
  }

  private prepareAnimationData(cube: ViewCube, focusPoint: THREE.Vector3Like) {
    switch (cube.userData.type) {
      case 'posX':
        this.targetPosition.set(1, 0, 0)
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0))
        break

      case 'posY':
        this.targetPosition.set(0, 1, 0)
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(-Math.PI * 0.5, 0, 0)
        )
        break

      case 'posZ':
        this.targetPosition.set(0, 0, 1)
        this.targetQuaternion.setFromEuler(new THREE.Euler())
        break

      case 'negX':
        this.targetPosition.set(-1, 0, 0)
        this.targetQuaternion.setFromEuler(
          new THREE.Euler(0, -Math.PI * 0.5, 0)
        )
        break

      case 'negY':
        this.targetPosition.set(0, -1, 0)
        this.targetQuaternion.setFromEuler(new THREE.Euler(Math.PI * 0.5, 0, 0))
        break

      case 'negZ':
        this.targetPosition.set(0, 0, -1)
        this.targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0))
        break

      default:
        console.error('ViewHelper: Invalid axis.')
    }

    this.radius = this.camera.position.distanceTo(focusPoint)
    this.targetPosition.multiplyScalar(this.radius).add(focusPoint)

    this.dummy.position.copy(focusPoint)

    this.dummy.lookAt(this.camera.position)
    this.q1.copy(this.dummy.quaternion)

    this.dummy.lookAt(this.targetPosition)
    this.q2.copy(this.dummy.quaternion)
  }
}
