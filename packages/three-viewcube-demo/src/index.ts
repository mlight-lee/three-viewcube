import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ViewCubeControls } from '@mlightcad/three-viewcube'

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
const sideLength = 1
const cubeGeometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength)
const cubeMaterial = new THREE.MeshStandardMaterial({
  color: '#f69f1f',
  metalness: 0.5,
  roughness: 0.7
})
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
cube.castShadow = true
cube.position.z = 0.5
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
//plane.rotateX(Math.PI / 2)
plane.receiveShadow = true
scene.add(cube)
scene.add(plane)
scene.add(new THREE.AxesHelper(2))
scene.add(new THREE.GridHelper(5, 10, 0xfffffff))

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
const domElement = document.querySelector('#cube-scene') as HTMLElement
const viewCubeControls = new ViewCubeControls(domElement)
viewCubeControls.setQuaternion(camera.quaternion)
viewCubeControls.addEventListener('change', event => {
  camera.setRotationFromQuaternion(event.quaternion.invert())
})

// Create orbit controller
const cameraControls = new OrbitControls(camera, renderer.domElement)
cameraControls.target = cube.position.clone()
cameraControls.enableDamping = true
cameraControls.autoRotate = false
cameraControls.update()
cameraControls.addEventListener('change', _event => {
  viewCubeControls.setQuaternion(camera.quaternion)
})

function update() {
  requestAnimationFrame(update)
  viewCubeControls.update()
  renderer.render(scene, camera)
}

update()
