// Nord palette (https://www.nordtheme.com/). Kept in one place so screens reference
// named tokens instead of scattering raw hex values.
export const nord = {
  // Polar Night - dark surfaces and backgrounds
  night0: '#2e3440',
  night1: '#3b4252',
  night2: '#434c5e',
  night3: '#4c566a',

  // Snow Storm - light surfaces and text on dark
  snow0: '#d8dee9',
  snow1: '#e5e9f0',
  snow2: '#eceff4',

  // Frost - blues
  frost0: '#8fbcbb',
  frost1: '#88c0d0',
  frost2: '#81a1c1',
  frost3: '#5e81ac',

  // Aurora - accent colors
  red: '#bf616a',
  orange: '#d08770',
  yellow: '#ebcb8b',
  green: '#a3be8c',
  purple: '#b48ead',
} as const;

// Semantic tokens.
export const brand = {
  playground: nord.green, // Playground mode accent
  story: nord.purple, // Story mode accent
  accentLight: nord.frost3, // Primary interactive color in the light scheme
  accentDark: nord.orange, // Primary interactive color in the dark scheme
} as const;
