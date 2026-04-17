import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

export default function SandboxPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 等浏览器完成布局再初始化，避免 clientWidth/clientHeight 为 0
    let rafId: number
    rafId = requestAnimationFrame(() => init(container))
    return () => cancelAnimationFrame(rafId)
  }, [])

  // 把 Three.js 初始化抽到独立函数，方便 cleanup 返回
  function init(container: HTMLDivElement) {
    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f0eb)
    scene.fog = new THREE.FogExp2(0xf5f0eb, 0.008)

    const w = container.clientWidth
    const h = container.clientHeight
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 1000)
    const camDist = 18
    const camAngle = Math.PI / 6
    const camRotation = Math.PI / 5
    camera.position.set(
      camDist * Math.cos(camAngle) * Math.sin(camRotation),
      camDist * Math.sin(camAngle) + 4,
      camDist * Math.cos(camAngle) * Math.cos(camRotation)
    )
    camera.lookAt(0, 0.5, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // ── Tilt-Shift Post-processing ──
    const TiltShiftShader = {
      uniforms: {
        tDiffuse: { value: null },
        focusY: { value: 0.5 },
        blurAmount: { value: 1.8 },
        resolution: { value: new THREE.Vector2(w, h) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float focusY;
        uniform float blurAmount;
        uniform vec2 resolution;
        varying vec2 vUv;
        void main() {
          float dist = abs(vUv.y - focusY);
          float blur = smoothstep(0.0, 0.4, dist) * blurAmount;
          vec4 color = vec4(0.0); float total = 0.0;
          float pixelSize = 1.0 / resolution.y;
          for(int i=-6;i<=6;i++) for(int j=-6;j<=6;j++) {
            float wt = exp(-float(i*i+j*j)/(2.0*blur*blur+0.001));
            vec2 offset = vec2(float(j),float(i))*pixelSize*blur;
            color += texture2D(tDiffuse, vUv+offset)*wt; total += wt;
          }
          float vig = 1.0 - 0.3*length((vUv-0.5)*1.4);
          gl_FragColor = (color/total)*vig;
          gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(0.95,0.97,1.02));
          gl_FragColor.rgb += vec3(0.01,0.005,0.0);
        }
      `
    }
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const tiltShiftPass = new ShaderPass(TiltShiftShader)
    composer.addPass(tiltShiftPass)

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0xfff5e6, 0.6))
    const mainLight = new THREE.DirectionalLight(0xfff0d4, 2.2)
    mainLight.position.set(8, 15, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.set(2048, 2048)
    mainLight.shadow.camera.left = -12; mainLight.shadow.camera.right = 12
    mainLight.shadow.camera.top = 12;   mainLight.shadow.camera.bottom = -12
    mainLight.shadow.bias = -0.0005; mainLight.shadow.normalBias = 0.02; mainLight.shadow.radius = 4
    scene.add(mainLight)
    const fill = new THREE.DirectionalLight(0xd4e5ff, 0.5); fill.position.set(-6,8,-4); scene.add(fill)
    const rim  = new THREE.DirectionalLight(0xffeedd, 0.4); rim.position.set(-3,5,10);  scene.add(rim)

    // ── Materials ──
    const woodMat      = new THREE.MeshStandardMaterial({ color: 0xc9a86c, roughness: 0.7 })
    const darkWoodMat  = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.75 })
    const innerWallMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.4, side: THREE.DoubleSide })
    const sandMat      = new THREE.MeshStandardMaterial({ color: 0xf0e4c8, roughness: 0.95 })
    const roofMat      = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.8 })
    const leafMat      = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.85 })
    const leafMat2     = new THREE.MeshStandardMaterial({ color: 0x5d9b4a, roughness: 0.85 })
    const trunkMat     = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 })
    const fenceMat     = new THREE.MeshStandardMaterial({ color: 0xbfa06a, roughness: 0.8 })
    const stoneMat     = new THREE.MeshStandardMaterial({ color: 0xb0a89a, roughness: 0.9 })
    const whiteMat     = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.6 })
    const doorMat      = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.75 })

    // ── Sand height helper ──
    function getSandHeight(x: number, z: number) {
      let h = 0
      h += Math.sin(x*0.8+1.2)*Math.cos(z*0.6+0.8)*0.12
      h += Math.sin(x*1.8+3.0)*Math.cos(z*2.2+1.5)*0.06
      h += Math.sin(x*3.5+0.5)*Math.cos(z*3.0+2.0)*0.03
      return h + 0.45
    }

    // ── Sand Tray ──
    const trayGroup = new THREE.Group()
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(10,0.25,7), woodMat)
    bottom.receiveShadow = true; bottom.castShadow = true; trayGroup.add(bottom)
    const innerBottom = new THREE.Mesh(new THREE.BoxGeometry(9.5,0.02,6.5), innerWallMat)
    innerBottom.position.y = 0.14; trayGroup.add(innerBottom)

    function createWall(ww:number,wh:number,wd:number,x:number,y:number,z:number,inner:boolean) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(ww,wh,wd), inner ? innerWallMat : woodMat)
      m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m
    }
    const wallH=1.2, wallT=0.25
    trayGroup.add(createWall(10.5,wallH,wallT,         0,wallH/2+0.12,  3.5+wallT/2, false))
    trayGroup.add(createWall(10.5,wallH,wallT,         0,wallH/2+0.12, -3.5-wallT/2, false))
    trayGroup.add(createWall(wallT,wallH,7+wallT*2,  5+wallT/2,wallH/2+0.12, 0, false))
    trayGroup.add(createWall(wallT,wallH,7+wallT*2, -5-wallT/2,wallH/2+0.12, 0, false))
    trayGroup.add(createWall(9.5,wallH-0.15,0.05, 0,wallH/2+0.2, 3.45, true))
    trayGroup.add(createWall(9.5,wallH-0.15,0.05, 0,wallH/2+0.2,-3.45, true))
    trayGroup.add(createWall(0.05,wallH-0.15,6.9, 4.95,wallH/2+0.2,0, true))
    trayGroup.add(createWall(0.05,wallH-0.15,6.9,-4.95,wallH/2+0.2,0, true))
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.35,wallH+0.1,0.35), darkWoodMat)
      trim.position.set(sx*5.1, wallH/2+0.12, sz*3.6); trim.castShadow=true; trayGroup.add(trim)
    }
    scene.add(trayGroup)

    // ── Sand Surface ──
    const sandGeo = new THREE.PlaneGeometry(9.4,6.4,128,128)
    sandGeo.rotateX(-Math.PI/2)
    const posAttr = sandGeo.attributes.position
    for (let i=0;i<posAttr.count;i++) {
      const x=posAttr.getX(i), z=posAttr.getZ(i)
      let hh=0
      hh+=Math.sin(x*0.8+1.2)*Math.cos(z*0.6+0.8)*0.12
      hh+=Math.sin(x*1.8+3.0)*Math.cos(z*2.2+1.5)*0.06
      hh+=Math.sin(x*3.5+0.5)*Math.cos(z*3.0+2.0)*0.03
      hh+=Math.sin(x*6.0+2.0)*Math.cos(z*5.5)*0.015
      const pathDist=Math.abs(z-Math.sin(x*0.5)*0.8-0.3)
      if(pathDist<0.4) hh-=(0.4-pathDist)*0.15
      posAttr.setY(i, hh+0.45)
    }
    sandGeo.computeVertexNormals()
    const sand = new THREE.Mesh(sandGeo, sandMat); sand.receiveShadow=true; sand.castShadow=true; scene.add(sand)
    const sandEdge = new THREE.Mesh(new THREE.BoxGeometry(9.5,0.15,6.5), sandMat); sandEdge.position.y=0.18; scene.add(sandEdge)

    // ── House ──
    function createHouse(x:number,z:number,scale=1,rotation=0) {
      const house = new THREE.Group()
      const walls = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.7,0.7), whiteMat)
      walls.position.y=0.35; walls.castShadow=true; walls.receiveShadow=true; house.add(walls)
      const roofShape = new THREE.Shape()
      roofShape.moveTo(-0.55,0); roofShape.lineTo(0,0.4); roofShape.lineTo(0.55,0); roofShape.closePath()
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape,{depth:0.8,bevelEnabled:false}), roofMat)
      roof.rotation.y=Math.PI/2; roof.position.set(0.4,0.7,-0.275); roof.castShadow=true; house.add(roof)
      house.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.18,0.35,0.02),doorMat),{position:new THREE.Vector3(0,0.2,0.36)}))
      const winMat = new THREE.MeshStandardMaterial({color:0xcce5ff,roughness:0.2,metalness:0.1})
      for (const wx of [-0.22,0.22]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.02),winMat); win.position.set(wx,0.45,0.36); house.add(win)
      }
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.3,0.12),new THREE.MeshStandardMaterial({color:0x8b4513,roughness:0.85}))
      chimney.position.set(0.2,1.0,0); chimney.castShadow=true; house.add(chimney)
      house.position.set(x,getSandHeight(x,z),z); house.rotation.y=rotation; house.scale.setScalar(scale)
      return house
    }
    scene.add(createHouse(-1.5,-1.0,1.0,0.3))
    scene.add(createHouse(2.5,1.5,0.7,-0.5))

    // ── Trees ──
    function createTree(x:number,z:number,s=1,type=0) {
      const tree = new THREE.Group()
      const trunkH=0.5+Math.random()*0.3
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04*s,0.06*s,trunkH*s,8),trunkMat)
      trunk.position.y=trunkH*s/2; trunk.castShadow=true; tree.add(trunk)
      if(type===0){
        for(let i=0;i<3+Math.floor(Math.random()*2);i++){
          const r=(0.2+Math.random()*0.15)*s
          const sphere = new THREE.Mesh(new THREE.SphereGeometry(r,12,10),Math.random()>0.5?leafMat:leafMat2)
          sphere.position.set((Math.random()-0.5)*0.15*s,trunkH*s+(Math.random()-0.3)*0.2*s,(Math.random()-0.5)*0.15*s)
          sphere.castShadow=true; tree.add(sphere)
        }
      } else {
        for(let i=0;i<3;i++){
          const cone = new THREE.Mesh(new THREE.ConeGeometry((0.25-i*0.06)*s,0.3*s,8),leafMat)
          cone.position.y=trunkH*s+i*0.2*s; cone.castShadow=true; tree.add(cone)
        }
      }
      tree.position.set(x,getSandHeight(x,z),z); return tree
    }
    scene.add(createTree(-3.2,1.5,1.0,0)); scene.add(createTree(-2.5,2.2,0.8,1))
    scene.add(createTree(1.0,-1.8,1.1,0)); scene.add(createTree(3.5,-0.5,0.9,1))
    scene.add(createTree(-0.5,2.5,0.7,0)); scene.add(createTree(3.8,2.0,0.75,1))
    scene.add(createTree(-3.8,-1.5,0.85,0))

    // ── Fence ──
    function createFence(sx:number,sz:number,ex:number,ez:number,segs=5) {
      const fence = new THREE.Group()
      for(let i=0;i<=segs;i++){
        const t=i/segs; const fx=sx+(ex-sx)*t; const fz=sz+(ez-sz)*t; const sy2=getSandHeight(fx,fz)
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.45,0.06),fenceMat)
        post.position.set(fx,sy2+0.22,fz); post.castShadow=true; fence.add(post)
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.08,4),fenceMat)
        cap.position.set(fx,sy2+0.48,fz); cap.castShadow=true; fence.add(cap)
        if(i<segs){
          const t2=(i+1)/segs; const nx=sx+(ex-sx)*t2; const nz=sz+(ez-sz)*t2; const ny=getSandHeight(nx,nz)
          const mx=(fx+nx)/2; const mz=(fz+nz)/2; const my=(sy2+ny)/2
          const dist=Math.sqrt((nx-fx)**2+(nz-fz)**2); const angle=Math.atan2(nz-fz,nx-fx)
          for(const rh of [0.15,0.32]){
            const rail = new THREE.Mesh(new THREE.BoxGeometry(dist,0.03,0.03),fenceMat)
            rail.position.set(mx,my+rh,mz); rail.rotation.y=-angle; rail.castShadow=true; fence.add(rail)
          }
        }
      }
      return fence
    }
    scene.add(createFence(-3.0,0.5,-0.5,0.5,6)); scene.add(createFence(1.5,-2.0,3.5,-2.0,4))

    // ── Stones ──
    const stonesGroup = new THREE.Group()
    for(const [sx,sz] of [[-0.3,0.0],[0.3,-0.5],[0.9,-0.9],[1.5,-0.6],[2.0,-0.2]] as [number,number][]){
      const stone = new THREE.Mesh(new THREE.SphereGeometry(0.1+Math.random()*0.06,8,6),stoneMat)
      stone.scale.y=0.4; stone.position.set(sx,getSandHeight(sx,sz)+0.03,sz)
      stone.rotation.y=Math.random()*Math.PI; stone.castShadow=true; stonesGroup.add(stone)
    }
    scene.add(stonesGroup)

    // ── Pond ──
    const pondMat2 = new THREE.MeshStandardMaterial({color:0x6fa8c7,roughness:0.1,metalness:0.3,transparent:true,opacity:0.7})
    const pond = new THREE.Mesh(new THREE.CircleGeometry(0.6,32),pondMat2)
    pond.rotation.x=-Math.PI/2; pond.position.set(2.8,getSandHeight(2.8,0.5)+0.01,0.5); scene.add(pond)
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2; const rx=2.8+Math.cos(a)*0.55; const rz=0.5+Math.sin(a)*0.55
      const rs = new THREE.Mesh(new THREE.SphereGeometry(0.06+Math.random()*0.03,6,5),stoneMat)
      rs.scale.y=0.5; rs.position.set(rx,getSandHeight(rx,rz)+0.04,rz); rs.castShadow=true; scene.add(rs)
    }

    // ── Bridge ──
    function createBridge(x:number,z:number,rot=0){
      const bridge = new THREE.Group(); const sy2=getSandHeight(x,z)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.04,0.35),darkWoodMat)
      deck.position.y=0.15; deck.castShadow=true; bridge.add(deck)
      for(let i=-3;i<=3;i++){
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.02,0.35),fenceMat)
        plank.position.set(i*0.1,0.18,0); bridge.add(plank)
      }
      for(const side of [-1,1]){
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.03,0.03),darkWoodMat)
        rail.position.set(0,0.3,side*0.17); bridge.add(rail)
        for(const p of [-1,0,1]){
          const rp = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.18,0.03),darkWoodMat)
          rp.position.set(p*0.25,0.23,side*0.17); bridge.add(rp)
        }
      }
      bridge.position.set(x,sy2,z); bridge.rotation.y=rot; return bridge
    }
    scene.add(createBridge(2.8,0.5,0.8))

    // ── Figurines ──
    function createFigurine(x:number,z:number,color=0xe8b89d,s=1){
      const fig = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05*s,0.06*s,0.25*s,8),new THREE.MeshStandardMaterial({color:0x5577aa,roughness:0.7}))
      body.position.y=0.2*s; body.castShadow=true; fig.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.05*s,10,8),new THREE.MeshStandardMaterial({color,roughness:0.6}))
      head.position.y=0.38*s; head.castShadow=true; fig.add(head)
      fig.position.set(x,getSandHeight(x,z),z); return fig
    }
    scene.add(createFigurine(-1.2,0.0,0xe8b89d,1.0)); scene.add(createFigurine(0.8,1.2,0xd4a574,0.85))

    // ── Mushrooms ──
    for(const [mx,mz,ms] of [[-2.8,1.2,1.0],[-2.6,1.4,0.7],[3.2,-1.5,0.9]] as [number,number,number][]){
      const mush = new THREE.Group()
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015*ms,0.02*ms,0.08*ms,6),whiteMat)
      stem.position.y=0.04*ms; mush.add(stem)
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.04*ms,8,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xcc4444,roughness:0.7}))
      cap.position.y=0.08*ms; cap.castShadow=true; mush.add(cap)
      mush.position.set(mx,getSandHeight(mx,mz),mz); scene.add(mush)
    }

    // ── Flowers ──
    function createFlower(x:number,z:number,color=0xff6699){
      const flower = new THREE.Group()
      flower.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.15,4),leafMat),{position:new THREE.Vector3(0,0.075,0)}))
      const pMat = new THREE.MeshStandardMaterial({color,roughness:0.6})
      for(let i=0;i<5;i++){
        const a=(i/5)*Math.PI*2
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.025,6,5),pMat)
        petal.position.set(Math.cos(a)*0.03,0.16,Math.sin(a)*0.03); petal.scale.y=0.5; flower.add(petal)
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.015,6,5),new THREE.MeshStandardMaterial({color:0xffdd00,roughness:0.5}))
      center.position.y=0.16; flower.add(center)
      flower.position.set(x,getSandHeight(x,z),z); return flower
    }
    scene.add(createFlower(-3.5,2.0,0xff6699)); scene.add(createFlower(-3.3,2.3,0xffaa44))
    scene.add(createFlower(1.3,2.2,0xff88cc));  scene.add(createFlower(1.6,2.4,0xaa66ff))
    scene.add(createFlower(-1.0,-2.3,0xff6699))

    // ── Sand Spiral ──
    const spiralPts: THREE.Vector3[] = []
    for(let t=0;t<Math.PI*4;t+=0.15){
      const r=0.15+t*0.08
      spiralPts.push(new THREE.Vector3(
        3.5+Math.cos(t)*r*0.4,
        getSandHeight(3.5+Math.cos(t)*r*0.4,-1.5+Math.sin(t)*r*0.4)+0.01,
        -1.5+Math.sin(t)*r*0.4
      ))
    }
    const spiral = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPts),60,0.012,4,false),
      new THREE.MeshStandardMaterial({color:0xe0d4b8,roughness:1.0})
    )
    spiral.receiveShadow=true; scene.add(spiral)

    // ── Desk ──
    const desk = new THREE.Mesh(new THREE.BoxGeometry(16,0.3,12),new THREE.MeshStandardMaterial({color:0xdec8a0,roughness:0.6}))
    desk.position.y=-0.28; desk.receiveShadow=true; scene.add(desk)

    // ── Particles ──
    const pCount=80; const pPos=new Float32Array(pCount*3)
    for(let i=0;i<pCount;i++){
      pPos[i*3]=(Math.random()-0.5)*14; pPos[i*3+1]=Math.random()*6+1; pPos[i*3+2]=(Math.random()-0.5)*10
    }
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3))
    const particles = new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xffeedd,size:0.03,transparent:true,opacity:0.3,sizeAttenuation:true}))
    scene.add(particles)

    // ── Interaction ──
    let targetRotY=0, currentRotY=0, isDragging=false, lastMouseX=0

    const onMouseDown = (e: MouseEvent) => { isDragging=true; lastMouseX=e.clientX }
    const onMouseUp   = ()             => { isDragging=false }
    const onMouseMove = (e: MouseEvent) => { if(isDragging){ targetRotY+=(e.clientX-lastMouseX)*0.003; lastMouseX=e.clientX } }
    const onTouchStart= (e: TouchEvent) => { isDragging=true; lastMouseX=e.touches[0].clientX }
    const onTouchEnd  = ()              => { isDragging=false }
    const onTouchMove = (e: TouchEvent) => { if(isDragging&&e.touches.length===1){ targetRotY+=(e.touches[0].clientX-lastMouseX)*0.003; lastMouseX=e.touches[0].clientX } }
    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    container.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchmove', onTouchMove)

    // ── Animation loop ──
    const clock = new THREE.Clock()
    let animRafId: number
    function animate() {
      animRafId = requestAnimationFrame(animate)
      const dt=clock.getDelta(); const time=clock.getElapsedTime()
      if(!isDragging) targetRotY+=dt*0.05
      currentRotY+=(targetRotY-currentRotY)*0.05
      camera.position.x=camDist*Math.cos(camAngle)*Math.sin(camRotation+currentRotY)
      camera.position.z=camDist*Math.cos(camAngle)*Math.cos(camRotation+currentRotY)
      camera.position.y=camDist*Math.sin(camAngle)+4
      camera.lookAt(0,0.5,0)
      const pp = particles.geometry.attributes.position.array as Float32Array
      for(let i=0;i<pCount;i++){
        pp[i*3+1]+=Math.sin(time+i)*0.001
        pp[i*3]  +=Math.cos(time*0.5+i*0.3)*0.0005
      }
      particles.geometry.attributes.position.needsUpdate=true
      ;(pond.material as THREE.MeshStandardMaterial).opacity=0.6+Math.sin(time*2)*0.1
      composer.render()
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      const cw=container.clientWidth; const ch=container.clientHeight
      camera.aspect=cw/ch; camera.updateProjectionMatrix()
      renderer.setSize(cw,ch); composer.setSize(cw,ch)
      tiltShiftPass.uniforms.resolution.value.set(cw,ch)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animRafId)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px',
        background: 'linear-gradient(to bottom, rgba(245,240,235,0.9) 60%, transparent)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', color: 'rgba(60,50,40,0.6)', padding: '4px' }}
        >
          ←
        </button>
        <span style={{ fontSize: '16px', color: 'rgba(60,50,40,0.75)', fontWeight: 500 }}>沙盘创作</span>
        <span style={{ fontSize: '12px', color: 'rgba(60,50,40,0.4)', marginLeft: 'auto' }}>
          拖动旋转场景
        </span>
      </div>

      {/* 3D Canvas 容器：flex:1 撑满剩余高度 */}
      <div
        ref={containerRef}
        style={{ flex: 1, width: '100%', touchAction: 'none' }}
      />
    </div>
  )
}
