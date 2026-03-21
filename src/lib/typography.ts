// Single source of truth for all typography classes in Bindaas BLR
// Import and use these — never hardcode font/spacing classes in components

export const typography = {
  h1:          'font-serif italic font-bold text-4xl md:text-5xl text-white tracking-tight leading-none',
  h1Sub:       'font-sans text-sm md:text-base text-white/50 font-light tracking-wide mt-3',
  h2:          'font-serif italic font-bold text-2xl text-white tracking-tight',
  h3:          'font-serif italic font-bold text-xl text-white tracking-tight',
  h4:          'font-display font-black text-base text-white tracking-tight',
  eyebrow:     'font-display text-[10px] font-black tracking-[0.22em] uppercase text-white/40',
  eyebrowAccent: 'font-display text-[10px] font-black tracking-[0.22em] uppercase text-orange-400',
  label:       'font-sans text-xs font-medium text-white/40 tracking-wide',
  body:        'font-sans text-sm text-white/60 font-light leading-relaxed',
  bodyStrong:  'font-sans text-sm text-white font-medium',
  caption:     'font-sans text-xs text-white/35 font-light',
  statLarge:   'font-display font-black text-3xl text-white tracking-tighter leading-none',
  statMedium:  'font-display font-black text-2xl text-white tracking-tighter leading-none',
  statSmall:   'font-display font-black text-lg text-white tracking-tight leading-none',
  dataValue:   'font-display font-bold text-sm text-white tracking-tight',
  navLink:     'font-display font-bold text-sm tracking-tight',
  sectionTitle: 'font-serif italic font-bold text-xl text-white tracking-tight',
} as const;

export type TypographyKey = keyof typeof typography;
