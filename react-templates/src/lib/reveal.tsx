import {
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";

const OBSERVER_OPTS: IntersectionObserverInit = {
  threshold: 0.2,
  rootMargin: "0px 0px -8% 0px",
};

/**
 * Callback ref that fires `onEnter` once, the first time the node scrolls into
 * view. Reveal-on-scroll parity with the original IntersectionObserver code.
 */
export function useRevealRef(onEnter?: () => void) {
  return useCallback(
    (node: Element | null) => {
      if (!node) return;
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          onEnter?.();
        }
      }, OBSERVER_OPTS);
      io.observe(node);
    },
    [onEnter],
  );
}

type RevealProps<T extends ElementType> = {
  as?: T;
  delay?: number;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * Fades + rises its children into place the first time they enter the viewport.
 * Renders a <div> by default; pass `as` for a different element.
 */
export function Reveal<T extends ElementType = "div">({
  as,
  delay = 0,
  className = "",
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as || "div") as ElementType;
  const [inView, setInView] = useState(false);
  const ref = useRevealRef(() => setInView(true));

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={[
        "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-300",
        inView ? "translate-y-0 opacity-100" : "translate-y-[22px] opacity-0 motion-reduce:translate-y-0",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}
