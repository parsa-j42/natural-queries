# Natural Queries

Natural Queries turns plain-English questions into SQL against a groundwater well
database. It has two modes:

- **Playground** - type a question, get generated SQL with an explanation, and run it.
- **Story** - guided, chapter-based lessons that build up SQL skills.

The frontend is built with [Vite](https://vitejs.dev/), [React](https://react.dev/),
[TypeScript](https://www.typescriptlang.org/) and [Mantine](https://mantine.dev/).
Query generation and execution are currently mocked on the client; a real backend
will replace those calls.

## Requirements

- Node `24` (see `.nvmrc`)
- Yarn `4` (Corepack)

```sh
nvm use
yarn install
```

## Scripts

- `yarn dev` - start the dev server
- `yarn build` - type-check and build for production
- `yarn preview` - preview the production build locally
- `yarn typecheck` - run the TypeScript compiler with no emit
- `yarn lint` - run ESLint and Stylelint
- `yarn prettier` / `yarn prettier:write` - check / format with Prettier
- `yarn deploy` - build and publish to GitHub Pages
