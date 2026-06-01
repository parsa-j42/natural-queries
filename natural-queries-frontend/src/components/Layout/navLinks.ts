// Single source for the primary nav, shared by the desktop header and the mobile drawer.
export interface NavLink {
  label: string;
  to: string;
  // Path prefix used to decide whether the link is active.
  match: string;
}

export const navLinks: NavLink[] = [
  { label: 'Playground Mode', to: '/playground', match: '/playground' },
  { label: 'Story Mode', to: '/story', match: '/story' },
];
