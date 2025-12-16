'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { useRef } from 'react';

function Rig() {
    useFrame((state) => {
        // Hafif kamera salınımı
        state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
        state.camera.position.y = Math.cos(state.clock.elapsedTime * 0.08) * 0.3;
    });
    return null;
}

export default function StarField() {
    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <Canvas camera={{ position: [0, 0, 1], fov: 75 }}>
                <Rig />
                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade
                    speed={1}
                />
                <Sparkles
                    count={200}
                    scale={10}
                    size={2}
                    speed={0.4}
                    opacity={0.5}
                    color="#00F0FF"
                />
                <Sparkles
                    count={100}
                    scale={8}
                    size={1.5}
                    speed={0.3}
                    opacity={0.3}
                    color="#FF0055"
                />
                <fog attach="fog" args={['#000000', 5, 15]} />
            </Canvas>
            {/* Vignette Efekti */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none" />
        </div>
    );
}
