import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import GUI from 'lil-gui'
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'


// Scene setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000)
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
})

const controls = new OrbitControls(camera, renderer.domElement)

// Add these lines after creating your controls
controls.minDistance = 10    // Can't zoom closer than this
controls.maxDistance = 2000  // Can't zoom further than this
controls.enableDamping = true
controls.dampingFactor = 0.1

// const axesHelper= new THREE.AxesHelper()
// scene.add(axesHelper)

let cubeObjects = []

const tableNames = ["VisualSceneNode1221", "VisualSceneNode1222", "VisualSceneNode1223", "VisualSceneNode1224", "VisualSceneNode1225", "VisualSceneNode1226",
                    "VisualSceneNode1227", "VisualSceneNode1228", "VisualSceneNode1229", "VisualSceneNode1230", "VisualSceneNode1231", "VisualSceneNode1232"
]

// const material = new THREE.MeshBasicMaterial()

// 1. Set initial background color
scene.background = new THREE.Color('#ffffff')

// 2. Create a color parameter for GUI
const params = {
  backgroundColor: '#ffffff'
}

const gui = new GUI()
gui.addColor(params, 'backgroundColor').onChange((value) => {
  scene.background.set(value)
})

let sceneModel = null

// Load GLB file
const loader = new GLTFLoader()
loader.load("./models/casino_floor_map.glb", (gltf) => {
    
    const object = gltf.scene
    sceneModel = gltf.scene

    const box  = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Center the model at origin
    object.position.sub(center)
    object.scale.setScalar(1)

    const pivot = new THREE.Group()
    pivot.add(object)
    scene.add(pivot)  

    // object.position.x = -65
    // object.position.z = 15

    pivot.rotation.y =  Math.PI + 0.75

    // Simple auto-positioning
    const maxDim = Math.max(size.x, size.y, size.z)
    
    // Set camera far back and high up
    // camera.position.set(maxDim, maxDim , maxDim)
    camera.position.set(25, 30, 25)

    // camera.lookAt(0, 0, 0)

    
    // Update camera settings
    camera.near = maxDim * 0.001
    camera.far = maxDim * 10
    camera.updateProjectionMatrix()
    
    // Set up controls for easy navigation
    controls.target.set(0, 0, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = maxDim * 0.1
    controls.maxDistance = maxDim * 3

    controls.update()
    
    outsideModel()

    // Add a bright material to make it visible
    object.traverse((child) => {
        if (child.isMesh && tableNames.includes(child.name)) {
            const material = new THREE.MeshStandardMaterial()
            child.material = material
            cubeObjects.push(child)

            
            

            // console.log("cube added for heatmap:", child.name)
             // Log all object names to see what we're working with
            console.log('Found object:', child.name)
            
            

            // if (child.name.includes("VisualSceneNode1232")) {
            //     // store the cubes
            //     child.userData.originalColor = child.material.color.clone()
            //     cubeObjects.push(child)
            //     console.log("cube added for heatmap:", child.name)
            // }
            
            
        }
    })

    

    // 🎯 Find the object by name
    const base = object.getObjectByName('VisualSceneNode1221')
    base.material = new THREE.MeshStandardMaterial({ color: "red" })
    // base.material = new THREE.MeshBasicMaterial({ color: 0x000000 })


    // const baseWall = object.getObjectByName('VisualSceneNode1')
    // baseWall.material = new THREE.MeshBasicMaterial({ color: "red", wireframe: true })

    // base.children[0].material = new THREE.MeshBasicMaterial({ color: "white" })

    console.log(base)
    
    // Create the slider after objects are loaded
    createSlider()
})

function outsideModel() {
    if (sceneModel) {
        const baseWall = sceneModel.getObjectByName('VisualSceneNode1228')
        baseWall.material = new THREE.MeshBasicMaterial({ color: 0x00ffff})
        console.log(baseWall.material)
        // const wireframe = new THREE.WireframeGeometry(baseWall.geometry)
        // const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 })
        // const wireframeLines = new THREE.LineSegments(wireframe, lineMaterial)

        // Position the lines exactly on the mesh
    //     wireframe.position.copy(child.position)
    //     wireframe.rotation.copy(child.rotation)
    //     wireframe.scale.copy(child.scale)
        
    //     group.add(wireframe)
    }
}

console.log(sceneModel)

// gui.add(material, 'metalness').min(0).max(1).step(0.0001)

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x222222)
document.getElementById('app').appendChild(renderer.domElement)

// NEW!!
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// renderer.toneMapping = THREE.ACESFilmicToneMapping
// renderer.toneMappingExposure = 1;

// Basic lighting

// const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
// // directionalLight.position.set(10, 10, 5)
// scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
// const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(ambientLight)
gui.add(ambientLight, 'intensity').min(0).max(3).step(0.1)


const pointLight = new THREE.DirectionalLight(0xffffff, 3)
pointLight.position.set(25, 30, 25)
// pointLight.position.set(5, 5, 5)
scene.add(pointLight)
gui.add(pointLight, 'intensity').min(0).max(5).step(0.1)

const pointLightHelper = new THREE.PointLightHelper(pointLight, 1)
scene.add(pointLightHelper)

// Position camera
// camera.position.set(0, 0, 0);
// camera.lookAt(0, 0, 0);

controls.target.set(0, 0, 0)

function createSlider() {
    const sliderContainer = document.createElement('div')
    sliderContainer.style.position = 'absolute'
    sliderContainer.style.top = '20px'
    sliderContainer.style.left = '20px'
    sliderContainer.style.zIndex = '100'
    sliderContainer.style.background = 'rgba(0,0,0,0.7)'
    sliderContainer.style.padding = '20px'
    sliderContainer.style.borderRadius = '5px'
    sliderContainer.style.color = 'white'
    
    sliderContainer.innerHTML = `
        <label>Heatmap Intensity:</label><br>
        <input type="range" id="heatmapSlider" min="0" max="50" value="0">
        <span id="sliderValue">0</span>
    `
    
    document.body.appendChild(sliderContainer)
    
    const slider = document.getElementById('heatmapSlider')
    const valueDisplay = document.getElementById('sliderValue')
    
    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        valueDisplay.textContent = value
        updateHeatmap()
    })
    
    // Initial heatmap
    updateHeatmap()
}

function updateHeatmap() {
    const sliderValue = parseInt(document.getElementById('heatmapSlider').value)
    
    cubeObjects.forEach((cube, index) => {
        if (sliderValue === 0) {
            cube.material.color = cube.userData.originalColor
        } else {
            // Generate truly random level for each cube each time
            const randomLevel = Math.floor(Math.random() * 5) + 1 // Random 1-5
            
            const colors = [
                new THREE.Color(0xffcccc), // Level 1
                new THREE.Color(0xff9999), // Level 2
                new THREE.Color(0xff6666), // Level 3
                new THREE.Color(0xff3333), // Level 4
                new THREE.Color(0xff0000)  // Level 5
            ]
            
            cube.material.color = colors[randomLevel - 1]
            
            console.log(`Cube ${index}: level=${randomLevel}`)
        }
    })
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();   
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();