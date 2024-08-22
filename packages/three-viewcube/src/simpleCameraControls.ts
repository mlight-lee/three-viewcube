import * as THREE from 'three'

interface OrbitControlsLike {
  target: THREE.Vector3
  addEventListener: (eventName: string, listener: () => void) => void
  removeEventListener: (eventName: string, listener: () => void) => void
  update(): void
}

/**
 * A highly customizable standalone view cube addon for three.js.
 */
export class SimpleCameraControls {
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private animating: boolean
  private turnRate: number
  private radius: number
  private q1: THREE.Quaternion
  private q2: THREE.Quaternion
  private controls: OrbitControlsLike | undefined
  private target: THREE.Vector3
  private clock: THREE.Clock

  /**
   * Construct one instance of view cube helper
   * @param camera Camera used in your canvas
   * @param renderer Renderer used in your canvas
   * @param options Options to customize view cube helper
   */
  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  ) {
    this.camera = camera
    this.animating = false
    this.turnRate = 2 * Math.PI // turn rate in angles per second
    this.target = new THREE.Vector3()
    this.q1 = new THREE.Quaternion()
    this.q2 = new THREE.Quaternion()
    this.radius = 0
    this.clock = new THREE.Clock()
  }

  /**
   * Set associated obit controls
   * @param controls The associated orbit controls
   */
  setControls(controls: OrbitControlsLike) {
    if (!controls) return
    this.controls = controls
  }

  /**
   * Animation loop
   */
  update() {
    if (this.animating === false) return

    const delta = this.clock.getDelta()
    const step = delta * this.turnRate

    // animate position by doing a slerp and then scaling the position on the unit sphere
    this.q1.rotateTowards(this.q2, step)
    this.camera.position
      .set(0, 0, 1)
      .applyQuaternion(this.q1)
      .multiplyScalar(this.radius)
      .add(this.target)

    // animate orientation
    this.camera.quaternion.rotateTowards(this.q2, step)
    this.camera.updateProjectionMatrix()
    this.controls?.update()

    if (this.q1.angleTo(this.q2) <= 0.00001) {
      this.animating = false
      this.clock.stop()
    }
  }

  /**
   * Fly with the target quaterion
   * @param quaternion 
   */
  flyTo(quaternion: THREE.Quaternion) {
    const focusPoint = new THREE.Vector3()
    const targetPosition = new THREE.Vector3(0, 0, 1)

    this.radius = this.camera.position.distanceTo(focusPoint)
    targetPosition
      .applyQuaternion(quaternion)
      .multiplyScalar(this.radius)
      .add(focusPoint)

    const dummy = new THREE.Object3D()
    dummy.position.copy(focusPoint)

    dummy.lookAt(this.camera.position)
    this.q1.copy(dummy.quaternion)

    dummy.lookAt(targetPosition)
    this.q2.copy(dummy.quaternion)

    this.animating = true
    this.clock.start()
  }
}