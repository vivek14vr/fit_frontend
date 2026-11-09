"use client";

import { useEffect, useRef } from "react";
import s from "../homepage.module.css";

export default function HeroAmbientScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      } catch {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 2;
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          time: { value: 0 },
          pointer: { value: new THREE.Vector2(0.62, 0.38) },
        },
        vertexShader: "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: "varying vec2 vUv; uniform float time; uniform vec2 pointer; void main(){float d=distance(vUv,pointer); float glow=1.0-smoothstep(0.0,0.48,d); float pulse=0.82+sin(time*0.55)*0.08; gl_FragColor=vec4(0.78,0.91,0.82,glow*0.22*pulse);}",
      });
      scene.add(new THREE.Mesh(geometry, material));
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      mount.appendChild(renderer.domElement);

      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let frame = 0;
      let visible = false;
      let previous = 0;
      const target = new THREE.Vector2(0.62, 0.38);

      const draw = (now: number) => {
        frame = 0;
        if (disposed) return;
        if (previous) material.uniforms.time.value += Math.min((now - previous) / 1000, 0.05);
        previous = now;
        material.uniforms.pointer.value.lerp(target, 0.04);
        renderer.render(scene, camera);
        if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw);
      };
      const sync = () => {
        cancelAnimationFrame(frame);
        previous = 0;
        frame = 0;
        if (visible && !document.hidden) draw(performance.now());
      };
      const move = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        target.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
      };
      const resize = new ResizeObserver(() => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        sync();
      });
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });

      resize.observe(mount);
      observer.observe(mount);
      mount.addEventListener("pointermove", move);
      document.addEventListener("visibilitychange", sync);
      motion.addEventListener("change", sync);

      cleanup = () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        observer.disconnect();
        mount.removeEventListener("pointermove", move);
        document.removeEventListener("visibilitychange", sync);
        motion.removeEventListener("change", sync);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => {});

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className={s.heroAmbientScene} aria-hidden="true" />;
}
