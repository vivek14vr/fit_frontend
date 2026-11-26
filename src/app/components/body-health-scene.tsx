"use client";

import { useEffect, useRef } from "react";
import type { BodyConcernId } from "./body-concerns";
import s from "./body-concerns.module.css";

type BodyHealthSceneProps = {
  activeId: BodyConcernId;
  view?: "front" | "back";
  zoom?: number;
  modal?: boolean;
};

type Point = [number, number, number];

const FOCUS_POINTS: Record<BodyConcernId, { position: Point; scale: number }> = {
  "mind-emotional-wellness": { position: [0, 3.17, 0.48], scale: 0.72 },
  thyroid: { position: [0, 2.58, 0.49], scale: 0.48 },
  liver: { position: [-0.16, 1.62, 0.54], scale: 0.72 },
  gut: { position: [0, 0.95, 0.57], scale: 0.78 },
  "fat-loss-metabolic": { position: [0, 0.3, 0.55], scale: 1.06 },
  skin: { position: [0, 1.45, 0.22], scale: 1.58 },
};

export default function BodyHealthScene({ activeId, view = "front", zoom = 1, modal = false }: BodyHealthSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selection = useRef(activeId);
  const viewRef = useRef(view);
  const zoomRef = useRef(zoom);
  const wake = useRef(() => {});

  useEffect(() => {
    selection.current = activeId;
    viewRef.current = view;
    zoomRef.current = zoom;
    wake.current();
  }, [activeId, view, zoom]);

  useEffect(() => {
    const mount = mountRef.current;
    const stage = mount?.closest<HTMLElement>("[data-body-stage]");
    if (!mount || !stage) return;

    let disposed = false;
    let release = () => {};
    let started = false;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const lowPower = Boolean(connection?.saveData);

    const prepare = () => {
      if (started || disposed) return;
      started = true;

      void import("three").then((T) => {
        if (disposed) return;

        let renderer: InstanceType<typeof T.WebGLRenderer>;
        try {
          renderer = new T.WebGLRenderer({ alpha: true, antialias: !lowPower, powerPreference: "low-power" });
        } catch {
          started = false;
          return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 1.5));
        renderer.setClearColor(0, 0);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;

        const scene = new T.Scene();
        // Keep the complete figure in frame. The section is tall and narrow at
        // desktop widths, so a wider perspective is more reliable than a tight
        // portrait crop that clips the head and lower legs.
        const camera = new T.PerspectiveCamera(32, 1, 0.1, 60);
        camera.position.set(0, 0.05, 13.5);
        camera.lookAt(0, 0.05, 0);

        scene.add(new T.HemisphereLight(0xcfe1d6, 0x0b2b28, 2.2));
        const keyLight = new T.DirectionalLight(0xfff3d6, 3.5);
        keyLight.position.set(-3.5, 5, 6);
        scene.add(keyLight);
        const rimLight = new T.DirectionalLight(0x6ea993, 2.6);
        rimLight.position.set(4, 1.2, -3);
        scene.add(rimLight);

        const body = new T.Group();
        body.position.y = -0.12;
        scene.add(body);

        const bodyMaterial = new T.MeshPhysicalMaterial({
          color: 0xa8c4b6,
          roughness: 0.48,
          metalness: 0.02,
          clearcoat: 0.3,
          clearcoatRoughness: 0.55,
          transparent: true,
          opacity: 0.56,
        });
        const edgeMaterial = new T.LineBasicMaterial({
          color: 0xcfe2d7,
          transparent: true,
          opacity: 0.17,
        });
        type SceneGeometry = NonNullable<ConstructorParameters<typeof T.EdgesGeometry>[0]>;
        const geometries: SceneGeometry[] = [];
        const parts: InstanceType<typeof T.Mesh>[] = [];

        const addPart = (
          geometry: SceneGeometry,
          position: Point,
          scale: Point,
          rotation: Point = [0, 0, 0],
        ) => {
          geometries.push(geometry);
          const mesh = new T.Mesh(geometry, bodyMaterial);
          mesh.position.set(...position);
          mesh.scale.set(...scale);
          mesh.rotation.set(...rotation);
          mesh.castShadow = true;
          const edgeGeometry = new T.EdgesGeometry(geometry, 22);
          geometries.push(edgeGeometry);
          const edge = new T.LineSegments(edgeGeometry, edgeMaterial);
          edge.position.copy(mesh.position);
          edge.scale.copy(mesh.scale);
          edge.rotation.copy(mesh.rotation);
          body.add(mesh, edge);
          parts.push(mesh);
          return mesh;
        };

        addPart(new T.SphereGeometry(0.42, 32, 24), [0, 3.15, 0], [1, 1.12, 0.88]);
        addPart(new T.CylinderGeometry(0.17, 0.2, 0.36, 28), [0, 2.67, 0], [1, 1, 0.92]);
        addPart(new T.SphereGeometry(1, 32, 24), [0, 1.55, 0], [0.62, 1.2, 0.53]);
        addPart(new T.SphereGeometry(0.63, 32, 22), [0, 0.32, 0], [1.03, 0.7, 0.68]);
        addPart(new T.SphereGeometry(0.42, 28, 20), [-0.52, 2.1, 0], [1.14, 0.9, 0.72], [0, 0, -0.08]);
        addPart(new T.SphereGeometry(0.42, 28, 20), [0.52, 2.1, 0], [1.14, 0.9, 0.72], [0, 0, 0.08]);
        addPart(new T.CapsuleGeometry(0.19, 1.35, 12, 24), [-0.82, 1.45, 0], [0.92, 1, 0.9], [0, 0, -0.12]);
        addPart(new T.CapsuleGeometry(0.19, 1.35, 12, 24), [0.82, 1.45, 0], [0.92, 1, 0.9], [0, 0, 0.12]);
        addPart(new T.CapsuleGeometry(0.16, 1.14, 12, 24), [-1.04, 0.2, 0], [0.92, 1, 0.9], [0, 0, -0.07]);
        addPart(new T.CapsuleGeometry(0.16, 1.14, 12, 24), [1.04, 0.2, 0], [0.92, 1, 0.9], [0, 0, 0.07]);
        addPart(new T.SphereGeometry(0.2, 28, 20), [-1.1, -0.48, 0], [0.86, 1.05, 0.86]);
        addPart(new T.SphereGeometry(0.2, 28, 20), [1.1, -0.48, 0], [0.86, 1.05, 0.86]);
        addPart(new T.CapsuleGeometry(0.26, 1.25, 12, 24), [-0.34, -0.8, 0], [0.95, 1, 0.92]);
        addPart(new T.CapsuleGeometry(0.26, 1.25, 12, 24), [0.34, -0.8, 0], [0.95, 1, 0.92]);
        addPart(new T.CapsuleGeometry(0.21, 1.38, 12, 24), [-0.35, -2.13, 0], [0.94, 1, 0.9]);
        addPart(new T.CapsuleGeometry(0.21, 1.38, 12, 24), [0.35, -2.13, 0], [0.94, 1, 0.9]);
        addPart(new T.SphereGeometry(0.28, 28, 20), [-0.35, -2.98, 0.14], [0.95, 0.46, 1.45]);
        addPart(new T.SphereGeometry(0.28, 28, 20), [0.35, -2.98, 0.14], [0.95, 0.46, 1.45]);

        const regions: Record<BodyConcernId, InstanceType<typeof T.Group>> = {
          "mind-emotional-wellness": new T.Group(),
          thyroid: new T.Group(),
          liver: new T.Group(),
          gut: new T.Group(),
          "fat-loss-metabolic": new T.Group(),
          skin: new T.Group(),
        };
        const regionMaterials: Record<BodyConcernId, InstanceType<typeof T.MeshStandardMaterial>> = {
          "mind-emotional-wellness": new T.MeshStandardMaterial({ color: 0xd8bb68, emissive: 0x8f6427, emissiveIntensity: 0.12, roughness: 0.32, transparent: true, opacity: 0.28 }),
          thyroid: new T.MeshStandardMaterial({ color: 0xd49a53, emissive: 0x8a4a21, emissiveIntensity: 0.12, roughness: 0.32, transparent: true, opacity: 0.28 }),
          liver: new T.MeshStandardMaterial({ color: 0xb8614d, emissive: 0x652c25, emissiveIntensity: 0.12, roughness: 0.32, transparent: true, opacity: 0.28 }),
          gut: new T.MeshStandardMaterial({ color: 0x9fb56d, emissive: 0x4f6d38, emissiveIntensity: 0.12, roughness: 0.28, transparent: true, opacity: 0.28 }),
          "fat-loss-metabolic": new T.MeshStandardMaterial({ color: 0xc88768, emissive: 0x733c2b, emissiveIntensity: 0.12, roughness: 0.32, transparent: true, opacity: 0.28 }),
          skin: new T.MeshStandardMaterial({ color: 0xe2b86d, emissive: 0x8d612b, emissiveIntensity: 0.08, roughness: 0.26, transparent: true, opacity: 0.12 }),
        };

        const addRegionMesh = (id: BodyConcernId, geometry: SceneGeometry, position: Point, scale: Point, rotation: Point = [0, 0, 0]) => {
          geometries.push(geometry);
          const mesh = new T.Mesh(geometry, regionMaterials[id]);
          mesh.position.set(...position);
          mesh.scale.set(...scale);
          mesh.rotation.set(...rotation);
          regions[id].add(mesh);
        };

        addRegionMesh("mind-emotional-wellness", new T.SphereGeometry(0.34, 20, 14), [0, 3.15, 0.39], [1, 0.8, 0.78]);
        addRegionMesh("mind-emotional-wellness", new T.SphereGeometry(0.18, 16, 12), [-0.2, 3.17, 0.46], [1.2, 0.84, 0.72]);
        addRegionMesh("mind-emotional-wellness", new T.SphereGeometry(0.18, 16, 12), [0.2, 3.17, 0.46], [1.2, 0.84, 0.72]);
        addRegionMesh("thyroid", new T.SphereGeometry(0.16, 18, 12), [-0.12, 2.58, 0.43], [0.72, 1, 0.72]);
        addRegionMesh("thyroid", new T.SphereGeometry(0.16, 18, 12), [0.12, 2.58, 0.43], [0.72, 1, 0.72]);
        addRegionMesh("liver", new T.SphereGeometry(0.46, 22, 14), [-0.16, 1.62, 0.43], [1.14, 0.46, 0.65], [0, 0, -0.06]);
        addRegionMesh("gut", new T.TorusKnotGeometry(0.23, 0.052, 48, 8, 2, 3), [0, 0.96, 0.5], [1.06, 0.82, 0.72], [0, 0, 0.2]);
        addRegionMesh("fat-loss-metabolic", new T.TorusGeometry(0.49, 0.055, 12, 36), [0, 0.3, 0.5], [1, 0.66, 0.72], [0, 0, 0]);
        addRegionMesh("skin", new T.SphereGeometry(0.6, 24, 18), [0, 1.5, -0.05], [1.2, 2.2, 0.84]);
        Object.values(regions).forEach((region) => body.add(region));

        const focusMaterial = new T.MeshStandardMaterial({ color: 0xe3b449, emissive: 0xe3b449, emissiveIntensity: 1.3, transparent: true, opacity: 0.82, roughness: 0.3 });
        const focusRing = new T.Mesh(new T.TorusGeometry(0.42, 0.025, 10, 36), focusMaterial);
        focusRing.position.set(...FOCUS_POINTS.gut.position);
        body.add(focusRing);
        geometries.push(focusRing.geometry);

        const orbitMaterial = new T.MeshBasicMaterial({ color: 0xe3b449, transparent: true, opacity: 0.2 });
        const orbit = new T.Mesh(new T.TorusGeometry(1.62, 0.006, 6, 96), orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        orbit.rotation.z = 0.22;
        orbit.position.z = -0.2;
        body.add(orbit);
        geometries.push(orbit.geometry);

        const targetRotation = new T.Vector2(0, 0);
        const pointer = (event: PointerEvent) => {
          const rect = mount.getBoundingClientRect();
          targetRotation.set(
            ((event.clientX - rect.left) / rect.width - 0.5) * 0.22,
            ((event.clientY - rect.top) / rect.height - 0.5) * 0.12,
          );
          schedule();
        };
        const pointerLeave = () => { targetRotation.set(0, 0); schedule(); };

        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        mount.appendChild(renderer.domElement);
        stage.dataset.threeReady = "true";

        let frame = 0;
        let visible = false;
        let previous = 0;
        let time = 0;

        const syncMaterials = () => {
          const active = selection.current;
          Object.entries(regions).forEach(([id, region]) => {
            const concern = id as BodyConcernId;
            // Skin is represented by the whole-body material, rather than a
            // second oversized shell that would make the mannequin feel toy-like.
            region.visible = concern !== "skin";
            regionMaterials[concern].opacity = concern === active ? (concern === "skin" ? 0.1 : 0.92) : concern === "skin" ? 0.05 : 0.2;
            regionMaterials[concern].emissiveIntensity = concern === active ? 0.72 : 0.1;
          });
          const skinActive = active === "skin";
          bodyMaterial.color.setHex(skinActive ? 0xb8cdbb : 0x9cb8aa);
          bodyMaterial.emissive.setHex(skinActive ? 0x315f50 : 0x173e38);
          bodyMaterial.emissiveIntensity = skinActive ? 0.42 : 0.06;
          const focus = FOCUS_POINTS[active];
          focusRing.position.set(...focus.position);
          focusRing.scale.setScalar(focus.scale);
          focusRing.visible = !skinActive;
        };

        const draw = (now: number) => {
          frame = 0;
          if (disposed || !visible || document.hidden) return;
          const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60;
          previous = now;
          if (!motion.matches && !lowPower) time += dt;
          syncMaterials();
          const reduced = motion.matches || lowPower;
          const baseRotationY = viewRef.current === "back" ? Math.PI : 0;
          const desiredRotationY = baseRotationY + targetRotation.x;
          body.rotation.y += (desiredRotationY - body.rotation.y) * (reduced ? 1 : 1 - Math.exp(-5 * dt));
          body.rotation.x += (targetRotation.y - body.rotation.x) * (reduced ? 1 : 1 - Math.exp(-5 * dt));
          body.scale.setScalar(zoomRef.current);
          body.position.y += ((reduced ? -0.12 : -0.12 + Math.sin(time * 1.25) * 0.025) - body.position.y) * (reduced ? 1 : 1 - Math.exp(-4 * dt));
          focusRing.rotation.z = reduced ? 0 : time * 0.2;
          focusMaterial.opacity = 0.7 + (reduced ? 0 : Math.sin(time * 2.4) * 0.1);
          orbit.rotation.y = reduced ? 0.08 : 0.08 + Math.sin(time * 0.45) * 0.06;
          renderer.render(scene, camera);
          if (!reduced || Math.abs(targetRotation.x - body.rotation.y) > 0.001 || Math.abs(targetRotation.y - body.rotation.x) > 0.001) frame = requestAnimationFrame(draw);
        };

        function schedule() {
          if (!frame && visible && !document.hidden) {
            previous = 0;
            frame = requestAnimationFrame(draw);
          }
        }

        const resize = new ResizeObserver(() => {
          const width = mount.clientWidth;
          const height = mount.clientHeight;
          if (!width || !height) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
          schedule();
        });
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) schedule();
          else { cancelAnimationFrame(frame); frame = 0; }
        }, { threshold: 0 });
        const visibility = () => { cancelAnimationFrame(frame); frame = 0; schedule(); };
        const contextLost = (event: Event) => {
          event.preventDefault();
          cancelAnimationFrame(frame);
          frame = 0;
          stage.dataset.threeReady = "false";
        };
        const contextRestored = () => {
          stage.dataset.threeReady = "true";
          schedule();
        };

        wake.current = schedule;
        resize.observe(mount);
        observer.observe(stage);
        mount.addEventListener("pointermove", pointer);
        mount.addEventListener("pointerleave", pointerLeave);
        document.addEventListener("visibilitychange", visibility);
        motion.addEventListener("change", visibility);
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
        syncMaterials();

        release = () => {
          wake.current = () => {};
          cancelAnimationFrame(frame);
          resize.disconnect();
          observer.disconnect();
          mount.removeEventListener("pointermove", pointer);
          mount.removeEventListener("pointerleave", pointerLeave);
          document.removeEventListener("visibilitychange", visibility);
          motion.removeEventListener("change", visibility);
          renderer.domElement.removeEventListener("webglcontextlost", contextLost);
          renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
          bodyMaterial.dispose();
          edgeMaterial.dispose();
          focusMaterial.dispose();
          orbitMaterial.dispose();
          Object.values(regionMaterials).forEach((material) => material.dispose());
          geometries.forEach((geometry) => geometry.dispose());
          renderer.dispose();
          renderer.domElement.remove();
          stage.dataset.threeReady = "false";
          parts.length = 0;
        };
      }).catch(() => {
        started = false;
      });
    };

    const preparation = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) prepare();
    }, { rootMargin: "420px" });
    preparation.observe(stage);

    return () => {
      disposed = true;
      preparation.disconnect();
      release();
    };
  }, []);

  return <div ref={mountRef} className={`${s.bodyCanvas} ${modal ? s.bodyCanvasModal : ""}`} aria-hidden="true" />;
}
