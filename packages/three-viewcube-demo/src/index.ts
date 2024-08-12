import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FaceNames, ViewCubeControls } from '@mlightcad/three-viewcube'
import { ViewCube } from '@mlightcad/three-viewcube'

// Create scene
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector('#app')!.appendChild(renderer.domElement)

// Create lights
const ambientLight = new THREE.AmbientLight('white', 0.4)
const pointLight = new THREE.PointLight('white', 20, 100)
pointLight.position.set(-2, 2, 2)
pointLight.castShadow = true
pointLight.shadow.radius = 4
pointLight.shadow.camera.near = 0.5
pointLight.shadow.camera.far = 4000
pointLight.shadow.mapSize.width = 2048
pointLight.shadow.mapSize.height = 2048
scene.add(ambientLight)
scene.add(pointLight)

// Create 3d objects
const planeGeometry = new THREE.PlaneGeometry(3, 3)
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
// const box = new THREE.BoxGeometry(1, 1)
// const cube = new THREE.Mesh(box, planeMaterial)
const faceNames: FaceNames = {
  top: '顶',
  front: '前',
  right: '右',
  back: '后',
  left: '左',
  bottom: '底'
}
const cube = new ViewCube(1, 0.1, true, 0xcccccc, 0x999999, faceNames)
//applyQuaternion(cube)
scene.add(cube)
scene.add(plane)
scene.add(new THREE.AxesHelper(2))

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
)
camera.lookAt(0, 0, 0)
camera.position.set(0, 0, 3)

// Create viewcube
const viewCubeControls = new ViewCubeControls(camera, renderer)

// Create orbit controller
const cameraControls = new OrbitControls(camera, renderer.domElement)
cameraControls.target = cube.position.clone()
cameraControls.enableDamping = true
cameraControls.autoRotate = false
cameraControls.update()

function update() {
  requestAnimationFrame(update)
  renderer.clear()
  renderer.render(scene, camera)
  viewCubeControls.render()
}

update()
