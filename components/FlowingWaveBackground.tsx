"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uPulses;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.65;
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p);
      p *= 1.8;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 colorA = vec3(0.420, 0.118, 0.455);
    vec3 colorB = vec3(0.882, 0.114, 0.247);
    vec3 colorC = vec3(0.949, 0.439, 0.102);
    vec3 colorD = vec3(0.961, 0.773, 0.094);

    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;

    float angle = 0.5;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 ruv = rot * uv;

    float t = uTime * 0.032;
    vec2 flow = vec2(t, t * 0.5);

    float h = fbm(ruv * 0.9 + flow);

    float eps = 0.03;
    float hx = fbm(ruv * 0.9 + vec2(eps, 0.0) + flow);
    float hy = fbm(ruv * 0.9 + vec2(0.0, eps) + flow);
    vec2 grad = vec2(hx - h, hy - h) / eps;
    float light = clamp(dot(normalize(vec3(-grad * 0.3, 1.0)), normalize(vec3(0.3, 0.5, 0.8))), -1.0, 1.0);
    light = light * 0.2 + 0.85;

    vec3 base = mix(colorA, colorB, smoothstep(0.0, 0.4, h));
    base = mix(base, colorC, smoothstep(0.35, 0.7, h));
    base = mix(base, colorD, smoothstep(0.65, 1.0, h));
    vec3 color = base * light;

    /* Dezente "Landkarten"-Impulse: ein paar feste Punkte pulsieren
       wie aktive Verbindungen in verschiedenen Regionen - manche
       stärker (mehr Menschen), manche schwächer. Passend zum
       Vernetzungs-Thema der Seite. */
    float signal = 0.0;
    for (int i = 0; i < 6; i++) {
      vec2 seed = vec2(float(i) * 13.7 + 4.1, float(i) * 7.3 + 1.9);
      vec2 pos = vec2(hash(seed), hash(seed + 3.1));
      pos.x *= uResolution.x / uResolution.y;
      float strength = 0.3 + 0.7 * hash(seed + 9.4);
      float phase = hash(seed + 5.9) * 6.2831;
      float speed = 0.6 + 0.5 * hash(seed + 1.7);

      float dist = length(uv - pos);

      float cycle = fract(uTime * 0.1 * speed + phase / 6.2831);
      float ringRadius = cycle * 0.2;
      float ring = smoothstep(0.018, 0.0, abs(dist - ringRadius)) * (1.0 - cycle);
      float dot = smoothstep(0.012, 0.0, dist) * (0.55 + 0.45 * sin(uTime * 1.6 + phase));

      signal += (ring * 0.45 + dot) * strength;
    }
    color += vec3(1.0, 0.9, 0.7) * signal * 0.35 * uPulses;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function WavePlane({ pulses }: { pulses: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPulses: { value: pulses ? 1 : 0 },
    }),
    [pulses],
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uResolution.value.set(
      viewport.width,
      viewport.height,
    );
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

// pulses=false: derselbe Hintergrund ohne die pulsierenden Verbindungs-Impulse (z. B. hinter dem Chat)
export default function FlowingWaveBackground({ pulses = true }: { pulses?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Canvas
        orthographic={false}
        camera={{ position: [0, 0, 1] }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <WavePlane pulses={pulses} />
      </Canvas>
      <div className="absolute inset-0 bg-zinc-950/10" />
    </div>
  );
}
