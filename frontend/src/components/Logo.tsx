import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <rect
            width="40"
            height="40"
            rx="10"
            className="fill-primary"
          />
          <path
            d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32C26.627 32 32 26.627 32 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-credora-emerald"
          />
          <path
            d="M20 14V20L24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          />
        </svg>
        <div className="absolute inset-0 bg-credora-emerald/20 blur-xl rounded-full" />
      </div>
      {showText && (
        <span className={`font-semibold tracking-tight ${text}`}>
          Credora
        </span>
      )}
    </motion.div>
  );
}
