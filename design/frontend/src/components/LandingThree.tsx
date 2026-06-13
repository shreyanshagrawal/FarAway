"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Float, Stars, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function AuraCore() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.1;
      ref.current.rotation.z = clock.elapsedTime * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1}>
      <Sphere args={[2.2, 128, 128]} ref={ref}>
        <MeshDistortMaterial
          color="#a855f7"
          emissive="#2d054d"
          emissiveIntensity={0.5}
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
    </Float>
  );
}

function FloatingRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null!);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(clock.elapsedTime * speed * 0.5) * 0.5;
      ref.current.rotation.y = clock.elapsedTime * speed;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export default function DarkThreeBackground() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <fog attach="fog" args={['#05010d', 5, 15]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={2} color="#a855f7" />
        <pointLight position={[-5, -5, -5]} intensity={2} color="#14b8a6" />
        
        <AuraCore />
        
        <FloatingRing radius={3.2} speed={0.2} color="#a855f7" />
        <FloatingRing radius={4.5} speed={-0.15} color="#14b8a6" />
        <FloatingRing radius={5.8} speed={0.1} color="#3b82f6" />

        <Stars radius={10} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={150} scale={10} size={4} speed={0.4} opacity={0.6} color="#a855f7" />
      </Canvas>
    </div>
  );
}
