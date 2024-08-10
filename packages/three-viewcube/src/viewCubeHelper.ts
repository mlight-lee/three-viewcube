import * as THREE from 'three'
import { ViewCube } from './viewCube'
import { DEFAULT_VIEWCUBE_OPTIONS, ViewCubeOptions } from './viewCubeControls'

export class ViewCubeHelper extends THREE.Object3D {
  private cube: ViewCube
  private orthoCamera: THREE.OrthographicCamera
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private domElement: HTMLElement
  private animating: boolean
  private turnRate: number
  private dummy: THREE.Object3D
  private dim: number
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
      mergedOptions.backgroundColor,
      mergedOptions.outlineColor
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

    this.dim = 128
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

    const x = this.domElement.offsetWidth - this.dim

    renderer.clearDepth()

    const viewport = new THREE.Vector4()
    renderer.getViewport(viewport)
    renderer.setViewport(x, 0, this.dim, this.dim)

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

  /**
   * TODO: Remove it later. It is added for debugging only.
   */
  createCube() {
    const color1 = new THREE.Color('#ff4466')
    const color2 = new THREE.Color('#88ff44')
    const color3 = new THREE.Color('#4488ff')

    const geometry = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5)
      .rotateZ(-Math.PI / 2)
      .translate(0.4, 0, 0)

    const xAxis = new THREE.Mesh(geometry, this.getAxisMaterial(color1))
    const yAxis = new THREE.Mesh(geometry, this.getAxisMaterial(color2))
    const zAxis = new THREE.Mesh(geometry, this.getAxisMaterial(color3))

    yAxis.rotation.z = Math.PI / 2
    zAxis.rotation.y = -Math.PI / 2

    this.add(xAxis)
    this.add(zAxis)
    this.add(yAxis)
  }

  private getAxisMaterial(color: THREE.Color) {
    return new THREE.MeshBasicMaterial({ color: color, toneMapped: false })
  }

  handleClick(event: MouseEvent) {
    if (this.animating === true) return false

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const rect = this.domElement.getBoundingClientRect()
    const offsetX = rect.left + (this.domElement.offsetWidth - this.dim)
    const offsetY = rect.top + (this.domElement.offsetHeight - this.dim)
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
