"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const BERRY = "#c8324a";
const GOLD = "#e6a64a";
const FROST = "#eef3f7";
const RADIUS = 1.15;

/** Deterministic PRNG so snow layout is stable and render stays pure. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Frame deltas are clamped so a paused/off-screen canvas doesn't jump on resume. */
const step = (delta: number) => Math.min(delta, 1 / 20);

function Ornament() {
  const swing = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (swing.current) swing.current.rotation.z = Math.sin(t * 0.7) * 0.05;
    if (spin.current) spin.current.rotation.y += step(delta) * 0.3;
  });

  const bandLatitudes = [0, 0.42, -0.42];

  return (
    // Pivot at the top of the string so the ornament swings like it's hanging.
    <group ref={swing} position={[0, 2.6, 0]}>
      <group ref={spin} position={[0, -2.85, 0]}>
        <mesh>
          <sphereGeometry args={[RADIUS, 64, 48]} />
          <meshPhysicalMaterial
            color={BERRY}
            metalness={0.75}
            roughness={0.32}
            clearcoat={0.35}
            clearcoatRoughness={0.15}
            envMapIntensity={0.7}
          />
        </mesh>

        {bandLatitudes.map((lat) => (
          <mesh key={lat} position={[0, Math.sin(lat) * RADIUS, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry
              args={[Math.cos(lat) * RADIUS + 0.004, lat === 0 ? 0.035 : 0.016, 12, 96]}
            />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
          </mesh>
        ))}

        {/* Cap and hanging loop */}
        <mesh position={[0, RADIUS + 0.08, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.26, 24]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.32} />
        </mesh>
        <mesh position={[0, RADIUS + 0.3, 0]}>
          <torusGeometry args={[0.11, 0.022, 10, 32]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* String */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 1.6, 6]} />
        <meshBasicMaterial color={FROST} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function makeFlakeTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

const SNOW_BOX = { w: 7, h: 5, d: 4 };

function Snow({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);

  const { positions, speeds, phases } = useMemo(() => {
    const rand = mulberry32(1225);
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * SNOW_BOX.w;
      positions[i * 3 + 1] = (rand() - 0.5) * SNOW_BOX.h;
      positions[i * 3 + 2] = (rand() - 0.5) * SNOW_BOX.d;
      speeds[i] = 0.18 + rand() * 0.32;
      phases[i] = rand() * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, [count]);

  const texture = useMemo(() => makeFlakeTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state, delta) => {
    const geometry = points.current?.geometry;
    if (!geometry) return;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const dt = step(delta);
    const t = state.clock.elapsedTime;
    const bottom = -SNOW_BOX.h / 2;
    for (let i = 0; i < count; i++) {
      const y = i * 3 + 1;
      arr[y] -= speeds[i] * dt;
      arr[i * 3] += Math.sin(t * 0.6 + phases[i]) * 0.08 * dt;
      if (arr[y] < bottom) arr[y] += SNOW_BOX.h;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        map={texture}
        color={FROST}
        transparent
        opacity={0.9}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#fff1dc" />
      <pointLight position={[-3, -1, 2]} intensity={6} color="#f2a541" />
      <StudioEnvironment />
    </>
  );
}

/**
 * Baked once: three's procedural RoomEnvironment gives the lacquer and gold
 * their reflections without loading an HDR file or drei's loader stack.
 */
function StudioEnvironment() {
  const gl = useThree((state) => state.gl);

  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => envMap.dispose(), [envMap]);

  // Attaches to the parent scene as scene.environment.
  return <primitive object={envMap} attach="environment" />;
}

class SceneErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type OrnamentSceneProps = { paused: boolean; onReady: () => void; onError: () => void };

export default function OrnamentScene({ paused, onReady, onError }: OrnamentSceneProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [dpr, setDpr] = useState<number | [number, number]>([1, 1.5]);
  const [lowPower, setLowPower] = useState(false);

  // Stop rendering entirely when the hero scrolls out of view.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0">
      <SceneErrorBoundary onError={onError}>
        <Canvas
          dpr={dpr}
          frameloop={onScreen && !paused ? "always" : "never"}
          camera={{ position: [0, 0, 5.4], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", onError, { once: true });
            // Wait one frame so the first visible frame is fully lit before fading in.
            requestAnimationFrame(onReady);
          }}
          fallback={null}
        >
          <PerformanceMonitor
            flipflops={3}
            onDecline={() => {
              setDpr(1);
              setLowPower(true);
            }}
            onFallback={() => {
              setDpr(1);
              setLowPower(true);
            }}
          />
          <Lights />
          <Ornament />
          <Snow count={lowPower ? 250 : 700} />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
