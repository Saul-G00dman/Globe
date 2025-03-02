import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

// Main App component
const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#000"]} />
        
        {/* Sparse starry background */}
        <Stars 
          radius={100} 
          depth={50} 
          count={1000} 
          factor={4} 
          saturation={0} 
          fade 
        />
        
        {/* Add ambient light for basic illumination */}
        <ambientLight intensity={0.2} />
        
        {/* Add directional light to simulate sun */}
        <directionalLight position={[5, 3, 5]} intensity={0.5} />
        
        {/* Globe with countries */}
        <Globe />
        
        {/* Camera Controls */}
        <OrbitControls 
          enableZoom={true} 
          zoomSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.5}
          enableDamping 
          dampingFactor={0.05} 
        />
      </Canvas>
    </div>
  );
};

// Globe component that loads and renders countries
const Globe = () => {
  const [countries, setCountries] = useState(null);
  const globeRef = useRef();
  const radius = 2;
  
  // Load countries GeoJSON
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('./countries.json');
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error("Error loading countries data:", error);
      }
    };
    
    loadCountries();
  }, []);
  
  // Render basic wireframe globe while data loads
  const globeGeometry = new THREE.SphereGeometry(radius, 32, 32);
  
  // Rotate the globe
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group ref={globeRef}>
      {/* Basic wireframe globe */}
      <lineSegments>
        <edgesGeometry attach="geometry" args={[globeGeometry]} />
        <lineBasicMaterial attach="material" color="#1a3f6f" opacity={0.3} transparent />
      </lineSegments>
      
      {/* Solid globe with slight transparency */}
      <mesh>
        <sphereGeometry args={[radius * 0.99, 32, 32]} />
        <meshPhongMaterial color="#0c2c55" transparent opacity={0.4} />
      </mesh>
      
      {/* Render country boundaries when data is loaded */}
      {countries && <CountryBoundaries geoJson={countries} radius={radius} />}
    </group>
  );
};

// Component to render country boundaries
const CountryBoundaries = ({ geoJson, radius }) => {
  const boundariesRef = useRef();
  
  useEffect(() => {
    if (!geoJson || !boundariesRef.current) return;
    
    // Clear any existing children
    while (boundariesRef.current.children.length > 0) {
      boundariesRef.current.remove(boundariesRef.current.children[0]);
    }
    
    // Convert GeoJSON to Three.js objects
    const countryLines = createCountryLines(geoJson, radius);
    countryLines.forEach(line => {
      boundariesRef.current.add(line);
    });
  }, [geoJson, radius]);
  
  return <group ref={boundariesRef} />;
};

// Function to convert GeoJSON to Three.js lines
function createCountryLines(geoJson, radius) {
  const lines = [];
  
  // Process each feature in the GeoJSON
  geoJson.features.forEach(feature => {
    const geometry = feature.geometry;
    
    if (geometry.type === 'Polygon') {
      processPolygon(geometry.coordinates, lines, radius);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => {
        processPolygon(polygon, lines, radius);
      });
    }
  });
  
  return lines;
}

// Process a polygon to create lines
function processPolygon(polygon, lines, radius) {
  polygon.forEach(ring => {
    const points = [];
    
    ring.forEach(coord => {
      // Convert lat/long to 3D coordinates
      const phi = (90 - coord[1]) * (Math.PI / 180);
      const theta = (coord[0] + 180) * (Math.PI / 180);
      
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      points.push(new THREE.Vector3(x, y, z));
    });
    
    // Create a line from the points
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x80FF80, linewidth: 1 });
    const line = new THREE.Line(geometry, material);
    
    lines.push(line);
  });
}

export default App;