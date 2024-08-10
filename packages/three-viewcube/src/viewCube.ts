import * as THREE from 'three'
import {
  CORNER_FACES,
  createFaceMaterials,
  DEFAULT_FACENAMES,
  EDGE_FACES,
  EDGE_FACES_SIDE,
  FaceNames
} from './viewCubeData'

export class ViewCube extends THREE.Object3D {
  private _cubeSize: number
  private _edgeSize: number
  private _outline: boolean
  private _backgroundColor: number
  private _outlineColor: number

  constructor(
    size: number = 60,
    edge: number = 5,
    outline: boolean = true,
    backgroundColor: number = 0xcccccc,
    outlineColor: number = 0x999999,
    faceNames: FaceNames = DEFAULT_FACENAMES
  ) {
    super()
    this._cubeSize = size
    this._edgeSize = edge
    this._outline = outline
    this._backgroundColor = backgroundColor
    this._outlineColor = outlineColor
    this.build(faceNames)
  }

  dispose() {
    // TODO: Finish it
  }

  private build(faceNames: FaceNames) {
    const faceSize = this._cubeSize - this._edgeSize * 2
    const faceOffset = this._cubeSize / 2
    const borderSize = this._edgeSize

    /* faces: front, right, back, left, top, bottom */
    const cubeFaces = this.createCubeFaces(faceSize, faceOffset)
    const faceMaterials = createFaceMaterials(faceNames)
    for (const [i, props] of faceMaterials.entries()) {
      const face = cubeFaces.children[i] as THREE.Mesh
      const material = face.material as THREE.MeshBasicMaterial
      material.color.setHex(this._backgroundColor)
      material.map = props.map
      face.name = props.name
    }
    this.add(cubeFaces)

    /* corners: top, bottom */
    const corners = []
    for (const [i, props] of CORNER_FACES.entries()) {
      const corner = this.createCornerFaces(
        borderSize,
        faceOffset,
        props.name,
        { color: this._backgroundColor }
      )
      corner.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        THREE.MathUtils.degToRad((i % 4) * 90)
      )
      corners.push(corner)
    }
    const topCorners = new THREE.Group()
    const bottomCorners = new THREE.Group()
    this.add(topCorners.add(...corners.slice(0, 4)))
    this.add(
      bottomCorners
        .add(...corners.slice(4))
        .rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI)
    )

    /* edges: top + bottom */
    const edges = []
    for (const [i, props] of EDGE_FACES.entries()) {
      const edge = this.createHorzEdgeFaces(
        faceSize,
        borderSize,
        faceOffset,
        props.name,
        { color: this._backgroundColor }
      )
      edge.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        THREE.MathUtils.degToRad((i % 4) * 90)
      )
      edges.push(edge)
    }
    const topEdges = new THREE.Group()
    const bottomEdges = new THREE.Group()
    this.add(topEdges.add(...edges.slice(0, 4)))
    this.add(
      bottomEdges
        .add(...edges.slice(4))
        .rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI)
    )

    /* edges on the side */
    const sideEdges = new THREE.Group()
    for (const [i, props] of EDGE_FACES_SIDE.entries()) {
      const edge = this.createVertEdgeFaces(
        borderSize,
        faceSize,
        faceOffset,
        props.name,
        { color: this._backgroundColor }
      )
      edge.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        THREE.MathUtils.degToRad(i * 90)
      )
      sideEdges.add(edge)
    }
    this.add(sideEdges)

    if (this._outline) {
      this.add(this.createCubeOutline(this._cubeSize))
    }
  }

  private createFace(
    size: number | number[],
    position: number[],
    { axis = [0, 1, 0], angle = 0, name = '', matProps = {} } = {}
  ) {
    if (!Array.isArray(size)) size = [size, size]
    const material = new THREE.MeshBasicMaterial(matProps)
    const geometry = new THREE.PlaneGeometry(size[0], size[1])
    const face = new THREE.Mesh(geometry, material)
    face.name = name
    face.rotateOnAxis(
      new THREE.Vector3(...axis),
      THREE.MathUtils.degToRad(angle)
    )
    face.position.set(position[0], position[1], position[2])
    return face
  }

  private createCubeFaces(faceSize: number, offset: number) {
    const faces = new THREE.Object3D()
    faces.add(
      this.createFace(faceSize, [0, 0, offset], { axis: [0, 1, 0], angle: 0 })
    )
    faces.add(
      this.createFace(faceSize, [offset, 0, 0], { axis: [0, 1, 0], angle: 90 })
    )
    faces.add(
      this.createFace(faceSize, [0, 0, -offset], {
        axis: [0, 1, 0],
        angle: 180
      })
    )
    faces.add(
      this.createFace(faceSize, [-offset, 0, 0], {
        axis: [0, 1, 0],
        angle: 270
      })
    )
    faces.add(
      this.createFace(faceSize, [0, offset, 0], {
        axis: [1, 0, 0],
        angle: -90
      })
    )
    faces.add(
      this.createFace(faceSize, [0, -offset, 0], {
        axis: [1, 0, 0],
        angle: 90
      })
    )
    return faces
  }

  private createCornerFaces(
    faceSize: number,
    offset: number,
    name = '',
    matProps = {}
  ) {
    const corner = new THREE.Object3D()
    const borderOffset = offset - faceSize / 2
    corner.add(
      this.createFace(faceSize, [borderOffset, borderOffset, offset], {
        axis: [0, 1, 0],
        angle: 0,
        matProps,
        name
      })
    )
    corner.add(
      this.createFace(faceSize, [offset, borderOffset, borderOffset], {
        axis: [0, 1, 0],
        angle: 90,
        matProps,
        name
      })
    )
    corner.add(
      this.createFace(faceSize, [borderOffset, offset, borderOffset], {
        axis: [1, 0, 0],
        angle: -90,
        matProps,
        name
      })
    )
    return corner
  }

  private createHorzEdgeFaces(
    w: number,
    h: number,
    offset: number,
    name = '',
    matProps = {}
  ) {
    const edge = new THREE.Object3D()
    const borderOffset = offset - h / 2
    edge.add(
      this.createFace([w, h], [0, borderOffset, offset], {
        axis: [0, 1, 0],
        angle: 0,
        name,
        matProps
      })
    )
    edge.add(
      this.createFace([w, h], [0, offset, borderOffset], {
        axis: [1, 0, 0],
        angle: -90,
        name,
        matProps
      })
    )
    return edge
  }

  private createVertEdgeFaces(
    w: number,
    h: number,
    offset: number,
    name: string = '',
    matProps = {}
  ) {
    const edge = new THREE.Object3D()
    const borderOffset = offset - w / 2
    edge.add(
      this.createFace([w, h], [borderOffset, 0, offset], {
        axis: [0, 1, 0],
        angle: 0,
        name,
        matProps
      })
    )
    edge.add(
      this.createFace([w, h], [offset, 0, borderOffset], {
        axis: [0, 1, 0],
        angle: 90,
        name,
        matProps
      })
    )
    return edge
  }

  private createCubeOutline(size: number) {
    const geometry = new THREE.BoxGeometry(size, size, size)
    const geo = new THREE.EdgesGeometry(geometry)
    const mat = new THREE.LineBasicMaterial({
      color: this._outlineColor,
      linewidth: 1
    })
    const wireframe = new THREE.LineSegments(geo, mat)
    return wireframe
  }
}
