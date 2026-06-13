"use client";
import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Box, Sphere, Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ProductManagementCore() {
  const groupRef = useRef<THREE.Group>(null!);
  const inputsRef = useRef<THREE.Mesh[]>([]);
  const outputsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    // ScrollTrigger to rotate and assemble the scene
    ScrollTrigger.create({
      trigger: "#hero-section",
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        if (groupRef.current) {
          groupRef.current.rotation.y = self.progress * Math.PI * 1.5;
          groupRef.current.position.y = -self.progress * 5;
        }
      }
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.05 + 0.1;
      groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.05;
    }

    // Input chaos (Spheres representing raw feedback) flying into the center AI document
    inputsRef.current.forEach((mesh, i) => {
      if (mesh) {
        // Move from left (-4) to center (0)
        const progress = (t * 0.5 + i * 0.15) % 1;
        mesh.position.x = -4 + progress * 4;
        
        // Swirl and converge into the center
        mesh.position.y = Math.sin(t * 2 + i) * (1 - progress) * 1.5;
        mesh.position.z = Math.cos(t * 2 + i) * (1 - progress) * 1.5;
        
        // Fade out as they get absorbed by the AI core
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 1 - Math.pow(progress, 3);
      }
    });

    // Output order (Tickets representing Linear tasks) flying out from the AI document
    outputsRef.current.forEach((mesh, i) => {
      if (mesh) {
        // Move from center (0) to right (4)
        const progress = (t * 0.3 + i * 0.2) % 1;
        mesh.position.x = progress * 4;
        
        // Form an organized grid/stack as they leave
        mesh.position.y = (i % 3 - 1) * 0.8 * progress;
        mesh.position.z = 0.5;
        
        // Fade in as they are generated
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.pow(progress, 0.5);
      }
    });
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={1.2}>
        
        {/* Central AI Engine: The PRD / Spec Document */}
        <Box args={[1.5, 2.4, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.9} roughness={0.1} metalness={0.2} />
        </Box>
        {/* Glowing Orange Core representing the Intelligence */}
        <Box args={[1.2, 1.8, 0.15]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ff5500" emissive="#ff5500" emissiveIntensity={0.8} transparent opacity={0.8} />
        </Box>

        {/* Unstructured Inputs (Ideas, Feedback, Bugs) */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`input-${i}`} ref={(el) => { if (el) inputsRef.current[i] = el; }}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#3b82f6" : "#8b5cf6"} transparent opacity={1} roughness={0.2} emissive={i % 2 === 0 ? "#3b82f6" : "#8b5cf6"} emissiveIntensity={0.5} />
          </mesh>
        ))}

        {/* Structured Outputs (Linear Tickets / Tasks) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`output-${i}`} ref={(el) => { if (el) outputsRef.current[i] = el; }}>
            <boxGeometry args={[0.8, 0.25, 0.05]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#ff5500" : i % 3 === 1 ? "#111111" : "#10b981"} transparent opacity={1} roughness={0.1} metalness={0.1} />
          </mesh>
        ))}

      </group>
    </Float>
  );
}

function AmbientDust() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Sparkles count={200} scale={15} size={2} speed={0.2} opacity={0.2} color="#000000" />
      <Sparkles count={50} scale={10} size={3} speed={0.5} opacity={0.5} color="#ff5500" />
    </group>
  );
}

export default function CinematicScene() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={2} color="#ffffff" castShadow />
        <directionalLight position={[-5, -10, -5]} intensity={0.5} color="#dddddd" />
        
        <ProductManagementCore />
        <AmbientDust />
      </Canvas>
    </div>
  );
}
