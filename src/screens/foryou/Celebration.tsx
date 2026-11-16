import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Modal } from "@/ui/Modal";
import { btn } from "@/ui/button";

const SPARKS = [0, 60, 120, 180, 240, 300];

/** A small, quiet celebration when a goal is completed. */
export const Celebration = ({ open, title, onClose }: { open: boolean; title: string; onClose: () => void }) => {
  const reduce = useReducedMotion();
  return (
    <Modal open={open} onClose={onClose} title="Goal completed">
      <div className="flex flex-col items-center text-center">
        <div className="relative my-2 h-24 w-24" aria-hidden="true">
          {!reduce &&
            SPARKS.map((deg) => (
              <motion.span
                key={deg}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-oxford-gold"
                initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.5 }}
                animate={{
                  x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 44}px)`,
                  y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 44}px)`,
                  opacity: [0, 1, 0],
                  scale: 1,
                }}
                transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
              />
            ))}
          <motion.span
            className="absolute inset-3 flex items-center justify-center rounded-full bg-oxford-gold text-oxford-ink"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <Check className="h-9 w-9" strokeWidth={2.5} />
          </motion.span>
        </div>
        <p className="mt-2 font-semibold text-oxford-ink">{title}</p>
        <p className="mt-1 text-sm text-oxford-mute">Well done. It's moved to Completed and its reminders have stopped.</p>
        <button type="button" onClick={onClose} className={btn("primary", "mt-6 w-full")}>
          Done
        </button>
      </div>
    </Modal>
  );
};
