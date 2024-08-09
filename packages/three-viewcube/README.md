<h1 align="center">Three ViewCube</h1>

ViewCube addon for THREE.js. It is implemented based on [this project](https://codesandbox.io/s/y35w749501?file=/src/index.js).

## Installation

You can install **Three ViewCube** via npm:

```bash
npm install three-viewport-gizmo
```

## Usage

### Standalone

Use it with your `camera` and `renderer` instances, the `container` is the `HTMLElement` containing the canvas.

```javascript
import { ViewCubeControls } from '@mlightcad/three-viewcube'

const container = document.body
const viewCubeControls = new ViewCubeControls(camera, renderer, options)

// Animation loop
function animate() {
  viewCubeControls.render()

  // ... Your animation logic
  renderer.render(scene, camera)
}
```

## References

- [three-viewport-gizmo](https://github.com/Fennec-hub/three-viewport-gizmo/): a highly customizable standalone interactive version of the official [three.js viewport helper](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/helpers/ViewHelper.js)

