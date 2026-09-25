"use client";

import Link from "next/link";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef } from "react";

const items = [
  { title: "Funktionen", href: "#funktionen" },
  { title: "Mission", href: "/mission" },
  { title: "Kontakt", href: "/kontakt" },
];

export default function Navbar() {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto flex w-fit items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 shadow-lg shadow-black/30 backdrop-blur-md"
    >
      {items.map((item) => (
        <NavBox key={item.title} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  );
}

function NavBox({
  mouseX,
  title,
  href,
}: {
  mouseX: MotionValue;
  title: string;
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [84, 116, 84]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [34, 46, 34]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const isAnchor = href.startsWith("#");

  const box = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className="flex items-center justify-center rounded-xl bg-zinc-800/80 px-2 text-xs font-medium text-zinc-200 transition-colors hover:text-white"
    >
      {title}
    </motion.div>
  );

  return isAnchor ? (
    <a href={href}>{box}</a>
  ) : (
    <Link href={href}>{box}</Link>
  );
}
