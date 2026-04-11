# Design System Document: The Elite Performance Protocol

## 1. Overview & Creative North Star: "The Kinetic Lab"
This design system is engineered to transform a standard coaching utility into a high-performance laboratory. Our Creative North Star is **The Kinetic Lab**—a philosophy that merges the raw, explosive energy of the pitch with the cold, calculated precision of sports science. 

We move beyond the "template" look by rejecting traditional boxy layouts. Instead, we embrace **intentional asymmetry** and **tonal depth**. The UI should feel like a premium heads-up display (HUD) used by world-class analysts. By utilizing high-contrast typography scales and overlapping "glass" layers, we create an environment that feels fast, authoritative, and expensive.

---

## 2. Colors: Tonal Architecture
The palette is built on a foundation of "Deep Space" navy to provide a high-contrast stage for "Electric Lime" data visualizations.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through:
- **Tonal Shifts:** Placing a `surface-container-high` card on a `surface-container-low` background.
- **Strategic Spacing:** Using generous negative space to define content groupings.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Each "inner" container should utilize a higher tier of the surface scale to simulate lift.
- **Base Layer:** `surface` (#121415)
- **Primary Layout Sections:** `surface-container-low` (#1a1c1d)
- **Interactive Cards/Modules:** `surface-container-high` (#282a2b)

### The "Glass & Gradient" Rule
To escape the "flat" look, use Glassmorphism for floating overlays (e.g., player stats or tactical notes). Apply `surface_variant` at 60% opacity with a `20px` backdrop blur. 
**Signature Texture:** Primary CTAs must use a linear gradient: `primary` (#abd600) to `on-primary-container` (#708d00) at a 135-degree angle. This mimics the sheen of high-tech athletic gear.

---

## 3. Typography: Authority in Motion
We utilize two distinct typefaces to balance data-driven precision with athletic boldness.

*   **Display & Headlines (Space Grotesk):** This is our "Scientific" voice. The geometric construction feels engineered. Use `display-lg` (3.5rem) for hero stats and `headline-md` (1.75rem) for section titles. Always use tight letter-spacing (-0.02em) for headlines to increase visual impact.
*   **Body & Labels (Manrope):** This is our "Modern" utility voice. It is highly legible even at small scales. `body-md` (0.875rem) is the workhorse for coach notes, while `label-sm` (0.6875rem) in Uppercase with +0.05em tracking is reserved for technical metadata (e.g., "HEART RATE", "VELOCITY").

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "soft" for an elite athletic app. We use **Tonal Layering** and **Ambient Light** to convey hierarchy.

*   **The Layering Principle:** Instead of a drop shadow, elevate a player’s card by placing a `surface-container-highest` (#333536) element onto a `surface-dim` (#121415) background.
*   **Ambient Shadows:** For floating action buttons or modal sheets, use a shadow with a `40px` blur, `0%` spread, and `on-background` at 8% opacity. This creates a "glow" of presence rather than a muddy shadow.
*   **The "Ghost Border":** If a separation is required for accessibility, use `outline-variant` (#44474c) at **15% opacity**. This creates a "precision-milled" edge that is felt rather than seen.

---

## 5. Components

### Primary Buttons
- **Style:** Gradient fill (`primary` to `on-primary-container`), black text (`on-primary-fixed`).
- **Shape:** `DEFAULT` (0.25rem) for a sharp, aggressive feel.
- **Interaction:** On hover, apply a `primary_fixed` (#c3f400) outer glow (4px blur).

### Performance Cards
- **Style:** Never use dividers. Group content using vertical white space.
- **Structure:** Use `surface-container-low` as the card base. Use a `primary` (Electric Lime) vertical accent bar (2px width) on the left edge to indicate "Active" status.

### Data Chips
- **Selection:** `secondary-container` background with `on-secondary-container` text.
- **Action:** No background; `ghost-border` (outline-variant @ 20%) with a small `primary` dot icon for energy.

### Precision Inputs
- **Style:** "Underline" style only. Use `outline` (#8e9196) for the resting state. 
- **Focus:** The line transitions to `primary` (#abd600) with a subtle `primary_container` glow behind the text area.

### Specialty Component: The "Tactical Overlay"
A glassmorphic panel (60% `surface_variant`, blur 16px) used for real-time coaching adjustments. It should always overlap other elements to create a sense of depth and "on-the-fly" analysis.

---

## 6. Do’s and Don’ts

### Do:
- **Use High-Contrast Scales:** Pair a massive `display-lg` stat with a tiny `label-sm` technical term.
- **Embrace Asymmetry:** Align primary stats to the left and secondary metadata to the far right to create a "scanned" visual path.
- **Use "Electric Lime" Sparingly:** It is a laser, not a paint bucket. Use it for data points, CTA accents, and active states only.

### Don't:
- **No Dividers:** Never use a horizontal line to separate list items. Use a 1-step shift in surface color or `16px` of vertical space.
- **No Rounded Corners Over 12px:** Except for pill-shaped chips, keep the `roundedness` scale at `lg` (0.5rem) or lower. We want the UI to feel "sharp" and "technical," not "bubbly."
- **No Pure Black:** Always use `surface` (#121415) for the darkest areas to maintain the sophisticated navy undertone.