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
        <ambientLight intensity={0.5} />
        
        {/* Add directional light to simulate sun */}
        <directionalLight position={[5, 3, 5]} intensity={1} />
        
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
  
  // Rotate the globe
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group ref={globeRef}>
      {/* Solid globe base */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial 
          color="#1a3f6f" 
          shininess={10}
          specular={new THREE.Color("#333333")}
        />
      </mesh>
      
      {/* Render country boundaries when data is loaded */}
      {countries && <CountryBoundaries geoJson={countries} radius={radius * 1.001} />}
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
    if (!feature.geometry) return;
    
    const geometry = feature.geometry;
    
    if (geometry.type === 'Polygon') {
      processPolygon(geometry.coordinates, lines, radius);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => {
        processPolygon(polygon, lines, radius);
      });
    } else if (geometry.type === 'LineString') {
      processLineString(geometry.coordinates, lines, radius);
    } else if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach(lineString => {
        processLineString(lineString, lines, radius);
      });
    } else if (geometry.type === 'Point') {
      // Could add point handling here if needed
    } else if (geometry.type === 'GeometryCollection' && geometry.geometries) {
      geometry.geometries.forEach(geom => {
        if (geom.type === 'Polygon') {
          processPolygon(geom.coordinates, lines, radius);
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(polygon => {
            processPolygon(polygon, lines, radius);
          });
        } else if (geom.type === 'LineString') {
          processLineString(geom.coordinates, lines, radius);
        } else if (geom.type === 'MultiLineString') {
          geom.coordinates.forEach(lineString => {
            processLineString(lineString, lines, radius);
          });
        }
      });
    }
  });
  
  return lines;
}

// Process a polygon to create lines
function processPolygon(polygon, lines, radius) {
  polygon.forEach(ring => {
    if (ring.length < 2) return;
    
    const points = [];
    
    ring.forEach(coord => {
      // Skip invalid coordinates
      if (!Array.isArray(coord) || coord.length < 2) return;
      
      const point = latLongToVector3(coord[1], coord[0], radius);
      points.push(point);
    });
    
    if (points.length < 2) return;
    
    // Create a line from the points
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x80FF80, 
      linewidth: 1
    });
    const line = new THREE.Line(geometry, material);
    
    lines.push(line);
  });
}

// Process a LineString to create a line
function processLineString(lineString, lines, radius) {
  if (lineString.length < 2) return;
  
  const points = [];
  
  lineString.forEach(coord => {
    // Skip invalid coordinates
    if (!Array.isArray(coord) || coord.length < 2) return;
    
    const point = latLongToVector3(coord[1], coord[0], radius);
    points.push(point);
  });
  
  if (points.length < 2) return;
  
  // Create a line from the points
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color: 0x80FF80, 
    linewidth: 1
  });
  const line = new THREE.Line(geometry, material);
  
  lines.push(line);
}

// Convert latitude and longitude to 3D Vector3
function latLongToVector3(lat, lon, radius) {
  // Convert latitude and longitude to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  // Calculate position on globe
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

export default App;