import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = ({ children, className, hoverEffect = true, animate = true, ...props }) => {
    const Component = animate ? motion.div : 'div';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const animationProps = animate ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: isMobile ? 0.65 : 0.5, ease: "easeOut" }
    } : {};

    return (
        <Component
            {...animationProps}
            className={cn(
                "rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 relative overflow-hidden bg-[var(--color-card-bg)] border border-[var(--color-card-border)]",
                hoverEffect && "hover:bg-[var(--color-card-bg-hover)] hover:border-[var(--color-card-border-hover)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1",
                className
            )}
            {...props}
        >
            {/* Subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-18 bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </Component>
    );
};
