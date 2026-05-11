"use client";
import { useEffect, useRef } from "react";
import { useInView, animate } from "motion/react";

interface CounterProps {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Counter({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2.2,
  className,
  style,
}: CounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || !nodeRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const node = nodeRef.current;
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        node.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      },
    });

    return () => controls.stop();
  }, [isInView, to, prefix, suffix, decimals, duration]);

  return (
    <span ref={nodeRef} className={className} style={style}>
      {prefix}0{suffix}
    </span>
  );
}
