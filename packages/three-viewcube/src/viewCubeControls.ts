import * as THREE from 'three'
import { FACES } from './viewCubeData'
import { ViewCube } from './viewCube'

const MAINCOLOR = 0xdddddd
const ACCENTCOLOR = 0xf2f5ce
const OUTLINECOLOR = 0xcccccc

interface Animation {
  base: THREE.Vector3Like
  delta: THREE.Vector3Like
  duration: number
  time: number
}

export interface ViewCubeEvent {
  start: { quaternion: THREE.Quaternion }
  change: { quaternion: THREE.Quaternion }
  end: { quaternion: THREE.Quaternion }
}

export interface ViewCubeOptions {
  cubeSize?: number
  edgeSize?: number
  backgroundColor?: number
  outlineColor?: number
}

const DEFAULT_VIEWCUBE_OPTIONS: ViewCubeOptions = {
  cubeSize: 30,
  edgeSize: 5,
  backgroundColor: MAINCOLOR,
  outlineColor: OUTLINECOLOR
}

export class ViewCubeControls extends THREE.EventDispatcher<ViewCubeEvent> {
  private _cube: ViewCube
  private _animation: Animation | null
  private _renderer!: THREE.WebGLRenderer
  private _scene!: THREE.Scene
  private _cubeCamera!: THREE.PerspectiveCamera

  constructor(
    domElement: HTMLElement,
    options: ViewCubeOptions = DEFAULT_VIEWCUBE_OPTIONS
  ) {
    super()
    const mergedOptions: ViewCubeOptions = {
      ...DEFAULT_VIEWCUBE_OPTIONS,
      ...options
    }
    this._cube = new ViewCube({
      size: mergedOptions.cubeSize!,
      edge: mergedOptions.edgeSize!,
      outline: true,
      backgroundColor: mergedOptions.backgroundColor,
      outlineColor: mergedOptions.outlineColor
    })
    this.setCubeAngles(90, 0, 0, false)
    this._animation = null
    this.createScene(domElement)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseClick = this.handleMouseClick.bind(this)
    this.listen()
  }

  private createScene(domElement: HTMLElement) {
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(150, 150)
    this._renderer = renderer

    domElement.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.add(this._cube)
    this._scene = scene

    const cubeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    cubeCamera.position.set(0, 0, 70)
    cubeCamera.lookAt(0, 0, 0)
    this._cubeCamera = cubeCamera
  }

  private listen() {
    const domElement = this._renderer.domElement
    domElement.addEventListener('mousemove', this.handleMouseMove)
    domElement.addEventListener('click', this.handleMouseClick)
  }

  private handleMouseClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const x = (event.offsetX / target.clientWidth) * 2 - 1
    const y = -(event.offsetY / target.clientHeight) * 2 + 1
    this.checkSideTouch(x, y)
  }

  private checkSideTouch(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this._cubeCamera)
    const intersects = raycaster.intersectObjects(this._cube.children, true)
    if (intersects.length) {
      for (const { object } of intersects) {
        if (object.name) {
          this.rotateTheCube(object.name)
          break
        }
      }
    }
  }

  private rotateTheCube(side: string) {
    switch (side) {
      case FACES.FRONT:
        this.setCubeAngles(0, 0, 0)
        break
      case FACES.RIGHT:
        this.setCubeAngles(0, -90, 0)
        break
      case FACES.BACK:
        this.setCubeAngles(0, -180, 0)
        break
      case FACES.LEFT:
        this.setCubeAngles(0, -270, 0)
        break
      case FACES.TOP:
        this.setCubeAngles(90, 0, 0)
        break
      case FACES.BOTTOM:
        this.setCubeAngles(-90, 0, 0)
        break

      case FACES.TOP_FRONT_EDGE:
        this.setCubeAngles(45, 0, 0)
        break
      case FACES.TOP_RIGHT_EDGE:
        this.setCubeAngles(45, -90, 0)
        break
      case FACES.TOP_BACK_EDGE:
        this.setCubeAngles(45, -180, 0)
        break
      case FACES.TOP_LEFT_EDGE:
        this.setCubeAngles(45, -270, 0)
        break

      case FACES.BOTTOM_FRONT_EDGE:
        this.setCubeAngles(-45, 0, 0)
        break
      case FACES.BOTTOM_RIGHT_EDGE:
        this.setCubeAngles(-45, -90, 0)
        break
      case FACES.BOTTOM_BACK_EDGE:
        this.setCubeAngles(-45, -180, 0)
        break
      case FACES.BOTTOM_LEFT_EDGE:
        this.setCubeAngles(-45, -270, 0)
        break

      case FACES.FRONT_RIGHT_EDGE:
        this.setCubeAngles(0, -45, 0)
        break
      case FACES.BACK_RIGHT_EDGE:
        this.setCubeAngles(0, -135, 0)
        break
      case FACES.BACK_LEFT_EDGE:
        this.setCubeAngles(0, -225, 0)
        break
      case FACES.FRONT_LEFT_EDGE:
        this.setCubeAngles(0, -315, 0)
        break

      case FACES.TOP_FRONT_RIGHT_CORNER:
        this.setCubeAngles(45, -45, 0)
        break
      case FACES.TOP_BACK_RIGHT_CORNER:
        this.setCubeAngles(45, -135, 0)
        break
      case FACES.TOP_BACK_LEFT_CORNER:
        this.setCubeAngles(45, -225, 0)
        break
      case FACES.TOP_FRONT_LEFT_CORNER:
        this.setCubeAngles(45, -315, 0)
        break

      case FACES.BOTTOM_FRONT_RIGHT_CORNER:
        this.setCubeAngles(-45, -45, 0)
        break
      case FACES.BOTTOM_BACK_RIGHT_CORNER:
        this.setCubeAngles(-45, -135, 0)
        break
      case FACES.BOTTOM_BACK_LEFT_CORNER:
        this.setCubeAngles(-45, -225, 0)
        break
      case FACES.BOTTOM_FRONT_LEFT_CORNER:
        this.setCubeAngles(-45, -315, 0)
        break

      default:
        break
    }
  }

  private setCubeAngles(
    x: number,
    y: number,
    z: number,
    triggerEvent: boolean = true
  ) {
    const base = this._cube.rotation
    this._animation = {
      base: {
        x: base.x,
        y: base.y,
        z: base.z
      },
      delta: {
        x: calculateAngleDelta(base.x, THREE.MathUtils.degToRad(x)),
        y: calculateAngleDelta(base.y, THREE.MathUtils.degToRad(y)),
        z: calculateAngleDelta(base.z, THREE.MathUtils.degToRad(z))
      },
      duration: 500,
      time: Date.now()
    }
    if (triggerEvent) {
      this.dispatchEvent({
        type: 'start',
        quaternion: this._cube.quaternion.clone()
      })
    }
  }

  private handleMouseMove(event: MouseEvent) {
    const target = event.target as HTMLElement
    const x = (event.offsetX / target.clientWidth) * 2 - 1
    const y = -(event.offsetY / target.clientHeight) * 2 + 1
    this.checkSideOver(x, y)
  }

  private checkSideOver(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this._cubeCamera)
    const intersects = raycaster.intersectObjects(this._cube.children, true)
    // unhover
    this._cube.traverse(function (obj) {
      if (obj.name) {
        const mesh = obj as THREE.Mesh
        ;(mesh.material as THREE.MeshBasicMaterial).color.setHex(MAINCOLOR)
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
                ACCENTCOLOR
              )
            }
          })
          break
        }
      }
    }
  }

  update() {
    this._renderer.render(this._scene, this._cubeCamera)
    this.animate()
  }

  private animate() {
    if (!this._animation) return
    const now = Date.now()
    const { duration, time } = this._animation
    const alpha = Math.min((now - time) / duration, 1)
    this.animateCubeRotation(this._animation, alpha)
    if (alpha == 1) {
      this._animation = null
      this.dispatchEvent({
        type: 'end',
        quaternion: this._cube.quaternion.clone()
      })
    } else {
      this.dispatchEvent({
        type: 'change',
        quaternion: this._cube.quaternion.clone()
      })
    }
  }

  private animateCubeRotation(animation: Animation, alpha: number) {
    const { base, delta } = animation
    const ease = (Math.sin((alpha * 2 - 1) * Math.PI * 0.5) + 1) * 0.5
    const angleX = -TWOPI + base.x + delta.x * ease
    const angleY = -TWOPI + base.y + delta.y * ease
    const angleZ = -TWOPI + base.z + delta.z * ease
    this._cube.rotation.set(angleX % TWOPI, angleY % TWOPI, angleZ % TWOPI)
  }

  setQuaternion(quaternion: THREE.Quaternion) {
    this._cube.setRotationFromQuaternion(quaternion)
  }

  getObject() {
    return this._cube
  }
}

const TWOPI = 2 * Math.PI

function calculateAngleDelta(from: number, to: number) {
  const direct = to - from
  const altA = direct - TWOPI
  const altB = direct + TWOPI
  if (Math.abs(direct) > Math.abs(altA)) {
    return altA
  } else if (Math.abs(direct) > Math.abs(altB)) {
    return altB
  }
  return direct
}
