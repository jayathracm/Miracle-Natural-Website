import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MainLayout = ({ children }) => {
    const lenisRef = useRef(null);

    useEffect(() => {
        // Detect if device supports touch (mobile/tablet)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobile = window.innerWidth < 1024; // tablets and phones
        
        // Disable Lenis on touch devices for better native scrolling performance
        if (isTouchDevice || isMobile) {
            // Use native scrolling on mobile - it's faster and smoother
            ScrollTrigger.config({
                autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
            });
            return;
        }

        // Only enable Lenis on desktop devices
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });
        lenisRef.current = lenis;

        // Sync GSAP ScrollTrigger with Lenis
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(lenis.raf);
            lenis.destroy();
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbf7ea_0%,#f4ecd8_56%,#ecdfc5_100%)]" />
                <div className="absolute inset-0 opacity-55" style={{
                    backgroundImage: 'radial-gradient(circle at 14% 10%, rgba(203,182,118,0.28), transparent 34%), radial-gradient(circle at 86% 16%, rgba(79,113,84,0.2), transparent 30%), radial-gradient(circle at 50% 88%, rgba(184,111,67,0.14), transparent 36%)'
                }} />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default MainLayout;
