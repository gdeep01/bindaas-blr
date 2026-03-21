import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Akzidenz-Grotesk"', 'Barlow', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['"Akzidenz-Grotesk"', 'Barlow', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['"Linotype Didot"', 'Didot', '"GFS Didot"', '"Bodoni MT"', '"Playfair Display"', 'serif'],
      },
      fontSize: {
        // Eyebrow labels
        'eyebrow': ['0.625rem', { lineHeight: '1', letterSpacing: '0.22em', fontWeight: '900' }],
        // UI labels
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.04em', fontWeight: '500' }],
        // Body
        'body-sm': ['0.8125rem', { lineHeight: '1.6', fontWeight: '300' }],
        'body': ['0.875rem', { lineHeight: '1.6', fontWeight: '300' }],
        // Data/numbers
        'stat-sm': ['1.125rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '900' }],
        'stat-md': ['1.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
        'stat-lg': ['2rem', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '900' }],
        'stat-xl': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '900' }],
      },
      spacing: {
        // Card padding scale — use these only
        'card-xs': '0.75rem',
        'card-sm': '1rem',
        'card': '1.25rem',
        'card-lg': '1.5rem',
        // Section gaps
        'section': '2rem',
        'section-lg': '3rem',
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        info: "hsl(var(--info))",
        "traffic-low": "hsl(var(--traffic-low))",
        "traffic-moderate": "hsl(var(--traffic-moderate))",
        "traffic-high": "hsl(var(--traffic-high))",
        "traffic-severe": "hsl(var(--traffic-severe))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'card': '0.75rem',
        'card-lg': '1rem',
        'card-xl': '1.25rem',
        'badge': '0.25rem',
        'pill': '9999px',
      },
      borderWidth: {
        'subtle': '1px',
      },
      borderColor: {
        'subtle': 'rgba(255,255,255,0.06)',
        'soft': 'rgba(255,255,255,0.10)',
        'medium': 'rgba(255,255,255,0.14)',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(to bottom, #1a1a1a, #111111)',
        'card-gradient-subtle': 'linear-gradient(to bottom, #161616, #0f0f0f)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
        'glass': '0 8px 32px rgba(0,0,0,0.6)',
        'none': 'none',
      },
      transitionDuration: {
        'ui': '150ms',
        'panel': '250ms',
        'sheet': '300ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ui': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
