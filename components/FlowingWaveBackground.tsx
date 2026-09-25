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
    float amplitude = 0.55;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.02;
      amplitude *= 0.55;
    }
    return value;
  }

  void main() {
    vec3 colorA = vec3(0.051, 0.039, 0.031);
    vec3 colorB = vec3(0.639, 0.404, 0.173);
    vec3 colorC = vec3(0.122, 0.294, 0.275);

    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;

    float angle = 0.6;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 ruv = rot * uv;

    float t = uTime * 0.025;
    vec2 flow = vec2(t, t * 0.6);

    float h = fbm(ruv * 1.8 + flow);

    float eps = 0.015;
    float hx = fbm(ruv * 1.8 + vec2(eps, 0.0) + flow);
    float hy = fbm(ruv * 1.8 + vec2(0.0, eps) + flow);
    vec2 grad = vec2(hx - h, hy - h) / eps;
    float light = clamp(dot(normalize(vec3(-grad * 0.5, 1.0)), normalize(vec3(0.4, 0.6, 0.7))), -1.0, 1.0);
    light = light * 0.4 + 0.6;

    vec3 base = mix(colorA, colorB, smoothstep(0.15, 0.55, h));
    base = mix(base, colorC, smoothstep(0.45, 0.85, h));
    vec3 color = base * light;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function WavePlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
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

export default function FlowingWaveBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Canvas
        orthographic={false}
        camera={{ position: [0, 0, 1] }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <WavePlane />
      </Canvas>
      <div className="absolute inset-0 bg-zinc-950/10" />
    </div>
  );
}
