import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function Sphere() {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.set(0, 1, 10); // Move camera farther away (was likely closer, e.g., z=5)
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // For high-DPI displays
    mountRef.current.appendChild(renderer.domElement);

    // Wireframe sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32); // Radius: 1
    const material = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xffffff // White lines
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    camera.lookAt(sphere.position); // Ensure camera points at sphere (0,0,0)

    // Add orbital controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0); // Target the sphere’s center
    controls.enableDamping = true; // Smooth movement (optional)
    controls.dampingFactor = 0.05; // Damping factor (optional)

    // Starry background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starsPositions = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsPositions.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update controls each frame
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.remove(sphere);
      scene.remove(stars);
      geometry.dispose();
      material.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      controls.dispose(); // Clean up controls
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
}

export default Sphere;