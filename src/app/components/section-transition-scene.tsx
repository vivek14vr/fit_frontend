"use client";

import { useEffect, useRef } from "react";
import s from "../homepage.module.css";

const sectionPalette = [
  "#317a70",
  "#c9922e",
  "#78a393",
  "#aa7938",
  "#164b47",
  "#123e3b",
  "#6d897b",
  "#397e70",
  "#b58a52",
  "#164b47",
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const damp = (current: number, target: number, strength: number, delta: number) => (
  current + (target - current) * (1 - Math.exp(-strength * delta))
);

export default function SectionTransitionScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;

      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const mobile = window.matchMedia("(max-width: 700px)");
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

      if (motion.matches || connection?.saveData) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      } catch {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 2;

      const colors = sectionPalette.map(color => new THREE.Color(color));
      const uniforms = {
        time: { value: 0 },
        scroll: { value: 0 },
        blend: { value: 0 },
        energy: { value: 0 },
        boundary: { value: -1 },
        colorA: { value: colors[0].clone() },
        colorB: { value: colors[1].clone() },
      };

      const fieldGeometry = new THREE.PlaneGeometry(2, 2);
      const fieldMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms,
        vertexShader: "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: `
          varying vec2 vUv;
          uniform float time;
          uniform float scroll;
          uniform float blend;
          uniform float energy;
          uniform float boundary;
          uniform vec3 colorA;
          uniform vec3 colorB;

          void main() {
            vec2 p = vUv - 0.5;
            p.x *= 0.86;
            float radius = length(p);
            float angle = atan(p.y, p.x);
            float wave = 0.5 + 0.5 * sin(angle * 6.0 - time * 0.24 + scroll * 14.0);
            float orbit = exp(-length(p - vec2(sin(scroll * 8.0 + time * 0.08) * 0.16, cos(scroll * 5.0) * 0.1)) * 7.0);
            float ripple = 1.0 - smoothstep(0.012, 0.052, abs(radius - (0.34 + 0.024 * sin(time * 0.18 + scroll * 10.0))));
            float edge = smoothstep(0.14, 0.72, radius);
            vec3 color = mix(colorA, colorB, clamp(blend * 0.78 + wave * 0.14, 0.0, 1.0));
            float fold = boundary + sin(vUv.x * 5.0 + scroll * 9.0) * 0.055;
            float ribbon = exp(-pow((vUv.y - fold) * 15.0, 2.0));
            float edgeLight = smoothstep(0.12, 0.5, abs(vUv.x - 0.5));
            float alpha = (ripple * 0.07 + orbit * 0.055 + wave * 0.008) * edge * energy
              + ribbon * (0.035 + edgeLight * 0.22) * energy;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      });
      scene.add(new THREE.Mesh(fieldGeometry, fieldMaterial));

      const flower = new THREE.Group();
      flower.position.set(mobile.matches ? 0.5 : 0.63, mobile.matches ? -0.1 : 0.03, 0.15);

      const petalShape = new THREE.Shape();
      petalShape.moveTo(0, 0);
      petalShape.bezierCurveTo(0.12, 0.04, 0.18, 0.15, 0, 0.3);
      petalShape.bezierCurveTo(-0.18, 0.15, -0.12, 0.04, 0, 0);
      const petalGeometry = new THREE.ShapeGeometry(petalShape);
      const petalMaterial = new THREE.MeshBasicMaterial({
        color: colors[0],
        transparent: true,
        opacity: mobile.matches ? 0.045 : 0.06,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const petalCount = mobile.matches ? 9 : 12;

      for (let index = 0; index < petalCount; index += 1) {
        const angle = (index / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0);
        petal.rotation.z = angle - Math.PI / 2;
        petal.scale.setScalar(mobile.matches ? 0.72 : 0.9);
        flower.add(petal);
      }

      const ringPoints = Array.from({ length: 49 }, (_, index) => {
        const angle = (index / 48) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * 0.39, Math.sin(angle) * 0.39, 0.02);
      });
      const ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringMaterial = new THREE.LineBasicMaterial({
        color: colors[0],
        transparent: true,
        opacity: mobile.matches ? 0.06 : 0.085,
        depthWrite: false,
      });
      flower.add(new THREE.LineLoop(ringGeometry, ringMaterial));
      const flowerColor = colors[0].clone();

      const logoGeometry = new THREE.PlaneGeometry(0.24, 0.24);
      const logoTexture = new THREE.TextureLoader().load("/deepa-chakra.svg");
      const logoMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        opacity: mobile.matches ? 0.12 : 0.16,
        depthWrite: false,
      });
      const logo = new THREE.Mesh(logoGeometry, logoMaterial);
      logo.position.z = 0.04;
      flower.add(logo);
      scene.add(flower);
      // Keep the brand flower in its interactive section; this layer only joins sections.
      flower.visible = false;

      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile.matches ? 1.1 : 1.35));
      renderer.setClearColor(0, 0);
      mount.appendChild(renderer.domElement);

      let sectionTops: number[] = [];
      let activeIndex = 0;
      let targetScroll = 0;
      let targetBlend = 0;
      let targetEnergy = 0;
      let targetBoundary = -1;
      let previousScroll = window.scrollY;
      let frame = 0;
      let previousTime = 0;

      const readScroll = () => {
        const scrollY = window.scrollY;
        targetEnergy = Math.max(targetEnergy, clamp(Math.abs(scrollY - previousScroll) / 120));
        previousScroll = scrollY;

        const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
        targetScroll = pageHeight > 0 ? clamp(scrollY / pageHeight) : 0;
        if (!sectionTops.length) return;

        const anchor = scrollY + window.innerHeight * 0.44;
        const nearest = sectionTops.slice(1).reduce((best, top) => Math.abs(top - anchor) < Math.abs(best - anchor) ? top : best, Infinity);
        targetBoundary = Number.isFinite(nearest) ? 1 - (nearest - scrollY) / window.innerHeight : -1;
        let nextIndex = 0;
        sectionTops.forEach((top, index) => {
          if (anchor >= top) nextIndex = index;
        });
        activeIndex = nextIndex;

        const start = sectionTops[nextIndex] ?? 0;
        const end = sectionTops[nextIndex + 1] ?? start + window.innerHeight;
        targetBlend = clamp((anchor - start) / Math.max(end - start, 1));
      };

      const refreshSections = () => {
        sectionTops = Array.from(document.querySelectorAll<HTMLElement>("[data-transition-section], .public-page section, .marketing-programme-detail section"))
          .map(section => section.getBoundingClientRect().top + window.scrollY);
        readScroll();
      };

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
      };

      const draw = (now: number) => {
        frame = 0;
        if (disposed || document.hidden || motion.matches) return;

        const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
        previousTime = now;
        uniforms.time.value += delta;
        uniforms.scroll.value = damp(uniforms.scroll.value, targetScroll, 7, delta);
        uniforms.blend.value = damp(uniforms.blend.value, targetBlend, 8, delta);
        uniforms.energy.value = damp(uniforms.energy.value, targetEnergy, 9, delta);
        uniforms.boundary.value = damp(uniforms.boundary.value, targetBoundary, 10, delta);
        targetEnergy = damp(targetEnergy, 0, 5, delta);

        const nextIndex = Math.min(activeIndex + 1, colors.length - 1);
        uniforms.colorA.value.lerp(colors[activeIndex % colors.length], 1 - Math.exp(-8 * delta));
        uniforms.colorB.value.lerp(colors[nextIndex], 1 - Math.exp(-8 * delta));

        flowerColor.copy(colors[activeIndex % colors.length]).lerp(colors[nextIndex], uniforms.blend.value);
        petalMaterial.color.lerp(flowerColor, 1 - Math.exp(-7 * delta));
        ringMaterial.color.lerp(flowerColor, 1 - Math.exp(-7 * delta));
        logoMaterial.opacity = (mobile.matches ? 0.12 : 0.16) + uniforms.energy.value * 0.035;
        flower.rotation.z = uniforms.scroll.value * Math.PI * 2 + uniforms.time.value * 0.12;
        flower.scale.setScalar((mobile.matches ? 0.72 : 0.94) + uniforms.energy.value * 0.06);
        renderer.render(scene, camera);
        if (uniforms.energy.value > .001 || Math.abs(uniforms.scroll.value - targetScroll) > .0001) frame = requestAnimationFrame(draw);
      };

      const sync = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        if (!document.hidden && !motion.matches) frame = requestAnimationFrame(draw);
      };
      const scroll = () => {
        readScroll();
        if (!frame && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw);
      };
      const handleMotion = () => {
        mount.style.visibility = motion.matches ? "hidden" : "visible";
        sync();
      };
      const resizeObserver = new ResizeObserver(() => {
        resize();
        refreshSections();
      });

      resize();
      refreshSections();
      resizeObserver.observe(mount);
      resizeObserver.observe(document.documentElement);
      window.addEventListener("scroll", scroll, { passive: true });
      window.addEventListener("resize", resize);
      window.addEventListener("resize", refreshSections);
      window.addEventListener("load", refreshSections, { once: true });
      document.addEventListener("visibilitychange", sync);
      motion.addEventListener("change", handleMotion);
      mount.style.visibility = "visible";
      sync();

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        window.removeEventListener("scroll", scroll);
        window.removeEventListener("resize", resize);
        window.removeEventListener("resize", refreshSections);
        window.removeEventListener("load", refreshSections);
        document.removeEventListener("visibilitychange", sync);
        motion.removeEventListener("change", handleMotion);
        fieldGeometry.dispose();
        fieldMaterial.dispose();
        petalGeometry.dispose();
        petalMaterial.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        logoGeometry.dispose();
        logoMaterial.dispose();
        logoTexture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => {});

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className={s.sectionTransitionScene} aria-hidden="true" />;
}
