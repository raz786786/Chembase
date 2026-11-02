# Cross-Device Responsive & Site-Wide Minimal-Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ChemBase Pro into an ultra-clean, minimal-text, fully responsive platform across all screen sizes (Phone, Tablet, Laptop, Desktop PC) by eliminating text-heavy clutter, establishing dynamic 100dvh viewport bounds, adding an ergonomic mobile dock, and converting 27+ modules into punchy, interactive workbenches.

**Architecture:** Implement a 4-tier responsive layout system (Phone `<768px`, Tablet `768-1024px`, Laptop `1024-1440px`, Desktop `1440px+`) with `100dvh` dynamic height and `overflow-x-clip` root bounds. Pair a slim elevated desktop header with an ergonomic fixed mobile thumb dock. Enforce a site-wide minimal-text diet across all pages and modules by replacing explanatory paragraphs with 1-line headlines, metric badges, and progressive disclosure `(ℹ️)`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, KaTeX, Sonner.

**Spec:** [`docs/superpowers/specs/2026-11-03-cross-device-responsive-minimal-text-redesign.md`](file:///docs/superpowers/specs/2026-11-03-cross-device-responsive-minimal-text-redesign.md)

## Global Constraints
- Target Scope: Entire ChemBase Pro Frontend (`frontend/src/`).
- Zero Horizontal Blowout: No component or page may cause horizontal scrollbar on root window at 320px, 375px, 768px, 1024px, 1440px, or 1920px.
- Minimal Text Standard: Preambles and multi-sentence explanatory paragraphs are replaced with 1-line punchy labels and metric chips.
- Touch Target Floor: Minimum $44 \times 44\text{px}$ touch targets on all interactive buttons, pills, and dropdowns.
- Dynamic Viewport: All full-height containers use `min-h-[100dvh]` to handle mobile address bars.
- Zero Loss of Engineering Accuracy: Calculations, formulas, inputs, outputs, and verified solver pipelines remain fully functional.

## Review Focus
1. **Mobile Bottom Dock Overlap**: Content at the bottom of long pages must not be hidden behind the sticky bottom dock on phones (`pb-20 md:pb-6` on main container).
2. **Wide Table & Formula Clipping**: Equations and multi-column tables must touch-scroll horizontally (`overflow-x-auto touch-pan-x`) without stretching the parent container.
3. **Periodic Table Mobile Experience**: 18-column grid on phones must either horizontally scroll cleanly or toggle to an accessible categorized mobile list view.
4. **Desktop High-Resolution Scaling**: Ultra-wide 1440px+ screens must respect `max-w-7xl` boundaries so cards and text do not stretch awkwardly.
5. **Progressive Disclosure Access**: Essential engineering assumptions or instructions tucked behind info buttons `(ℹ️)` must be reachable in 1 click/tap without blocking computation.

---

### Task 1: Global Viewport, Responsive CSS Utilities & Mobile Floating Bottom Dock

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.tsx:485-780`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Global CSS utilities (`.touch-scroll-x`, `.btn-tactile`, `safe-bottom-dock`), mobile floating dock component in `App.tsx` active on screens `< 768px`.
- Consumes: Lucide icons (`Home`, `GraduationCap`, `FlaskConical`, `Calculator`, `Search`), React Router `NavLink`.

- [ ] **Step 1: Add mobile responsive utilities to index.css**
Update `frontend/src/index.css` with touch scrolling, safe area padding, and dynamic viewport classes:
```css
/* Dynamic viewport & touch helpers */
.touch-scroll-x {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.touch-scroll-x::-webkit-scrollbar {
  height: 4px;
}
.touch-scroll-x::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 9999px;
}
.safe-bottom-pb {
  padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
}
```

- [ ] **Step 2: Add ergonomic mobile bottom thumb dock to App.tsx**
In `frontend/src/App.tsx`, render the fixed bottom bar visible strictly on `< 768px` (`md:hidden`), with direct links to `Home`, `Tutor`, `Compounds`, `Engineering Hub`, and `Search (Palette)`:
```tsx
{/* Mobile Bottom Thumb Dock (< 768px) */}
<div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-50/95 dark:bg-surface-950/95 backdrop-blur-xl border-t border-surface-200/60 dark:border-surface-800/60 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-bottom-pb">
  <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-surface-500'}`}>
    <Home className="w-5 h-5" />
    <span className="text-[10px]">Home</span>
  </NavLink>
  <NavLink to="/tutor" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-surface-500'}`}>
    <GraduationCap className="w-5 h-5" />
    <span className="text-[10px]">AI Tutor</span>
  </NavLink>
  <NavLink to="/compounds" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-surface-500'}`}>
    <TestTube2 className="w-5 h-5" />
    <span className="text-[10px]">Compounds</span>
  </NavLink>
  <NavLink to="/advanced" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-surface-500'}`}>
    <LayoutGrid className="w-5 h-5" />
    <span className="text-[10px]">Eng Hub</span>
  </NavLink>
  <button onClick={() => setIsPaletteOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-surface-500">
    <Search className="w-5 h-5" />
    <span className="text-[10px]">Search</span>
  </button>
</div>
```
Ensure main element has `pb-24 md:pb-8` so content never gets covered.

- [ ] **Step 3: Run build to verify compilation**
Run: `npm run build` from `frontend` directory.
Expected: Build passes with exit code 0.

- [ ] **Step 4: Commit changes**
```bash
git add frontend/src/index.css frontend/src/App.tsx
git commit -m "feat(nav): add mobile bottom thumb dock and dynamic viewport classes"
```

---

### Task 2: Minimal-Text & Responsive HomePage Transformation

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Minimalist HomePage with punchy 1-line headline, direct action buttons, 4 compact KPI cards, clean live status pills, and zero essay paragraphs.
- Consumes: `api.getElements`, `api.getCompounds`, `api.getStats`.

- [ ] **Step 1: Simplify hero section**
Replace 3-paragraph enterprise marketing copy with:
- Headline: `Chemical Analysis & Process Engineering`
- Single subtitle: `Interactive solvers, thermodynamic engines & stoichiometry database.`
- Action Pills: `[⚡ AI GRUCA Solver]` `[🧪 Compound Finder]` `[⚙️ 27+ Solvers]`
- Responsive search bar input embedded directly into hero.

- [ ] **Step 2: Streamline KPI stat cards**
Make KPI cards compact, responsive (`grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`):
- `Elements`: count + `[Verified]` chip
- `Compounds`: count + `[Live Sync]` chip
- `Recent`: count + `[Query Bank]` chip
- `Substances`: count + `[Total]` chip
Remove redundant explanatory sentences.

- [ ] **Step 3: Streamline infrastructure and recent searches cards**
Convert platform architecture sidebar to 3 compact status badges (`SQLite Engine`, `PubChem API`, `Materials Project`).
Simplify recent searches list into responsive clickable element-pill cards with zero verbose filler.

- [ ] **Step 4: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "refactor(home): streamline hero to minimal text and optimize for all screen sizes"
```

---

### Task 3: Minimal-Text & Responsive Tutor Page Transformation

**Files:**
- Modify: `frontend/src/pages/TutorPage.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Lean, high-productivity Tutor solver layout with compact GRUCA badges, responsive input/results split, and clean 4-step architecture footer.

- [ ] **Step 1: Trim header & GRUCA methodology strip**
- Shorten title area: Replace multi-sentence intro with a compact header + `[Multi-AI Verified]` badge.
- Convert 7 GRUCA steps (`Given`, `Required`, `Assumptions`, `Equations`, `Calculations`, `Units`, `Answer`) into a horizontal touch-scrollable chip bar with step letters (`G`, `R`, `A`, `E`, `C`, `U`, `A`).
- Hide redundant multi-line description text on small screens.

- [ ] **Step 2: Responsive input card & example chips**
- Optimize textarea with `min-h-[120px] sm:min-h-[160px]`.
- Convert example problems dropdown to compact horizontal carousel of pill chips (`[Pump Power]` `[LMTD HX]` `[CSTR Sizing]` `[Diffusion]` `[Distillation]`).
- Quick follow-up buttons rendered as responsive 1-line chips.

- [ ] **Step 3: Simplify footer explanation**
Replace the 4 lengthy architecture paragraphs with a compact 4-stage icon workflow:
`[1. Extract] → [2. Parallel Solve] → [3. SymPy Compute] → [4. Sanity Audit]`

- [ ] **Step 4: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/TutorPage.tsx
git commit -m "refactor(tutor): apply minimal text diet and responsive chip layout"
```

---

### Task 4: Responsive Dual-Mode (Grid & Search List) & Minimal-Text Periodic Table

**Files:**
- Modify: `frontend/src/pages/PeriodicTablePage.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Adaptive Periodic Table supporting both 18-column standard grid (with horizontal touch-scroll on desktop/tablet) and an ergonomic mobile List/Search View (`< 768px`) with category filter chips.

- [ ] **Step 1: Add view mode switch for mobile screens**
Add state: `const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')`.
On screens `< 768px`, show segmented toggle: `[Grid View] [List View]`.

- [ ] **Step 2: Enhance mobile horizontal scroll for 18-column grid**
Wrap grid in `<div className="overflow-x-auto touch-pan-x pb-4 scrollbar-thin">` with `min-w-[780px] sm:min-w-[1000px]`, and add a swipe hint on small screens (`← Swipe horizontally to explore all 18 groups →`).

- [ ] **Step 3: Build compact mobile List / Search View**
When `viewMode === 'list'`, render elements as high-density interactive cards sorted by atomic number with instant search input:
`[Atomic #] [Symbol] [Name] [Molar Mass] [Category Badge]`.

- [ ] **Step 4: Trim text and simplify category filters**
Replace verbose explanation with concise colored dot filter chips.
Ensure all element tiles have touch targets and clean transitions.

- [ ] **Step 5: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/PeriodicTablePage.tsx
git commit -m "feat(periodic-table): add responsive mobile list view and compact filter chips"
```

---

### Task 5: Minimal-Text & Responsive Compounds & Reactions Pages

**Files:**
- Modify: `frontend/src/pages/CompoundsPage.tsx`
- Modify: `frontend/src/pages/ReactionsPage.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Minimal-text, responsive compound and reaction card directories with high visual density and fast searching.

- [ ] **Step 1: Streamline CompoundsPage header and cards**
- Remove subtitle paragraphs; use a clean header with search input.
- Layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
- Cards: Bold formula + common name + molar mass chip + hazard tag. Remove empty spacer divs and verbose text.

- [ ] **Step 2: Streamline ReactionsPage header and cards**
- Replace multi-line header with title + search + reaction type filters (`Combustion`, `Acid-Base`, `Redox`, `Organic`).
- Cards: Clean reaction equation display + conditions chip + enthalpy change badge ($\Delta H$).

- [ ] **Step 3: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/CompoundsPage.tsx frontend/src/pages/ReactionsPage.tsx
git commit -m "refactor(compounds,reactions): streamline card typography and responsive grid layout"
```

---

### Task 6: Responsive Navigation Shell & Minimal-Text Console for Engineering Hub

**Files:**
- Modify: `frontend/src/pages/advanced/AdvancedDashboard.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Responsive Engineering Hub layout with dynamic `min-h-[100dvh]`, horizontal swipe pill carousel on mobile, 1-line breadcrumbs, and ultra-compact category/module cards.

- [ ] **Step 1: Fix mobile container heights and margins**
In `AdvancedDashboard.tsx`, replace `h-[calc(100vh-64px)]` with `min-h-[calc(100dvh-64px)]` and remove asymmetric negative margins on small screens (`-m-4 sm:-m-6 lg:-m-8` -> `m-0 lg:-m-8`).
Add horizontal swipe carousel for active sub-modules on mobile screens.

- [ ] **Step 2: Streamline Dashboard landing category cards**
In `MAIN_CATEGORIES` and `ALL_DASHBOARD_CARDS`:
- Replace 3-line descriptive sentences with concise, punchy 1-line tags (e.g. `Moody Chart, Reynolds & Darcy-Weisbach` instead of 40-word summaries).
- Display compact tool count badges (`[6 Tools]`, `[5 Solvers]`).

- [ ] **Step 3: Add breadcrumb navigation with 1-tap backstep**
At the top of the main workbench area, render a mini breadcrumb:
`[Engineering Hub] → [Category] → [Active Module]` for effortless navigation across all screen sizes.

- [ ] **Step 4: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/advanced/AdvancedDashboard.tsx
git commit -m "refactor(dashboard): add dynamic dvh layout, breadcrumb bar, and minimal card tags"
```

---

### Task 7: Minimal-Text Diet & Mobile Touch Adaptation for Core Subject Modules

**Files:**
- Modify: `frontend/src/pages/advanced/ThermodynamicsModule.tsx`
- Modify: `frontend/src/pages/advanced/FluidMechanicsModule.tsx`
- Modify: `frontend/src/pages/advanced/HeatTransferModule.tsx`
- Modify: `frontend/src/pages/advanced/ReactionEngModule.tsx`
- Modify: `frontend/src/pages/advanced/MassTransferModule.tsx`
- Modify: `frontend/src/pages/advanced/CalculatorsHub.tsx`
- Modify: `frontend/src/pages/advanced/MathChemistryModule.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Clean, uncluttered engineering workbenches across the 7 core technical calculation modules with responsive input grids and minimal copy.

- [ ] **Step 1: Thermodynamics & Fluid Mechanics Minimalist Workbench**
- Strip long background paragraphs.
- Put sub-tools inside a horizontal touch carousel on mobile.
- Make parameter inputs 2-column on mobile (`grid-cols-1 sm:grid-cols-2`), with instant result cards below.

- [ ] **Step 2: Heat Transfer, Reaction Eng & Mass Transfer Streamlining**
- Remove essay preambles from LMTD, NTU, CSTR, PFR, and McCabe-Thiele tools.
- Add concise badge chips for formulas and units.
- Ensure all diagrams and SVG charts scale fluidly with `w-full h-auto max-h-[360px]`.

- [ ] **Step 3: Calculators Hub & Math Chemistry Optimization**
- Clean up card grids into responsive, compact calculator widgets.
- Add progressive disclosure `(ℹ️)` popover for equation references instead of large static text blocks.

- [ ] **Step 4: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/advanced/ThermodynamicsModule.tsx frontend/src/pages/advanced/FluidMechanicsModule.tsx frontend/src/pages/advanced/HeatTransferModule.tsx frontend/src/pages/advanced/ReactionEngModule.tsx frontend/src/pages/advanced/MassTransferModule.tsx frontend/src/pages/advanced/CalculatorsHub.tsx frontend/src/pages/advanced/MathChemistryModule.tsx
git commit -m "refactor(modules): strip text preambles and make calculation workbenches mobile responsive"
```

---

### Task 8: Minimal-Text Diet & Responsive Workflow for Career Hub, FYP, Academic Hub & Industry

**Files:**
- Modify: `frontend/src/pages/advanced/CareerHubModule.tsx`
- Modify: `frontend/src/pages/advanced/FypModule.tsx`
- Modify: `frontend/src/pages/advanced/AcademicHubModule.tsx`
- Modify: `frontend/src/pages/advanced/industry/IndustryModule.tsx`
- Test: Build verification with `npm run build`

**Interfaces:**
- Produces: Clean, responsive user journeys for career and academic workflows with concise instructions, compact step bars, and zero wall-of-text fatigue.

- [ ] **Step 1: Career Hub CV Builder & Interview Simulator**
- Shorten step instructions into clean numeric badges (`1. Details`, `2. Target`, `3. Style`, `4. Preview`).
- Replace long instructional paragraphs with concise bullet tooltips.
- On mobile, stack CV form and preview tabbed rather than squishing side-by-side.

- [ ] **Step 2: FYP Module & Academic Hub**
- FYP: Idea bank with compact industry filter pills, concise problem canvas, and touch-scrollable timeline.
- Academic Hub: Compact study planner and flashcard deck with responsive flip interactions.

- [ ] **Step 3: Industry Knowledge Module**
- Compress multi-paragraph industry overviews into interactive process flow diagrams and concise equipment specs.

- [ ] **Step 4: Verify build and commit**
Run: `npm run build`
```bash
git add frontend/src/pages/advanced/CareerHubModule.tsx frontend/src/pages/advanced/FypModule.tsx frontend/src/pages/advanced/AcademicHubModule.tsx frontend/src/pages/advanced/industry/IndustryModule.tsx
git commit -m "refactor(career,fyp,academic,industry): streamline text and optimize multi-step workflows for mobile"
```

---

### Task 9: Cross-Device Verification, Build Integrity & Regression Testing

**Files:**
- Test: `frontend` build via `npm run build`
- Test: Mobile breakpoint responsiveness check (simulated viewport tests)
- Documentation: Create walkthrough artifact

**Interfaces:**
- Verifies: Full application compiles with 0 errors, no horizontal blowouts, and clean rendering across Phone, Tablet, Laptop, and PC.

- [ ] **Step 1: Run production TypeScript and Vite build**
Execute `npm run build` from `frontend` directory. Verify 0 TypeScript errors and clean bundle output.

- [ ] **Step 2: Verify zero horizontal overflow on mobile viewports**
Check that document root and major module pages have `overflow-x-clip` and no horizontal scrolling on 375px phone resolution.

- [ ] **Step 3: Verify text reduction across pages**
Confirm preambles and wall-of-text blocks have been replaced with compact titles, metric chips, and progressive disclosure icons.

- [ ] **Step 4: Create walkthrough artifact and commit**
```bash
git add -A
git commit -m "chore: complete cross-device responsiveness and minimal-text transformation"
```
