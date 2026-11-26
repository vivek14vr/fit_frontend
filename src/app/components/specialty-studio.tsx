"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { CSSProperties } from "react";
import s from "../homepage.module.css";

const specialties = [
  {
    label: "GUT & DIGESTION",
    title: "When food stops feeling easy.",
    description: "Bloating, reflux, irregularity, nausea or food reactions can make every meal feel like a decision.",
    image: "/specialties/gut-morning-table.webp",
    position: "center",
    accent: "#8db79b",
  },
  {
    label: "METABOLIC HEALTH",
    title: "When energy keeps dipping.",
    description: "Cravings, changing weight, blood-sugar questions and a routine that never seems to settle.",
    image: "/specialties/metabolic-breakfast.webp",
    position: "center",
    accent: "#e3b449",
  },
  {
    label: "HORMONES & THYROID",
    title: "When your rhythm feels unfamiliar.",
    description: "Cycle changes, PMS, PCOS-related goals, fertility nutrition or thyroid questions.",
    image: "/specialties/hormone-rhythm.webp",
    position: "center",
    accent: "#d1b6cf",
  },
  {
    label: "SKIN & INFLAMMATION",
    title: "When your skin keeps speaking up.",
    description: "Acne, eczema, psoriasis, scalp concerns, allergies or joint discomfort.",
    image: "/specialties/skin-botanical.webp",
    position: "center",
    accent: "#e6a08d",
  },
  {
    label: "MOOD & FOCUS",
    title: "When you feel worn out.",
    description: "Brain fog, low mood, stress around food, headaches or migraines that keep returning.",
    image: "/specialties/mood-morning.webp",
    position: "center",
    accent: "#a6d2c5",
  },
  {
    label: "LIVER & RECOVERY",
    title: "When a report raises new questions.",
    description: "Liver-health markers, breathing or sinus concerns, recovery after illness and symptoms that linger.",
    image: "/specialties/recovery-citrus.webp",
    position: "center",
    accent: "#f0c978",
  },
] as const;

export default function SpecialtyStudio() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="specialties" className={s.specialties} data-transition-section="specialties" aria-labelledby="specialties-title">
      <div className={`${s.section} ${s.specialtiesVisualLayout}`}>
        <motion.div
          className={s.specialtiesVisualHeader}
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={s.eyebrow}>THE CONVERSATIONS WE HOLD</p>
          <h2 id="specialties-title">A clearer way to understand what your body is <em>asking for.</em></h2>
          <p>These are some of the reasons people reach out. You do not need to arrive with one perfect label—your starting point can be a pattern, a report or simply the feeling that something is not working as it used to.</p>
        </motion.div>

        <motion.div
          className={s.specialtiesMosaic}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
          }}
        >
          {specialties.map((specialty, index) => (
            <motion.article
              className={`${s.specialtyTile} ${index === 0 ? s.specialtyTileLead : ""}`}
              key={specialty.label}
              style={{ "--specialty-accent": specialty.accent } as CSSProperties}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={reduceMotion ? undefined : { y: -7 }}
              transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={specialty.image} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw" style={{ objectPosition: specialty.position }} />
              <div className={s.specialtyTileShade} aria-hidden="true" />
              <div className={s.specialtyTileContent}>
                <div className={s.specialtyTileLabel}><span>{String(index + 1).padStart(2, "0")}</span><strong>{specialty.label}</strong></div>
                <h3>{specialty.title}</h3>
                <p>{specialty.description}</p>
              </div>
              <span className={s.specialtyTileAccent} aria-hidden="true" />
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className={s.specialtiesVisualNote}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.62, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>NOT SURE WHERE YOU FIT?</span>
          <p>That is completely fine. The first conversation is for making sense of the whole picture—not for choosing the perfect category by yourself.</p>
        </motion.div>
      </div>
    </section>
  );
}
