import * as THREE from 'three'
import { BaseViewer } from './baseView'

export class DoubleViewer extends BaseViewer {
  private _cameraHelper!: THREE.CameraHelper
  private _cameraInRightView!: THREE.PerspectiveCamera

  initialize() {
    this._cameraInRightView = this.createCameraInRightView()
    this._cameraHelper = this.createCameraHelper()
    this.renderer.setScissorTest(true)
  }

  get cameraInLeftView() {
    return this.camera
  }

  get cameraInRightView() {
    return this._cameraInRightView
  }

  protected createCamera() {
    const camera = new THREE.PerspectiveCamera(50, 0.5 * this.aspect, 150, 1000)
    camera.lookAt(0, 0, 0)
    camera.position.set(0, 0, 500)
    this.scene.add(camera)
    return camera
  }

  protected createCameraInRightView() {
    const camera = new THREE.PerspectiveCamera(50, 0.5 * this.aspect, 1, 40000)
    camera.position.set(0, 0, 2000)
    this.scene.add(camera)
    return camera
  }

  private createCameraHelper() {
    const cameraHelper = new THREE.CameraHelper(this.camera)
    cameraHelper.visible = true
    this.scene.add(cameraHelper)
    this.cameraInLeftView.updateProjectionMatrix()
    cameraHelper.update()
    return cameraHelper
  }

  protected update() {
    const SCREEN_WIDTH = window.innerWidth
    const SCREEN_HEIGHT = window.innerHeight

    this.cameraInRightView.lookAt(this.objects.position)
    this._cameraHelper.update()

    this._cameraHelper.visible = false
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.setScissor(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT)
    this.renderer.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT)
    this.renderer.render(this.scene, this.cameraInLeftView)
    this._cameraHelper.visible = true

    this.renderer.setClearColor(0x111111, 1)
    this.renderer.setScissor(
      SCREEN_WIDTH / 2,
      0,
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT
    )
    this.renderer.setViewport(
      SCREEN_WIDTH / 2,
      0,
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT
    )
    this.renderer.render(this.scene, this.cameraInRightView)
  }

  protected onWindowResize() {
    super.onWindowResize()
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.cameraInLeftView.aspect = 0.5 * this.aspect
    this.cameraInLeftView.updateProjectionMatrix()

    this.cameraInRightView.aspect = 0.5 * this.aspect
    this.cameraInRightView.updateProjectionMatrix()
  }
}
