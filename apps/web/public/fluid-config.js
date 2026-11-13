// WebGL Fluid Simulation Configuration for Neon Green Theme
(function() {
  'use strict';

  // Wait for the main script to load
  window.addEventListener('load', function() {
    // Override default colors with neon green
    if (typeof window.config !== 'undefined') {
      const config = window.config;

      // Background
      config.BACK_COLOR = { r: 0, g: 0, b: 0 };

      // Fluid behavior (Apple-style smooth motion)
      config.DENSITY_DISSIPATION = 0.97;
      config.VELOCITY_DISSIPATION = 0.98;
      config.PRESSURE = 0.8;
      config.CURL = 30;
      config.SPLAT_RADIUS = 0.25;
      config.SPLAT_FORCE = 6000;

      // Visual effects
      config.SHADING = true;
      config.COLORFUL = false; // Use single color
      config.BLOOM = true;
      config.BLOOM_INTENSITY = 0.8;
      config.BLOOM_THRESHOLD = 0.6;
      config.SUNRAYS = true;
      config.SUNRAYS_WEIGHT = 1.0;

      // Resolution for performance
      config.SIM_RESOLUTION = 128;
      config.DYE_RESOLUTION = 1024;
    }

    // Override splat color to neon green
    if (typeof window.splatStack !== 'undefined') {
      const originalAddSplat = window.multipleSplats;
      window.multipleSplats = function(amount) {
        for (let i = 0; i < amount; i++) {
          const color = {
            r: 0.0,
            g: 1.0,
            b: 0.25
          };

          const x = Math.random();
          const y = Math.random();
          const dx = 1000 * (Math.random() - 0.5);
          const dy = 1000 * (Math.random() - 0.5);

          if (typeof window.splat === 'function') {
            window.splat(x, y, dx, dy, color);
          }
        }
      };
    }

    // Force neon green color for mouse interactions
    if (typeof window.pointerPrototype !== 'undefined') {
      const originalDown = window.pointerPrototype.down;
      window.pointerPrototype.down = function() {
        this.color = {
          r: 0.0,
          g: 1.0,
          b: 0.25
        };
        originalDown.call(this);
      };
    }
  });

  // Inject neon green color scheme immediately
  const observer = new MutationObserver(function(mutations) {
    if (typeof window.config !== 'undefined') {
      // Override color generation
      if (typeof window.generateColor !== 'undefined') {
        window.generateColor = function() {
          const c = {
            r: 0.0,
            g: 1.0,
            b: 0.25
          };
          return c;
        };
      }

      // Stop observing once configured
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
