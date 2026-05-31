# STRATA Portal Frontend

A modern React application for managing cloud infrastructure, built with **Vite** and **React 18**.

## Overview

The STRATA Portal is a web-based dashboard for three departments:
- **IT Dashboard**: Cloud platform, workloads, infrastructure, ticketing
- **HR Dashboard**: People management, recruitment, payroll, leave requests
- **BizOps Dashboard**: Customers, billing, revenue, pipeline

Features dark/light mode, customizable theming, and real-time data updates via live widgets.

## Architecture

```
Frontend/
├── src/
│   ├── components/        # Shared UI components, charts, layout
│   ├── pages/             # Department-specific pages
│   ├── styles/            # Global CSS
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Vite entry point
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
└── package.json
```

## Setup

### Install dependencies
```bash
npm install
```

### Development server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Build for production
```bash
npm run build
```
Output goes to `dist/`

### Preview production build
```bash
npm run preview
```

## Project Structure

### `/src/components/`
- **UI primitives**: Card, Stat, Pill, Avatar, Progress, TabBar
- **Charts**: Donut, BarChart, Sparkline, IncidentTimeline, SiteMap, SpineLeafDiagram
- **Layout**: TopBar (menu), Sidebar (nav)
- **Brand**: StrataLogo, theme system
- **Tweaks**: Settings panel with dark/light mode, accent colors, density

### `/src/pages/`
- **IT pages**: Overview, Development, Infrastructure, Workloads, Tickets, Customers
- **HR pages**: Overview, Directory, Recruitment, Leave, Payroll, Documents, Departments, OKRs
- **BizOps pages**: Overview, Customers, Billing, Invoices, Revenue, Pipeline
- **Shared**: Mail, Announcements, Helpdesk, File Sharing, HR Self-Service

### Component Props & APIs

Components use React hooks for state management. Key entry points:
- `App.jsx` - Main shell, routing, tweaks orchestration
- `TopBar` - Workspace switcher, shared services, user menu
- `Sidebar` - Department nav, active page highlighting

Live data uses `useLiveSeries()` hook for animated sparklines and charts.

## Next Steps for Backend Integration

1. **API Layer**: Create `src/api/` folder with fetch/axios utilities
2. **State Management**: Migrate from React hooks to Context API or Redux for shared state
3. **Data Fetching**: Replace hardcoded mock data with real API calls
4. **Authentication**: Add auth middleware, JWT token handling
5. **Env Configuration**: Use `.env` for API endpoints, feature flags

## Styling

Uses **CSS variables** for theming (dark/light, accent colors, density). All styles in `src/styles/index.css`.

Customizable via the Tweaks panel (floating button, bottom-right corner):
- Dark/Light mode
- 6 accent color presets + custom hex input
- Density (spacious/compact/dense)
- Sidebar style (labeled/icon-only)
- Card radius & glass blur intensity
- Logo variant (stack/prism/pulse)

## Development Notes

- React 18.3.1 with Babel-in-browser (not compiled)
- Modern CSS: CSS Grid, Flexbox, `color-mix()`, CSS variables
- Icons: Custom SVG icon library (`src/components/icons.jsx`)
- Fonts: Inter (sans) + JetBrains Mono (code)
- No external UI library — built from scratch with semantic HTML

## Contributing

When adding new components or pages:
1. Place in `src/components/` or `src/pages/`
2. Export from `src/components/index.js` or `src/pages/index.js`
3. Follow naming: `<PageName>` for pages, `<ComponentName>` for shared components
4. Use CSS variables for theming (never hardcode colors)
5. Prefer React hooks over class components
