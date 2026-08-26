import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenisInstance } from '@/shared/lib/lenisInstance';

gsap.registerPlugin(ScrollTrigger);

const MainLayout = ({ children }) => {
    const lenisRef = useRef(null);
    const location = useLocation();
    // Light sage tint on Miracle Natural pages so it reads as visually
    // distinct from the Leora Wellness parent site.
    const isMiracleNatural = location.pathname.startsWith('/miracle-natural');

    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobile = window.innerWidth < 1024;

        // Native scrolling on mobile/touch is faster and smoother than Lenis.
        if (isTouchDevice || isMobile) {
            ScrollTrigger.config({
                autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
            });
            return;
        }

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
        setLenisInstance(lenis);

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(lenis.raf);
            lenis.destroy();
            setLenisInstance(null);
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: isMiracleNatural
                            ? 'linear-gradient(180deg, #f6faef 0%, #eef5e2 56%, #e3edd4 100%)'
                            : 'linear-gradient(180deg, #fbf7ea 0%, #f4ecd8 56%, #ecdfc5 100%)'
                    }}
                />
                <div className="absolute inset-0 opacity-55" style={{
                    backgroundImage: isMiracleNatural
                        ? 'radial-gradient(circle at 14% 10%, rgba(79,113,84,0.24), transparent 36%), radial-gradient(circle at 86% 16%, rgba(79,113,84,0.28), transparent 32%), radial-gradient(circle at 50% 88%, rgba(113,145,119,0.2), transparent 38%)'
                        : 'radial-gradient(circle at 14% 10%, rgba(203,182,118,0.28), transparent 34%), radial-gradient(circle at 86% 16%, rgba(79,113,84,0.2), transparent 30%), radial-gradient(circle at 50% 88%, rgba(184,111,67,0.14), transparent 36%)'
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
