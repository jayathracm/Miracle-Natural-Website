import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const variants = {
    h1: "font-display text-[2.35rem] sm:text-[2.95rem] md:text-[3.7rem] lg:text-[4.3rem] font-normal leading-[1.06]",
    h2: "font-display text-[1.95rem] sm:text-[2.4rem] md:text-[3rem] lg:text-[3.55rem] font-normal leading-[1.08]",
    h3: "font-display text-[1.45rem] sm:text-[1.65rem] md:text-[1.9rem] lg:text-[2.2rem] font-normal leading-[1.14]",
    h4: "font-sans text-[1.05rem] sm:text-[1.12rem] md:text-[1.18rem] lg:text-[1.25rem] font-semibold tracking-[0.01em] leading-snug",
    p: "font-sans text-[1rem] sm:text-[1.06rem] md:text-[1.1rem] lg:text-[1.12rem] text-muted-foreground leading-relaxed",
    small: "font-sans text-[0.88rem] sm:text-[0.92rem] md:text-[0.95rem] lg:text-[0.98rem] text-muted-foreground",
    label: "font-sans text-[0.72rem] sm:text-[0.75rem] md:text-[0.78rem] lg:text-[0.8rem] font-bold tracking-[0.22em] uppercase text-accent",
};

export const Typography = ({
    variant = 'p',
    className,
    children,
    as,
    animate = false,
    ...props
}) => {
    const Component = as || (variant === 'label' ? 'span' : variant);
    const MotionComponent = motion(Component);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (animate) {
        return (
            <MotionComponent
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: isMobile ? 0.72 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(variants[variant], className)}
                {...props}
            >
                {children}
            </MotionComponent>
        );
    }

    return (
        <Component className={cn(variants[variant], className)} {...props}>
            {children}
        </Component>
    );
};
