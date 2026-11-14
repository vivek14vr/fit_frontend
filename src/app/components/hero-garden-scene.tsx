"use client";

import { useEffect, useRef } from "react";
import { gardenStories } from "./hero-garden-data";

/** The semantic HTML photograph stays visible until the WebGL texture is ready. */
export default function HeroGardenScene({ active, paused }: { active: number; paused: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const settings = useRef({ active, paused });
  const wakeRef = useRef<() => void>(() => {});
  useEffect(() => { settings.current = { active, paused }; wakeRef.current(); }, [active, paused]);

  useEffect(() => {
    const mount = mountRef.current;
    const picture = mount?.parentElement;
    const garden = mount?.closest<HTMLElement>("[data-hero-garden]");
    if (!mount || !picture || !garden) return;
    let disposed = false;
    let cleanup = () => {};
    void import("three").then(THREE => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
      mount.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
      camera.position.z = 2;
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          imageA: { value: null }, imageB: { value: null },
          coverA: { value: new THREE.Vector2(1, 1) }, coverB: { value: new THREE.Vector2(1, 1) },
          time: { value: 0 }, progress: { value: 1 },
        },
        vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D imageA, imageB;
          uniform vec2 coverA, coverB;
          uniform float time, progress;
          void main(){
            // Uniform camera-like zoom: straight edges and food shapes stay intact.
            // Time freezes on pause, so pausing never changes the current crop.
            float framing=.99-(1.-cos(time*.16))*.005;
            vec2 uv=(vUv-.5)*framing+.5;
            vec4 a=texture2D(imageA,clamp((uv-.5)*coverA+.5,.001,.999));
            vec4 b=texture2D(imageB,clamp((uv-.5)*coverB+.5,.001,.999));
            gl_FragColor=mix(a,b,smoothstep(0.,1.,progress));
            #include <colorspace_fragment>
          }`,
      });
      scene.add(new THREE.Mesh(geometry, material));
      const textures = new Map<number, InstanceType<typeof THREE.Texture>>();
      const failed = new Set<number>();
      const loader = new THREE.TextureLoader();
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      let frame = 0, previous = 0, visible = true, contextLost = false;
      let current = -1, incoming = -1, pending = -1;
      const cover = (index: number, out: InstanceType<typeof THREE.Vector2>) => {
        const image = textures.get(index)?.image as HTMLImageElement | undefined;
        if (!image) return;
        const ratio = (image.width / image.height) / (mount.clientWidth / mount.clientHeight);
        out.set(ratio > 1 ? 1 / ratio : 1, ratio < 1 ? ratio : 1);
      };
      const render = () => { if (current !== -1 && !contextLost) renderer.render(scene, camera); };
      const load = (index: number) => {
        if (pending !== -1 || current === index || incoming !== -1 || failed.has(index)) return;
        pending = index;
        const ready = (texture: InstanceType<typeof THREE.Texture>) => {
          if (disposed) { texture.dispose(); return; }
          pending = -1;
          textures.set(index, texture);
          texture.colorSpace = THREE.SRGBColorSpace;
          if (index !== settings.current.active) { wake(); return; }
          if (current === -1) {
            current = index;
            material.uniforms.imageA.value = texture;
            cover(index, material.uniforms.coverA.value);
          }
          incoming = index;
          material.uniforms.imageB.value = texture;
          cover(index, material.uniforms.coverB.value);
          material.uniforms.progress.value = reduced.matches || settings.current.paused || current === index ? 1 : 0;
          render();
          wake();
        };
        const cached = textures.get(index);
        if (cached) ready(cached);
        else loader.load(gardenStories[index].src, ready, undefined, () => {
          if (disposed) return;
          pending = -1; failed.add(index); wake();
        });
      };
      const draw = (now: number) => {
        frame = 0;
        if (disposed || contextLost) return;
        const dt = Math.min(previous ? (now - previous) / 1000 : .016, .05);
        previous = now;
        const still = reduced.matches || settings.current.paused;
        if (reduced.matches) material.uniforms.time.value = 0;
        else if (!still) material.uniforms.time.value += dt;
        if (incoming !== -1) {
          material.uniforms.progress.value = still ? 1 : Math.min(1, material.uniforms.progress.value + dt / 1.15);
          if (material.uniforms.progress.value === 1) {
            current = incoming; incoming = -1;
            material.uniforms.imageA.value = textures.get(current);
            material.uniforms.coverA.value.copy(material.uniforms.coverB.value);
            garden.dataset.renderedStory = String(current);
          }
        }
        load(settings.current.active);
        const ready = current !== -1 && !failed.has(settings.current.active);
        picture.dataset.sceneReady = String(ready);
        mount.style.opacity = ready ? "1" : "0";
        render();
        if (!frame && visible && !document.hidden && !still) frame = requestAnimationFrame(draw);
      };
      function wake() {
        if (!frame && !disposed && !contextLost && visible && !document.hidden) { previous = 0; frame = requestAnimationFrame(draw); }
      }
      wakeRef.current = wake;
      const sync = () => {
        cancelAnimationFrame(frame); frame = 0;
        garden.style.setProperty("--garden-play-state", document.hidden || !visible ? "paused" : "running");
        wake();
      };
      const resize = new ResizeObserver(() => {
        if (!mount.clientWidth || !mount.clientHeight) return;
        renderer.setSize(mount.clientWidth, mount.clientHeight, false);
        cover(current, material.uniforms.coverA.value);
        cover(incoming === -1 ? current : incoming, material.uniforms.coverB.value);
        wake();
      });
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
      const lost = (event: Event) => {
        event.preventDefault(); contextLost = true;
        delete picture.dataset.sceneReady; mount.style.opacity = "0";
        cancelAnimationFrame(frame); frame = 0;
      };
      const restored = () => { contextLost = false; wake(); };
      resize.observe(mount); observer.observe(garden);
      document.addEventListener("visibilitychange", sync);
      reduced.addEventListener("change", sync);
      renderer.domElement.addEventListener("webglcontextlost", lost); renderer.domElement.addEventListener("webglcontextrestored", restored);
      load(settings.current.active);
      cleanup = () => {
        cancelAnimationFrame(frame); wakeRef.current = () => {};
        resize.disconnect(); observer.disconnect();
        document.removeEventListener("visibilitychange", sync); reduced.removeEventListener("change", sync);
        renderer.domElement.removeEventListener("webglcontextlost", lost); renderer.domElement.removeEventListener("webglcontextrestored", restored);
        textures.forEach(texture => texture.dispose()); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove();
        delete picture.dataset.sceneReady;
      };
    }).catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, []);

  return <div ref={mountRef} aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />;
}
