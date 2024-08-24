import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import GUI from 'lil-gui'
import {
  AxesGizmo,
  FaceNames,
  ObjectPosition,
  SimpleCameraControls,
  ViewCube,
  ViewCubeGizmo
} from '@mlightcad/three-viewcube'

interface CameraInfo {
  // Rotation in degree unit
  rotation: THREE.Vector3
  direction: THREE.Vector3
}

export class BaseViewer {
  private _scene: THREE.Scene
  private _camera: THREE.PerspectiveCamera
  private _cameraControls: OrbitControls
  private _renderer: THREE.WebGLRenderer
  private _viewCubeGizmo: ViewCubeGizmo
  private _axesGizmo: AxesGizmo
  private _simpleCameraControls: SimpleCameraControls
  private _objects: THREE.Group
  private _bbox: THREE.Box3
  private _aspect: number
  private _cameraInfo: CameraInfo

  constructor() {
    this._bbox = new THREE.Box3()
    this._aspect = window.innerWidth / window.innerHeight
    this._scene = this.createScene()
    this._camera = this.createCamera()
    this._renderer = this.creatRenderer()
    this._cameraControls = this.createCameraControls()
    this._objects = this.createObjects()
    this._simpleCameraControls = this.createSimpleCameraControls()
    this._viewCubeGizmo = this.createViewCubeGizmo()
    this._axesGizmo = this.createAxesGizmo()
    this._cameraInfo = {
      rotation: new THREE.Vector3(),
      direction: new THREE.Vector3()
    }
    this.createLights()
    this.createGUI()
    window.addEventListener('resize', this.onWindowResize.bind(this))
    this.initialize()
  }

  initialize() {
    // This method is called after camera and render is created.
    // Children class can override this method to add its own logic
  }

  get camera() {
    return this._camera
  }

  get scene() {
    return this._scene
  }

  get renderer() {
    return this._renderer
  }

  get cameraControls() {
    return this._cameraControls
  }

  get bbox() {
    return this._bbox
  }

  get aspect() {
    return this._aspect
  }

  get objects() {
    return this._objects
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.renderer.clear()
    this.update()
    this._viewCubeGizmo.update()
    this._axesGizmo.update()
    this._simpleCameraControls.update()
    this.updateCameraInfo()
  }

  protected update() {
    this.renderer.render(this.scene, this.camera)
  }

  protected createScene() {
    const scene = new THREE.Scene()
    return scene
  }

  protected createCamera() {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      150,
      1000
    )
    camera.lookAt(0, 0, 0)
    camera.position.set(500, 500, 500)
    this.scene.add(camera)
    return camera
  }

  protected creatRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    return renderer
  }

  protected createLights() {
    const ambientLight = new THREE.AmbientLight('white', 0.4)
    const pointLight = new THREE.PointLight('white', 20, 100)
    pointLight.position.set(-2, 2, 2)
    pointLight.castShadow = true
    pointLight.shadow.radius = 4
    pointLight.shadow.camera.near = 0.5
    pointLight.shadow.camera.far = 4000
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048
    this.scene.add(ambientLight)
    this.scene.add(pointLight)
  }

  protected createCameraControls() {
    const cameraControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )
    cameraControls.enableDamping = true
    cameraControls.autoRotate = false
    cameraControls.update()
    return cameraControls
  }

  protected createSimpleCameraControls() {
    const simpleCameraControls = new SimpleCameraControls(this.camera)
    simpleCameraControls.setControls(this.cameraControls)
    return simpleCameraControls
  }

  protected createObjects() {
    const group = new THREE.Group()
    const planeGeometry = new THREE.PlaneGeometry(200, 200, 10, 10)
    planeGeometry.name = 'plane'
    const planeMaterial = new THREE.MeshLambertMaterial({
      color: 'gray',
      emissive: 'teal',
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.receiveShadow = true
    const faceNames: FaceNames = {
      top: '顶',
      front: '前',
      right: '右',
      back: '后',
      left: '左',
      bottom: '底'
    }
    const cube = new ViewCube(100, 5, true, 0xcccccc, 0x999999, faceNames)
    const axes = new THREE.AxesHelper(100)

    group.add(cube)
    group.add(plane)
    group.add(axes)
    this.scene.add(group)

    // Calculate bounding box
    if (plane.geometry.boundingBox) this._bbox.union(plane.geometry.boundingBox)
    if (axes.geometry.boundingBox) this._bbox.union(axes.geometry.boundingBox)

    return group
  }

  protected createViewCubeGizmo() {
    const viewCubeGizmo = new ViewCubeGizmo(this.camera, this.renderer)
    viewCubeGizmo.addEventListener('change', event => {
      this._simpleCameraControls.flyTo(event.quaternion)
    })
    return viewCubeGizmo
  }

  protected createAxesGizmo() {
    const axes2dGizmo = new AxesGizmo(this.camera, this.renderer, {
      pos: ObjectPosition.RIGHT_BOTTOM
    })
    axes2dGizmo.setTextColor(new THREE.Color(0x00ff00))
    return axes2dGizmo
  }

  protected createGUI() {
    const gui = new GUI({ title: 'Debug GUI', width: 300, autoPlace: false })
    const container = document.getElementById('gui')
    container?.appendChild(gui.domElement)
    const camera = this.camera

    const cameraPositionFolder = gui.addFolder('Camera Position')
    cameraPositionFolder.add(camera.position, 'x').listen()
    cameraPositionFolder.add(camera.position, 'y').listen()
    cameraPositionFolder.add(camera.position, 'z').listen()

    const cameraRotationFolder = gui.addFolder('Camera Rotation in degree')
    cameraRotationFolder.add(this._cameraInfo.rotation, 'x').listen()
    cameraRotationFolder.add(this._cameraInfo.rotation, 'y').listen()
    cameraRotationFolder.add(this._cameraInfo.rotation, 'z').listen()

    const cameraDirectionFolder = gui.addFolder('Camera Direction')
    cameraDirectionFolder.add(this._cameraInfo.direction, 'x').listen()
    cameraDirectionFolder.add(this._cameraInfo.direction, 'y').listen()
    cameraDirectionFolder.add(this._cameraInfo.direction, 'z').listen()

    gui.close()
  }

  protected updateCameraInfo() {
    this._cameraInfo.rotation
      .copy(this.camera.rotation)
      .multiplyScalar(180 / Math.PI)
    this.camera.getWorldDirection(this._cameraInfo.direction)
  }

  protected onWindowResize() {
    this._aspect = window.innerWidth / window.innerHeight
  }
}
