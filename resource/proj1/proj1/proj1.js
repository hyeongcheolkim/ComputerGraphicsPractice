import * as THREE from '/resource/proj1/resources/three.js/build/three.module.js';
import { OrbitControls } from '/resource/proj1/resources/three.js/examples/jsm/controls/OrbitControls.js';
import { GUI } from '/resource/proj1/3rdparty/dat.gui.module.js';
import { FontLoader } from '/resource/proj1/resources/three.js/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from '/resource/proj1/resources/three.js/examples/jsm/geometries/TextGeometry.js'

function main() {
    const canvas = document.querySelector('#webgl');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.shadowMap.enabled = true;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    // room
    const room = { width: 30, height: 20 };
    {
        const cubeGeo = new THREE.BoxBufferGeometry(room.width, room.height, room.width);
        const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
        cubeMat.side = THREE.BackSide;
        const mesh = new THREE.Mesh(cubeGeo, cubeMat);
        mesh.position.set(0, room.height / 2, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    }

    // pixar?
    {
        const loader = new FontLoader();
        loader.load('/resource/proj1/resources/three.js/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const text = "P I X A R ?";
            const textGeo = new TextGeometry(text, {
                font: font,
                size: 3,
                height: 1.2,
                curveSegments: 30,
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.2,
                bevelSegments: 20,
            });
            const textMat = new THREE.MeshPhongMaterial({ color: 'red' });
            const mesh = new THREE.Mesh(textGeo, textMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.set(-9, 7, -3);
            scene.add(mesh);
        });
    }

    //backgroundSticks
    {
        for (let i = 0; i < room.width; i += 2) {
            const stickGeo = new THREE.BoxGeometry(1, room.height, 1);
            const stickMat = new THREE.MeshPhongMaterial({ color: 'grey' });
            const mesh = new THREE.Mesh(stickGeo, stickMat);
            mesh.position.set(-(room.width / 2) + 1 + i, room.height / 2, -8);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
        }
    }

    // define the luxo lamp

    // base
    const base = new THREE.Object3D();
    {
        scene.add(base);
        base.position.z = 12;
        base.position.x = -11;
    }
    // baseMesh 
    const baseMesh = { width: 4, height: 1, color: 'red' };
    {
        baseMesh.mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: baseMesh.color }));
        baseMesh.mesh.castShadow = true;
        baseMesh.mesh.receiveShadow = true;
        base.add(baseMesh.mesh);
    }

    // baseDisc
    const baseDisc = new THREE.Object3D();
    {
        baseDisc.angle = 60;
        base.add(baseDisc);
    }
    // baseDiscMesh
    const baseDiscMesh = { radius: 1, height: 0.2, color: 'orange', segs: 8 };
    {
        baseDiscMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(baseDiscMesh.radius,
                baseDiscMesh.radius, baseDiscMesh.height, baseDiscMesh.segs),
            new THREE.MeshPhongMaterial({ color: baseDiscMesh.color }));
        baseDiscMesh.mesh.castShadow = true;
        baseDiscMesh.mesh.receiveShadow = true;
        baseDisc.add(baseDiscMesh.mesh);
    }

    //baseJoint
    const baseJoint = new THREE.Object3D();
    {
        baseJoint.angle = 0;
        baseDisc.add(baseJoint);
    }
    //baseJointMesh
    const baseJointMesh = { radius: 0.5, height: 1.2, color: 'green', segs: 30 };
    {
        baseJointMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(baseJointMesh.radius,
                baseJointMesh.radius, baseJointMesh.height, baseJointMesh.segs),
            new THREE.MeshPhongMaterial({ color: baseJointMesh.color }));
        baseJointMesh.mesh.castShadow = true;
        baseJointMesh.mesh.receiveShadow = true;
        baseJoint.add(baseJointMesh.mesh);
    }

    //lowerArm
    const lowerArm = new THREE.Object3D();
    {
        baseJoint.add(lowerArm);
    }
    //lowerArmMesh
    const lowerArmMesh = { radius: 0.4, height: 4, color: 'blue', segs: 30 };
    {
        lowerArmMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(lowerArmMesh.radius,
                lowerArmMesh.radius, lowerArmMesh.height, lowerArmMesh.segs),
            new THREE.MeshPhongMaterial({ color: lowerArmMesh.color }));
        lowerArmMesh.heightInit = lowerArmMesh.height;
        lowerArmMesh.mesh.castShadow = true;
        lowerArmMesh.mesh.receiveShadow = true;
        lowerArm.add(lowerArmMesh.mesh);
    }

    //middleJoint
    const middleJoint = new THREE.Object3D();
    {
        middleJoint.angle = 0;
        lowerArm.add(middleJoint);
    }
    //middleJointMesh
    const middleJointMesh = { radius: 0.5, height: 1.2, color: 'green', segs: 30 };
    {
        middleJointMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(middleJointMesh.radius,
                middleJointMesh.radius, middleJointMesh.height, middleJointMesh.segs),
            new THREE.MeshPhongMaterial({ color: middleJointMesh.color }));
        middleJointMesh.mesh.castShadow = true;
        middleJointMesh.mesh.receiveShadow = true;
        middleJoint.add(middleJointMesh.mesh);
    }

    //upperArm
    const upperArm = new THREE.Object3D();
    {
        middleJoint.add(upperArm);
    }
    //upperArmMesh
    const upperArmMesh = { radius: 0.4, height: 4, color: 'blue', segs: 30 };
    {
        upperArmMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(upperArmMesh.radius,
                upperArmMesh.radius, upperArmMesh.height, upperArmMesh.segs),
            new THREE.MeshPhongMaterial({ color: upperArmMesh.color }));
        upperArmMesh.heightInit = upperArmMesh.height;
        upperArmMesh.mesh.castShadow = true;
        upperArmMesh.mesh.receiveShadow = true;
        upperArm.add(upperArmMesh.mesh);
    }

    // headJoint
    const headJoint = new THREE.Object3D();
    {
        headJoint.angle = 0;
        upperArm.add(headJoint);
    }
    // headJointMesh
    const headJointMesh = { radius: 0.5, height: 1.2, color: 'green', segs: 30 };
    {
        headJointMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(headJointMesh.radius,
                headJointMesh.radius, headJointMesh.height, headJointMesh.segs),
            new THREE.MeshPhongMaterial({ color: headJointMesh.color }));
        headJointMesh.mesh.castShadow = true;
        headJointMesh.mesh.receiveShadow = true;
        headJoint.add(headJointMesh.mesh);
    }

    //lampShade
    const lampShade = new THREE.Object3D();
    {
        headJoint.add(lampShade);
    }
    //lampShadeMesh
    const lampShadeMesh = { radiusTop: 1, radiusBottom: 2, height: 2, color: 'grey', segs: 30 };
    {
        lampShadeMesh.mesh = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(lampShadeMesh.radiusTop,
                lampShadeMesh.radiusBottom, lampShadeMesh.height, lampShadeMesh.segs),
            new THREE.MeshPhongMaterial({ color: lampShadeMesh.color }));
        lampShadeMesh.mesh.castShadow = true;
        lampShadeMesh.mesh.receiveShadow = true;
        lampShade.add(lampShadeMesh.mesh);
    }

    //lightBulb
    const lightBulb = new THREE.Object3D();
    {
        lampShade.add(lightBulb);
    }
    //lightBulbMesh
    const lightBulbMesh = { radius: 1, color: 'yellow', segs: 30 };
    {
        lightBulbMesh.mesh = new THREE.Mesh(
            new THREE.SphereBufferGeometry(lightBulbMesh.radius,
                lightBulbMesh.segs, lightBulbMesh.segs),
            new THREE.MeshPhongMaterial({ color: lightBulbMesh.color }));
        lightBulb.add(lightBulbMesh.mesh);
    }

    function updateLuxo() {
        base.position.y = baseMesh.height / 2;
        baseMesh.mesh.scale.set(baseMesh.width, baseMesh.height, baseMesh.width);

        baseDisc.position.y = baseMesh.height / 2;
        baseDisc.rotation.y = THREE.MathUtils.degToRad(baseDisc.angle);
        baseDiscMesh.mesh.position.y = baseDiscMesh.height / 2;

        baseJoint.rotation.z = THREE.MathUtils.degToRad(baseJoint.angle);
        baseJointMesh.mesh.rotation.x = THREE.MathUtils.degToRad(90);

        lowerArm.position.y = lowerArmMesh.height / 2;
        lowerArmMesh.mesh.scale.set(1, lowerArmMesh.height / lowerArmMesh.heightInit, 1);

        middleJoint.position.y = lowerArmMesh.height / 2;
        middleJointMesh.mesh.rotation.x = THREE.MathUtils.degToRad(90);
        middleJoint.rotation.z = THREE.MathUtils.degToRad(middleJoint.angle);

        upperArm.position.y = upperArmMesh.height / 2;
        upperArmMesh.mesh.scale.set(1, upperArmMesh.height / upperArmMesh.heightInit, 1);

        headJoint.position.y = upperArmMesh.height / 2;
        headJointMesh.mesh.rotation.x = THREE.MathUtils.degToRad(90);
        headJoint.rotation.z = THREE.MathUtils.degToRad(headJoint.angle);

        lampShade.position.x = headJoint.position.x + lampShadeMesh.height / 2;
        lampShadeMesh.mesh.rotation.z = THREE.MathUtils.degToRad(90);

        lightBulb.position.x = lampShade.position.x;
    }

    updateLuxo();

    {   // point light
        const color = 0xFFFFFF;
        const intensity = 0.5;
        const light = new THREE.PointLight(color, intensity);
        light.position.set(0, room.height, 0);
        scene.add(light);
        const helper = new THREE.PointLightHelper(light);
        scene.add(helper);
    }

    {   // an ambient light
        const light = new THREE.AmbientLight('white', 0.3);
        scene.add(light);
    }

    // lightBulb light
    const lightBulbLight = { color: 0xFFFFFF, intensity: 1.5, degree: 30, update: null, visible: true };
    {
        const light = new THREE.SpotLight(lightBulbLight.color, lightBulbLight.intensity);
        light.castShadow = true;
        light.position.set(0, 0, 0);
        light.target.position.set(1, 0, 0);
        lightBulb.add(light);
        lightBulb.add(light.target);

        const helper = new THREE.SpotLightHelper(light);
        scene.add(helper);
        lightBulbLight.update = function () {
            light.angle = THREE.MathUtils.degToRad(lightBulbLight.degree);
            light.target.updateMatrixWorld();
            helper.update();
            helper.visible = lightBulbLight.visible;
        }
        lightBulbLight.update();
    }

    {
        const gui = new GUI();
        let folder;

        folder = gui.addFolder('base (red box)');
        folder.add(base.position, 'x', -room.width / 2, room.width / 2, 1).name('x').onChange(updateLuxo);
        folder.add(base.position, 'z', -room.width / 2, room.width / 2, 1).name('z').onChange(updateLuxo);
        folder.add(baseMesh, 'height', 0.1, 2, 0.1).name('height').onChange(updateLuxo);
        folder.open();

        folder = gui.addFolder('arm(blue) lengths');
        folder.add(lowerArmMesh, 'height', 2, 7, 0.1).name('lower').onChange(updateLuxo);
        folder.add(upperArmMesh, 'height', 2, 7, 0.1).name('upper').onChange(updateLuxo);
        folder.open();

        gui.add(baseDisc, 'angle', 0, 360, 1).name('angle (yellow)').onChange(updateLuxo);

        folder = gui.addFolder('joint(green) angels');
        folder.add(baseJoint, 'angle', -180, 180, 1).name('base').onChange(updateLuxo);
        folder.add(middleJoint, 'angle', -180, 180, 1).name('middle').onChange(updateLuxo);
        folder.add(headJoint, 'angle', -180, 180, 1).name('head').onChange(updateLuxo);
        folder.open();

        folder = gui.addFolder('light bulb');
        folder.add(lightBulbLight, 'degree', 10, 90, 1).name('angle').onChange(lightBulbLight.update);
        folder.add(lightBulbLight, 'visible').name('show helper').listen().onFinishChange(lightBulbLight.update);
        folder.open();
    }

    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, room.height * 0.5, room.width * 1.4);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, room.height * 0.5, 0);
    controls.update();

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
main();