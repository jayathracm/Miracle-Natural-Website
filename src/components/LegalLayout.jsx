import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Typography } from './ui/Typography';
import { ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const LegalLayout = ({ title, subtitle, date, sections }) => {
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const containerRef = useRef(null);
    const contentRefs = useRef([]);

    useEffect(() => {
        // Scroll To Top on Mount
        window.scrollTo(0, 0);

        const ctx = gsap.context(() => {
            // Create ScrollTriggers for each section to update active state
            sections.forEach((section, index) => {
                ScrollTrigger.create({
                    trigger: contentRefs.current[index],
                    start: 'top 30%',
                    end: 'bottom 30%',
                    onEnter: () => setActiveSection(section.id),
                    onEnterBack: () => setActiveSection(section.id),
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, [sections]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            // Offset for sticky header/spacing
            const y = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-background relative selection:bg-accent selection:text-black">

            {/* Cinematic Background */}
            <div className="fixed inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 left-[-20%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto">

                {/* Header Hero */}
                <div className="mb-12 sm:mb-16 max-w-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px w-6 bg-accent" />
                        <span className="text-accent text-[0.8rem] sm:text-[0.825rem] md:text-[0.85rem] font-medium tracking-wider uppercase">Legal Center</span>
                    </div>
                    <h1 className="text-[1.75rem] sm:text-[2.25rem] md:text-[2.75rem] font-bold mb-4 font-display tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        {title}
                    </h1>
                    <p className="text-[1.1rem] sm:text-[1.125rem] md:text-[1.15rem] text-muted-foreground leading-relaxed max-w-xl border-l-2 border-primary/30 pl-4 sm:pl-5">
                        {subtitle}
                    </p>
                    {date && (
                        <div className="mt-5 sm:mt-6 flex items-center gap-2 text-[0.8rem] sm:text-[0.825rem] md:text-[0.85rem] text-forest-300 bg-forest-950/50 inline-flex px-3 py-1.5 rounded-full border border-forest-500/20">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            Current as of {date}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

                    {/* Sticky Sidebar Navigation (Desktop) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-32 space-y-2">
                            <Typography variant="label" className="mb-6 block text-muted-foreground/60">Table of Contents</Typography>
                            <nav className="space-y-1 relative border-l pl-4" style={{ borderLeftColor: 'var(--color-border-light)' }}>
                                {/* Active Indicator Line */}
                                <div
                                    className="absolute left-0 w-[2px] bg-accent transition-all duration-300 ease-out"
                                    style={{
                                        height: '24px',
                                        top: `${sections.findIndex(s => s.id === activeSection) * 32}px` // Approximation, fine-tuned via CSS usually
                                    }}
                                />

                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`block text-left text-[0.95rem] py-1.5 transition-colors duration-200 ${activeSection === section.id
                                                ? 'text-accent font-medium translate-x-1'
                                                : ''
                                            }`}
                                        style={activeSection === section.id ? {} : { color: 'var(--color-text-tertiary)' }}
                                        onMouseEnter={(e) => { if (activeSection !== section.id) e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                                        onMouseLeave={(e) => { if (activeSection !== section.id) e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="lg:col-span-9 space-y-6 sm:space-y-8">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                id={section.id}
                                ref={el => contentRefs.current[index] = el}
                                className="scroll-mt-32"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full border border-forest-500/30 text-forest-400 text-[0.8rem] sm:text-[0.825rem] font-display">
                                        {index + 1}
                                    </span>
                                    <h2 className="text-[1.45rem] sm:text-[1.6rem] md:text-[1.75rem] font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                                        {section.title}
                                    </h2>
                                </div>

                                <div className="prose prose-lg max-w-none leading-relaxed" style={{
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    <style>{`
                                        .prose {
                                            font-size: 1.05rem;
                                        }
                                        .prose ul li::marker {
                                            color: var(--color-primary);
                                            font-weight: bold;
                                        }
                                        .prose ul li {
                                            padding-left: 0.5rem;
                                            margin-bottom: 0.5rem;
                                        }
                                        .prose ul {
                                            margin: 1rem 0;
                                        }
                                        .prose p {
                                            margin-bottom: 0.75rem;
                                        }
                                    `}</style>
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalLayout;
