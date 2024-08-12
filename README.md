<h1 align="center">Three ViewCube</h1>

ViewCube addon for THREE.js. 
## Installation

You can install **Three ViewCube** via npm:

```bash
npm install @mlightcad/three-viewcube
```

## Usage

### Standalone

Use it with your `camera` and `renderer` instances.

```javascript
import { ViewCubeControls } from '@mlightcad/three-viewcube'

// Create your renderer and set alhpa to true
const renderer = new THREE.WebGLRenderer({ alpha: true })

// Create your camera
const camera = ...

// Create viewcube control
const viewCubeControls = new ViewCubeControls(camera, renderer, options)

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  renderer.clear()
  renderer.render(scene, camera)
  viewCubeControls.render(renderer)
}

animate()
```

## References
- [viewcube demo project](https://codesandbox.io/s/y35w749501?file=/src/index.js)
- [three-viewport-gizmo](https://github.com/Fennec-hub/three-viewport-gizmo/)
- [three.js viewport helper](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/helpers/ViewHelper.js)

