'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function WebGLFluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitialized.current) return;

    const initializeFluid = () => {
      if (typeof window !== 'undefined' && (window as any).config) {
        isInitialized.current = true;
        const config = (window as any).config;

        // Black background
        config.BACK_COLOR = { r: 0, g: 0, b: 0 };
        config.TRANSPARENT = false;

        // Smooth fluid motion (Apple design principles)
        config.DENSITY_DISSIPATION = 0.97;
        config.VELOCITY_DISSIPATION = 0.98;
        config.PRESSURE = 0.8;
        config.PRESSURE_ITERATIONS = 20;
        config.CURL = 30;
        config.SPLAT_RADIUS = 0.25;
        config.SPLAT_FORCE = 6000;

        // Visual effects - neon green glow
        config.SHADING = true;
        config.COLORFUL = false; // Single color mode
        config.BLOOM = true;
        config.BLOOM_ITERATIONS = 8;
        config.BLOOM_RESOLUTION = 256;
        config.BLOOM_INTENSITY = 0.8;
        config.BLOOM_THRESHOLD = 0.6;
        config.BLOOM_SOFT_KNEE = 0.7;
        config.SUNRAYS = true;
        config.SUNRAYS_RESOLUTION = 196;
        config.SUNRAYS_WEIGHT = 1.0;

        // Resolution
        config.SIM_RESOLUTION = 128;
        config.DYE_RESOLUTION = 1024;

        // Override color generation to always use neon green
        if ((window as any).generateColor) {
          (window as any).generateColor = () => ({
            r: 0.0,
            g: 1.0,
            b: 0.16 // Neon green in RGB (0, 255, 65) normalized
          });
        }

        // Apply initial splats with neon green
        setTimeout(() => {
          if ((window as any).multipleSplats) {
            (window as any).multipleSplats(Math.floor(Math.random() * 20 + 5));
          }
        }, 100);
      }
    };

    // Try to initialize immediately
    initializeFluid();

    // Also try after a short delay in case script hasn't loaded
    const timeout = setTimeout(initializeFluid, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        className="fixed inset-0 w-full h-full pointer-events-auto"
        style={{ zIndex: 0 }}
      />
      <Script
        src="https://cdn.jsdelivr.net/gh/PavelDoGreat/WebGL-Fluid-Simulation@master/script.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Re-initialize after script loads
          if (!isInitialized.current) {
            setTimeout(() => {
              const event = new Event('load');
              window.dispatchEvent(event);
            }, 100);
          }
        }}
      />
      <Script
        src="/fluid-config.js"
        strategy="afterInteractive"
      />
    </>
  );
}
