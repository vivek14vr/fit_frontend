"use client";

import { useEffect, useRef } from "react";
import s from "../homepage.module.css";
import { wheelPaths } from "./service-wheel-data";

/** The camera and links share the approved header logo's 200-unit square. */
export default function PetalFlowerScene({ active }: { active: number }) {
  const host = useRef<HTMLDivElement>(null);
  const selection = useRef(active);
  const wake = useRef(() => {});
  useEffect(() => { selection.current = active; wake.current(); }, [active]);

  useEffect(() => {
    const mount = host.current;
    const wheel = mount?.parentElement;
    if (!mount || !wheel) return;
    let disposed = false;
    let release = () => {};
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    void import("three").then(T => {
      if (disposed) return;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setClearColor(0, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      const scene = new T.Scene();
      const camera = new T.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
      camera.position.z = 600;
      scene.add(new T.AmbientLight(0xfff9ef, 1.15));
      const light = new T.DirectionalLight(0xfff2dc, 3);
      light.position.set(-80, 120, 350);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 1, far: 700 });
      light.shadow.bias = -.0004;
      light.shadow.normalBias = .06;
      scene.add(light);
      const fill = new T.DirectionalLight(0xc6e1dc, .6);
      fill.position.set(100,-50,150);
      scene.add(fill);
      const shadowGeometry = new T.PlaneGeometry(200,200);
      const shadowMaterial = new T.ShadowMaterial({ opacity: .12 });
      const shadow = new T.Mesh(shadowGeometry,shadowMaterial);
      shadow.position.z = -1;
      shadow.receiveShadow = true;
      scene.add(shadow);

      // Local petal coordinates: the stem is at (0, 0), all rotations share it.
      const shape = new T.Shape();
      shape.moveTo(0, 22);
      shape.bezierCurveTo(30, 34, 34, 62, 0, 85);
      shape.bezierCurveTo(-34, 62, -30, 34, 0, 22);
      const geometry = new T.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: true, bevelThickness: .8, bevelSize: .7, bevelSegments: 5, steps: 1, curveSegments: 48 });
      // A dense indexed surface gives each petal a continuous ceramic crown.
      const surface = new T.BufferGeometry();
      const points: number[] = [], indices: number[] = [];
      const rows = 40, columns = 24;
      for (let row = 0; row <= rows; row++) {
        const t = row / rows, u = 1 - t;
        const width = 3*u*u*t*30 + 3*u*t*t*34;
        const y = u*u*u*22 + 3*u*u*t*34 + 3*u*t*t*62 + t*t*t*85;
        for (let column = 0; column <= columns; column++) {
          const across = 2*column/columns - 1;
          points.push(width*across,y,4.8 + Math.sin(Math.PI*t)*(1-across*across)*3.5);
          if (row < rows && column < columns) {
            const a = row*(columns+1)+column, b = a+columns+1;
            indices.push(a,a+1,b,a+1,b+1,b);
          }
        }
      }
      surface.setAttribute("position",new T.Float32BufferAttribute(points,3));
      surface.setIndex(indices);
      surface.computeVertexNormals();
      const materials = wheelPaths.map(item => [
        new T.MeshPhysicalMaterial({ color: item.color, roughness: .46, metalness: .05, clearcoat: .22, clearcoatRoughness: .4 }),
        new T.MeshStandardMaterial({ color: new T.Color(item.color).multiplyScalar(.8), roughness: .5, metalness: .12 }),
      ]);
      const petals = materials.map((material, index) => {
        const pivot = new T.Group();
        pivot.rotation.z = -index * Math.PI / 3;
        const mesh = new T.Group();
        const base = new T.Mesh(geometry, material);
        const crown = new T.Mesh(surface,material[0]);
        base.castShadow = true;
        crown.castShadow = true;
        mesh.add(base,crown);
        pivot.add(mesh);
        scene.add(pivot);
        return mesh;
      });
      mount.appendChild(renderer.domElement);
      let frame = 0, previous = 0, elapsed = 0, visible = false, hover = -1, lost = false;
      const draw = (now: number) => {
        frame = 0;
        if (disposed || !visible || document.hidden || lost) return;
        const dt = previous ? Math.min((now - previous) / 1000, .05) : 1 / 60;
        previous = now;
        elapsed += dt;
        let unsettled = false;
        petals.forEach((petal, index) => {

          const bloom = motion.matches ? 1 : Math.min(1, Math.max(0, (elapsed - index * .08) / .8));
          const open = 1 - Math.pow(1 - bloom, 3);
          const target = motion.matches ? 0 : (1 - open) * .65 + (hover === index ? -.06 : selection.current === index ? -.025 : 0);
          petal.rotation.x += (target - petal.rotation.x) * (motion.matches ? 1 : 1 - Math.exp(-12 * dt));
          const lift = motion.matches ? 0 : hover === index ? 5 : selection.current === index ? 2.5 : 0;
          petal.position.z += (lift-petal.position.z)*(motion.matches ? 1 : 1-Math.exp(-12*dt));
          unsettled ||= bloom < 1 || Math.abs(target - petal.rotation.x) > .001 || Math.abs(lift-petal.position.z) > .01;
        });
        renderer.render(scene, camera);
        wheel.dataset.flowerReady = "true";
        wheel.closest("[data-discovery-flower]")?.setAttribute("data-flower-ready", "true");
        if (unsettled) frame = requestAnimationFrame(draw);
      };
      const schedule = () => {
        if (!frame && visible && !document.hidden && !lost) { previous = 0; frame = requestAnimationFrame(draw); }
      };
      wake.current = schedule;
      const resize = new ResizeObserver(() => { const size = Math.min(1100, Math.round(mount.clientWidth)); renderer.setSize(size, size, false); schedule(); });
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; }
      }, { threshold: .15 });
      const point = (event: Event) => {
        const button = event.target instanceof Element ? event.target.closest("[data-petal-index]") : null;
        hover = button ? Number(button.getAttribute("data-petal-index")) : -1;
        schedule();
      };
      const leave = () => { hover = -1; schedule(); };
      const visibility = () => { cancelAnimationFrame(frame); frame = 0; schedule(); };
      const contextLost = (event: Event) => { event.preventDefault(); lost = true; delete wheel.dataset.flowerReady; wheel.closest("[data-discovery-flower]")?.removeAttribute("data-flower-ready"); cancelAnimationFrame(frame); frame = 0; };
      const contextRestored = () => { lost = false; schedule(); };
      resize.observe(mount);
      observer.observe(wheel);
      wheel.addEventListener("pointerover", point);
      wheel.addEventListener("focusin", point);
      wheel.addEventListener("pointerleave", leave);
      wheel.addEventListener("focusout", leave);
      document.addEventListener("visibilitychange", visibility);
      motion.addEventListener("change", schedule);
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
      release = () => {
        wake.current = () => {};
        cancelAnimationFrame(frame);
        observer.disconnect(); resize.disconnect();
        wheel.removeEventListener("pointerover", point); wheel.removeEventListener("focusin", point);
        wheel.removeEventListener("pointerleave", leave); wheel.removeEventListener("focusout", leave);
        document.removeEventListener("visibilitychange", visibility); motion.removeEventListener("change", schedule);
        renderer.domElement.removeEventListener("webglcontextlost", contextLost);
        renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
        delete wheel.dataset.flowerReady; wheel.closest("[data-discovery-flower]")?.removeAttribute("data-flower-ready");
        geometry.dispose(); surface.dispose(); materials.flat().forEach(material => material.dispose()); shadowGeometry.dispose(); shadowMaterial.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => { release(); });
    return () => { disposed = true; release(); };
  }, []);
  return <div ref={host} className={s.petalFlowerCanvas} aria-hidden="true" />;
}
