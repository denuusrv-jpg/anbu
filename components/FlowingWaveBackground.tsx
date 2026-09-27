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
    float amplitude = 0.6;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 1.95;
      amplitude *= 0.52;
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

    /* Domain warp: die UV-Koordinaten werden zuerst durch ein eigenes
       Rausch-Feld verzerrt, bevor das Endmuster daraus berechnet wird.
       Dadurch entstehen organische, wirbelnde Formen statt eines
       einzelnen driftenden Blobs. */
    vec2 warp = vec2(
      fbm(ruv * 0.8 + flow * 0.6),
      fbm(ruv * 0.8 + flow * 0.6 + vec2(5.2, 1.3))
    );
    vec2 warpedUv = ruv * 0.9 + warp * 0.7 + flow;

    float h = fbm(warpedUv);

    float eps = 0.03;
    float hx = fbm(warpedUv + vec2(eps, 0.0));
    float hy = fbm(warpedUv + vec2(0.0, eps));
    vec2 grad = vec2(hx - h, hy - h) / eps;
    float light = clamp(dot(normalize(vec3(-grad * 0.3, 1.0)), normalize(vec3(0.3, 0.5, 0.8))), -1.0, 1.0);
    light = light * 0.2 + 0.85;

    vec3 base = mix(colorA, colorB, smoothstep(0.0, 0.4, h));
    base = mix(base, colorC, smoothstep(0.35, 0.7, h));
    base = mix(base, colorD, smoothstep(0.65, 1.0, h));
    vec3 color = base * light;

    /* Feines Funkeln - kleine, langsam pulsierende Lichtpunkte für
       einen edleren, weniger flachen Eindruck. */
    vec2 starUv = uv * 9.0;
    vec2 starId = floor(starUv);
    vec2 starF = fract(starUv) - 0.5;
    float starHash = hash(starId);
    float starMask = step(0.94, starHash);
    float twinkle = 0.5 + 0.5 * sin(uTime * 1.6 + starHash * 62.0);
    float starDist = length(starF);
    float star = smoothstep(0.18, 0.0, starDist) * starMask * twinkle;
    color += vec3(1.0, 0.95, 0.85) * star * 0.5;

    /* Dezente Vignette für mehr Tiefe und Fokus zur Mitte hin. */
    float vignette = smoothstep(1.15, 0.25, length(vUv - 0.5));
    color *= mix(0.78, 1.0, vignette);

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
