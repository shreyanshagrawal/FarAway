"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function FloatingBlob({ position, color, speed, distort, scale }: any) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.elapsedTime * speed * 0.2;
      ref.current.rotation.y = clock.elapsedTime * speed * 0.3;
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[scale, 64, 64]} position={position} ref={ref}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          distort={distort}
          speed={speed * 3}
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.15}
        />
      </Sphere>
    </Float>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-80">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 5, 2]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -2, 3]} intensity={1} color="#ff5500" />
        <pointLight position={[5, 2, -3]} intensity={1} color="#3b82f6" />

        <FloatingBlob position={[-4, 2, -2]} color="#ff5500" speed={0.4} distort={0.4} scale={2} />
        <FloatingBlob position={[4, -2, -1]} color="#3b82f6" speed={0.3} distort={0.3} scale={2.5} />
        <FloatingBlob position={[0, 0, -4]} color="#94a3b8" speed={0.2} distort={0.5} scale={3} />

        <Sparkles count={80} scale={15} size={2} speed={0.2} opacity={0.2} color="#475569" />
      </Canvas>
    </div>
  );
}
