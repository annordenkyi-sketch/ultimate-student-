import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1];

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/** Simple fade + translateY entrance. Opacity-only under reduced-motion. */
export const FadeIn = ({ children, delay = 0, y = 12, className }: FadeInProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

/** Wrap a group of children to stagger their entrance. */
export const Stagger = ({
  children,
  delayChildren = 0,
  staggerChildren = 0.06,
  className,
}: {
  children: ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  className?: string;
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: { staggerChildren, delayChildren },
      },
    }}
  >
    {children}
  </motion.div>
);

/** A child of <Stagger> — the parent controls the delay. */
export const StaggerChild = ({
  children,
  y = 12,
  className,
}: {
  children: ReactNode;
  y?: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

/** A div that gives interactive press feedback. Use for buttons / card links. */
export const PressableDiv = ({
  children,
  ...rest
}: HTMLMotionProps<"div">) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export { motion };
