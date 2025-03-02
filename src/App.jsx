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
        
        {/* Globe with geographic features */}
        <Globe />
        
        {/* Camera Controls */}
        <OrbitControls 
          enableZoom={true} 
          zoomSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.3}
          enableDamping 
          dampingFactor={0.05} 
        />
      </Canvas>
    </div>
  );
};

// Globe component that loads and renders countries
const Globe = () => {
  const globeRef = useRef();
  const radius = 2;
  
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
          color="#0A1D35" 
          shininess={10}
          specular={new THREE.Color("#333333")}
        />
      </mesh>
      
      {/* Layer: Countries */}
      <GeoJsonLayer 
        url="./countries.json" 
        radius={radius * 1.001} 
        color={0x80FF80} 
        linewidth={1} 
      />
      
      {/* Layer: States/Provinces */}
      {/* <GeoJsonLayer 
        url="./countries_states.geojson" 
        radius={radius * 1.002} 
        color={0x60BF60} 
        linewidth={0.5} 
      /> */}
      
      {/* Layer: Rivers */}
      {/* <GeoJsonLayer 
        url="./rivers.geojson" 
        radius={radius * 1.003} 
        color={0x4080FF} 
        linewidth={1} 
      /> */}
      
      {/* Layer: Highways */}
      {/* <GeoJsonLayer 
        url="./world_highways.geojson" 
        radius={radius * 1.004} 
        color={0xFF8040} 
        linewidth={0.5} 
      /> */}
      
      {/* Layer: Population Places */}
      {/* <GeoJsonLayer 
        url="./pop_places.geojson" 
        radius={radius * 1.005} 
        color={0xFFFF00} 
        linewidth={1}
        isPoints={true}
      /> */}
    </group>
  );
};

// Component to render a GeoJSON layer
const GeoJsonLayer = ({ url, radius, color, linewidth, isPoints = false }) => {
  const [geoData, setGeoData] = useState(null);
  const layerRef = useRef();
  
  // Load GeoJSON data
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error(`Error loading data from ${url}:`, error);
      }
    };
    
    loadGeoJson();
  }, [url]);
  
  // Process and render GeoJSON data
  useEffect(() => {
    if (!geoData || !layerRef.current) return;
    
    // Clear any existing children
    while (layerRef.current.children.length > 0) {
      layerRef.current.remove(layerRef.current.children[0]);
    }
    
    // Convert GeoJSON to Three.js objects
    const objects = isPoints 
      ? createPointObjects(geoData, radius, color) 
      : createLineObjects(geoData, radius, color, linewidth);
      
    objects.forEach(obj => {
      layerRef.current.add(obj);
    });
  }, [geoData, radius, color, linewidth, isPoints]);
  
  return <group ref={layerRef} />;
};

// Function to convert GeoJSON to Three.js lines
function createLineObjects(geoJson, radius, color, linewidth) {
  const lines = [];
  const material = new THREE.LineBasicMaterial({ 
    color: color, 
    linewidth: linewidth 
  });
  
  // Process each feature in the GeoJSON
  if (geoJson.features) {
    geoJson.features.forEach(feature => {
      if (!feature.geometry) return;
      
      const geometry = feature.geometry;
      
      if (geometry.type === 'Polygon') {
        processPolygon(geometry.coordinates, lines, radius, material);
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygon => {
          processPolygon(polygon, lines, radius, material);
        });
      } else if (geometry.type === 'LineString') {
        processLineString(geometry.coordinates, lines, radius, material);
      } else if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach(lineString => {
          processLineString(lineString, lines, radius, material);
        });
      } else if (geometry.type === 'GeometryCollection' && geometry.geometries) {
        geometry.geometries.forEach(geom => {
          if (geom.type === 'Polygon') {
            processPolygon(geom.coordinates, lines, radius, material);
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(polygon => {
              processPolygon(polygon, lines, radius, material);
            });
          } else if (geom.type === 'LineString') {
            processLineString(geom.coordinates, lines, radius, material);
          } else if (geom.type === 'MultiLineString') {
            geom.coordinates.forEach(lineString => {
              processLineString(lineString, lines, radius, material);
            });
          }
        });
      }
    });
  }
  
  return lines;
}

// Function to create point objects for places
function createPointObjects(geoJson, radius, color) {
  const points = [];
  const pointSize = 0.02; // Size of point markers
  
  if (!geoJson.features) return points;
  
  geoJson.features.forEach(feature => {
    if (!feature.geometry || feature.geometry.type !== 'Point') return;
    
    const coord = feature.geometry.coordinates;
    if (!Array.isArray(coord) || coord.length < 2) return;
    
    const position = latLongToVector3(coord[1], coord[0], radius);
    
    // Create a small sphere for each point
    const geometry = new THREE.SphereGeometry(pointSize, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    
    points.push(sphere);
  });
  
  return points;
}

// Process a polygon to create lines
function processPolygon(polygon, lines, radius, material) {
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
    const line = new THREE.Line(geometry, material);
    
    lines.push(line);
  });
}

// Process a LineString to create a line
function processLineString(lineString, lines, radius, material) {
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