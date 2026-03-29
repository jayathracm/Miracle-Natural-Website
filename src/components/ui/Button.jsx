import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Button = ({
    children,
    className,
    variant = 'primary',
    icon: Icon,
    ...props
}) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const x = e.clientX - (left + width / 2);
        const y = e.clientY - (top + height / 2);
        setPosition({ x: x * 0.1, y: y * 0.1 });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const baseStyles = "relative inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-sans font-semibold text-[0.86rem] tracking-[0.06em] uppercase transition-all duration-300 ease-out overflow-hidden group";

    const variants = {
        primary: "bg-primary text-primary-foreground border border-primary hover:bg-forest-800",
        secondary: "bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-foreground hover:bg-[var(--color-card-bg-hover)]",
        outline: "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "bg-transparent border border-[var(--color-border-medium)] text-foreground hover:bg-[var(--color-hover-overlay)]",
    };

    return (
        <motion.button
            ref={ref}
            className={cn(baseStyles, variants[variant], className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {children}
                {Icon && <Icon size={18} className="transition-transform group-hover:translate-x-1" />}
            </span>

            {/* Sheen */}
            {variant === 'primary' && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/18 to-transparent z-0" />
            )}
        </motion.button>
    );
};
