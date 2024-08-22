<h1 align="center">ViewCube for Three.js</h1>

A highly customizable standalone view cube addon for three.js with the following features:

- Customize face, edge, and corner color
- Customize position of view cube
- Customize size of view cube
- Customize text shown in each face of view. It can be used for internalization.

<img src="./doc/viewcube.jpg" width="423" height="223" alt="ViewCube Example">

You can play with it through [this live demo](https://mlight-lee.github.io/three-viewcube/).

## Installation

You can install **Three ViewCube** via npm:

```bash
npm install @mlightcad/three-viewcube
```

## Usage

Use it with your `camera` and `renderer` instances.

```javascript
import { ViewCubeGizmo } from '@mlightcad/three-viewcube'

// Create your renderer and set alhpa to true
const renderer = new THREE.WebGLRenderer({ alpha: true })

// Create your camera
const camera = ...

// Create your orbit controller
const cameraControls = new OrbitControls(camera, renderer.domElement)

// Create viewcube gizmo
const viewCubeGizmo = new ViewCubeGizmo(camera, renderer)

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  renderer.clear()
  renderer.render(scene, camera)
  viewCubeGizmo.update()
}

animate()
```

If you want to rotate the current view after clicked face, edge, or corner of viewcube. You need to listen to 'change' event of `ViewCubeGizmo`.

```javascript
viewCubeGizmo.addEventListener('change', event => {
  // TODO: Add you own logic to rotate the view
})
```

To correctly rotate current view, you need to consider bounding box of objects in current view and camera (position, lookAt, movement, rotation). Class `SimpleCameraControls` is provided to faciliate it. However, `SimpleCameraControls` just considers camera roation. You can refine `SimpleCameraControls` by yourselves.

You can customize view cube by passing one `ViewCubeOptions` instance when creating one `ViewCubeGizmo` instance. Defintion of `ViewCubeOptions` is as follows.

```javascript
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

```

For example, you can set view cube options as follows if you want to set text shown in each face to Chinese.

```javascript
import { FaceNames, ViewCubeGizmo } from '@mlightcad/three-viewcube'

// Create you camera and render
......

const faceNames: FaceNames = {
  top: '顶',
  front: '前',
  right: '右',
  back: '后',
  left: '左',
  bottom: '底'
}
const viewCubeGizmo = new ViewCubeGizmo(camera, renderer, { faceNames: faceNames })

```

## References
- [viewcube demo project](https://codesandbox.io/s/y35w749501?file=/src/index.js)
- [three-viewport-gizmo](https://github.com/Fennec-hub/three-viewport-gizmo/)
- [three.js viewport helper](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/helpers/ViewHelper.js)

