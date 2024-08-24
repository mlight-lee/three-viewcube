import { BaseViewer } from './baseView'

export class SingleViewer extends BaseViewer {
  protected onWindowResize() {
    super.onWindowResize()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
  }
}
