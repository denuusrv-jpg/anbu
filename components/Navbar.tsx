"use client";

import Link from "next/link";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const items = [
  { title: "Erfahre mehr", href: "#funktionen" },
  { title: "Unsere Mission", href: "/mission" },
  { title: "Kontakt", href: "/kontakt" },
];

const boxClassName =
  "flex items-center justify-center whitespace-nowrap rounded-xl bg-zinc-800/80 px-3 text-[10px] font-semibold tracking-wide text-zinc-200 uppercase transition-colors hover:text-white";

export default function Navbar() {
  const [isDesktop, setIsDesktop] = useState(false);
  const mouseX = useMotionValue(Infinity);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px) and (pointer: fine)");
    setIsDesktop(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto flex w-fit flex-wrap items-end justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-2 py-2 shadow-lg shadow-black/30 backdrop-blur-md sm:gap-3 sm:px-3"
    >
      {items.map((item) =>
        isDesktop ? (
          <NavBoxDesktop key={item.title} mouseX={mouseX} {...item} />
        ) : (
          <NavBoxStatic key={item.title} {...item} />
        ),
      )}
    </motion.div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isAnchor = href.startsWith("#");
  return isAnchor ? (
    <a href={href}>{children}</a>
  ) : (
    <Link href={href}>{children}</Link>
  );
}

function NavBoxStatic({ title, href }: { title: string; href: string }) {
  return (
    <NavLink href={href}>
      <div className={`${boxClassName} h-9 py-2`}>{title}</div>
    </NavLink>
  );
}

function NavBoxDesktop({
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

  const minWidth = Math.max(76, title.length * 7 + 24);
  const widthTransform = useTransform(
    distance,
    [-150, 0, 150],
    [minWidth, minWidth + 30, minWidth],
  );
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

  return (
    <NavLink href={href}>
      <motion.div ref={ref} style={{ width, height }} className={boxClassName}>
        {title}
      </motion.div>
    </NavLink>
  );
}
