# Evergreen Exchange Design System

## Brand Direction

Evergreen Exchange is a B2B marketplace connecting industrial facility managers with pre-vetted environmental compliance service providers in the Pacific Northwest. The visual identity should feel like a modern, trustworthy tech platform that bridges industrial professionalism and environmental credibility. Human connection, not automation, is a core brand value.

Tone: Modern, sharp, professional. Not flashy, not sterile. Think "well-built tool" over "consumer app."

---

## Color Palette: Steel Blue + Moss

### Core Colors

| Role              | Name           | Hex       | Usage                                                        |
|-------------------|----------------|-----------|--------------------------------------------------------------|
| Primary           | Steel Blue     | #1C3144   | Headers, nav background, primary buttons, key text           |
| Secondary         | Ocean Blue     | #2B4C6F   | Secondary buttons, active states, card headers               |
| Tertiary          | Slate          | #6E8CA0   | Muted text, borders, placeholder text, disabled states       |
| Accent            | Moss Green     | #4A7C59   | CTAs, links, verified badges, success indicators, highlights |
| Accent Surface    | Sage Wash      | #E8F0E3   | Light green backgrounds for badges, tags, status chips       |
| Background        | Cloud          | #F0F4F8   | Page background                                              |
| Surface           | White          | #FFFFFF   | Cards, modals, panels, input fields                          |
| Text Dark         | Deep Navy      | #0F1D2B   | Body text, headings on light backgrounds                     |

### Extended Palette

| Role              | Name           | Hex       | Usage                                                        |
|-------------------|----------------|-----------|--------------------------------------------------------------|
| Hover Primary     | Steel Dark     | #152736   | Hover state for primary buttons                              |
| Hover Accent      | Moss Dark      | #3D6649   | Hover state for accent/CTA buttons                           |
| Focus Ring        | Sky            | #93C5FD   | Focus outlines for keyboard navigation (3px offset ring)     |
| Border Default    | Mist           | #D5DDE5   | Card borders, dividers, input borders                        |
| Border Hover      | Slate Light    | #B0C1CE   | Borders on hover                                             |
| Danger            | Brick          | #B91C1C   | Error text, destructive actions                              |
| Danger Surface    | Rose Wash      | #FEF2F2   | Error message backgrounds                                    |
| Warning           | Amber          | #D97706   | Warning indicators                                           |
| Warning Surface   | Honey Wash     | #FFFBEB   | Warning message backgrounds                                  |
| Info              | Blue           | #2563EB   | Informational badges, links in body text                     |
| Info Surface      | Ice Wash       | #EFF6FF   | Info banner backgrounds                                      |

### Contrast Reference

- Deep Navy (#0F1D2B) on Cloud (#F0F4F8): 14.8:1 (AAA)
- Steel Blue (#1C3144) on Cloud (#F0F4F8): 12.1:1 (AAA)
- Moss Green (#4A7C59) on Cloud (#F0F4F8): 5.2:1 (AA)
- Moss Green (#4A7C59) on White (#FFFFFF): 5.7:1 (AA)
- Slate (#6E8CA0) on White (#FFFFFF): 3.6:1 (AA large text only)

---

## Typography

Use two Google Fonts. One for headings, one for everything else.

| Role        | Font                  | Weight        | Usage                                        |
|-------------|-----------------------|---------------|----------------------------------------------|
| Headings    | DM Sans               | 600, 700      | Page titles, section headings, card titles   |
| Body        | Source Sans 3          | 400, 500, 600 | Body text, labels, inputs, buttons, nav      |
| Monospace   | JetBrains Mono         | 400           | Code, IDs, reference numbers, data values    |

### Type Scale

| Element         | Size   | Weight | Line Height | Color         | Letter Spacing |
|-----------------|--------|--------|-------------|---------------|----------------|
| Page title (h1) | 32px   | 700    | 1.2         | Deep Navy     | -0.02em        |
| Section (h2)    | 24px   | 600    | 1.3         | Deep Navy     | -0.01em        |
| Card title (h3) | 18px   | 600    | 1.4         | Steel Blue    | 0              |
| Subtitle (h4)   | 16px   | 600    | 1.4         | Steel Blue    | 0              |
| Body             | 15px   | 400    | 1.6         | Deep Navy     | 0              |
| Body small       | 13px   | 400    | 1.5         | Slate         | 0              |
| Label            | 13px   | 500    | 1.4         | Ocean Blue    | 0.01em         |
| Button           | 14px   | 600    | 1.0         | (varies)      | 0.01em         |
| Caption          | 12px   | 400    | 1.4         | Slate         | 0.01em         |

---

## Spacing System

Use a 4px base unit. Standard spacing tokens:

| Token | Value | Common use                        |
|-------|-------|-----------------------------------|
| xs    | 4px   | Tight gaps, icon padding          |
| sm    | 8px   | Inline spacing, compact gaps      |
| md    | 12px  | Input padding, small card padding |
| lg    | 16px  | Card padding, section gaps        |
| xl    | 24px  | Section spacing, card padding     |
| 2xl   | 32px  | Page section breaks               |
| 3xl   | 48px  | Major section spacing             |
| 4xl   | 64px  | Page-level vertical rhythm        |

---

## Border Radius

| Token   | Value | Usage                                       |
|---------|-------|---------------------------------------------|
| sm      | 4px   | Badges, small chips, inline tags            |
| md      | 6px   | Inputs, small buttons                       |
| lg      | 8px   | Cards, modals, dropdowns, standard buttons  |
| xl      | 12px  | Large cards, hero sections, panels          |
| full    | 9999px| Avatars, pills, round icon buttons          |

---

## Shadows

| Level    | Value                                       | Usage                            |
|----------|---------------------------------------------|----------------------------------|
| sm       | 0 1px 2px rgba(15, 29, 43, 0.05)           | Inputs, small elements           |
| md       | 0 2px 8px rgba(15, 29, 43, 0.08)           | Cards, dropdowns                 |
| lg       | 0 4px 16px rgba(15, 29, 43, 0.10)          | Modals, elevated panels          |
| xl       | 0 8px 32px rgba(15, 29, 43, 0.12)          | Popovers, floating elements      |

---

## Component Patterns

### Buttons

Primary (main actions):
- Background: Moss Green (#4A7C59)
- Text: White (#FFFFFF)
- Hover: Moss Dark (#3D6649)
- Border radius: lg (8px)
- Padding: 10px 20px
- Font: Source Sans 3, 14px, weight 600

Secondary (supporting actions):
- Background: transparent
- Text: Steel Blue (#1C3144)
- Border: 1px solid Mist (#D5DDE5)
- Hover border: Slate Light (#B0C1CE)
- Hover background: Cloud (#F0F4F8)

Danger (destructive actions):
- Background: Brick (#B91C1C)
- Text: White
- Hover: #991B1B

Ghost (minimal emphasis):
- Background: transparent
- Text: Moss Green (#4A7C59)
- Hover background: Sage Wash (#E8F0E3)

### Cards

- Background: White (#FFFFFF)
- Border: 1px solid Mist (#D5DDE5)
- Border radius: lg (8px)
- Padding: 24px
- Shadow: md
- Hover: Shadow lg, border transitions to Slate Light (#B0C1CE)

### Inputs

- Background: White (#FFFFFF)
- Border: 1px solid Mist (#D5DDE5)
- Border radius: md (6px)
- Padding: 10px 12px
- Font size: 15px
- Placeholder color: Slate (#6E8CA0)
- Focus: border Ocean Blue (#2B4C6F), ring 3px Sky (#93C5FD) at 40% opacity
- Error: border Brick (#B91C1C), background Rose Wash (#FEF2F2)

### Navigation

Top nav bar:
- Background: Steel Blue (#1C3144)
- Text: White, opacity 0.85 default, 1.0 on hover/active
- Active indicator: 2px bottom border, Moss Green (#4A7C59)
- Height: 56px

Sidebar (if used):
- Background: White (#FFFFFF)
- Border right: 1px solid Mist (#D5DDE5)
- Active item: background Sage Wash (#E8F0E3), text Moss Green (#4A7C59), left border 3px Moss Green
- Width: 240px

### Badges and Tags

Verified badge:
- Background: Sage Wash (#E8F0E3)
- Text: Moss Green (#4A7C59)
- Font: 12px, weight 600
- Border radius: sm (4px)
- Padding: 2px 8px

Service category tag:
- Background: Cloud (#F0F4F8)
- Text: Ocean Blue (#2B4C6F)
- Border: 1px solid Mist (#D5DDE5)
- Border radius: sm (4px)

Status indicators:
- Active: Moss Green (#4A7C59) dot + Sage Wash background
- Pending: Amber (#D97706) dot + Honey Wash background
- Error/Expired: Brick (#B91C1C) dot + Rose Wash background

### Tables

- Header background: Cloud (#F0F4F8)
- Header text: Steel Blue (#1C3144), 13px weight 600
- Row border: 1px solid Mist (#D5DDE5)
- Row hover: Cloud (#F0F4F8)
- Cell padding: 12px 16px

---

## Iconography

Use Lucide icons (https://lucide.dev). Consistent 20px size, 1.5px stroke weight. Color matches the text color of the context they sit in. Do not use filled icon variants.

---

## Transitions

Default transition for all interactive elements:
- Duration: 150ms
- Easing: ease-in-out
- Properties: color, background-color, border-color, box-shadow, opacity

Page-level transitions (route changes):
- Fade in, 200ms ease

---

## CSS Variables Template

```css
:root {
  /* Core */
  --color-primary: #1C3144;
  --color-secondary: #2B4C6F;
  --color-tertiary: #6E8CA0;
  --color-accent: #4A7C59;
  --color-accent-surface: #E8F0E3;
  --color-background: #F0F4F8;
  --color-surface: #FFFFFF;
  --color-text: #0F1D2B;

  /* Extended */
  --color-primary-hover: #152736;
  --color-accent-hover: #3D6649;
  --color-focus-ring: #93C5FD;
  --color-border: #D5DDE5;
  --color-border-hover: #B0C1CE;

  /* Semantic */
  --color-danger: #B91C1C;
  --color-danger-surface: #FEF2F2;
  --color-warning: #D97706;
  --color-warning-surface: #FFFBEB;
  --color-info: #2563EB;
  --color-info-surface: #EFF6FF;
  --color-success: #4A7C59;
  --color-success-surface: #E8F0E3;

  /* Typography */
  --font-heading: 'DM Sans', sans-serif;
  --font-body: 'Source Sans 3', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
  --space-4xl: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 29, 43, 0.05);
  --shadow-md: 0 2px 8px rgba(15, 29, 43, 0.08);
  --shadow-lg: 0 4px 16px rgba(15, 29, 43, 0.10);
  --shadow-xl: 0 8px 32px rgba(15, 29, 43, 0.12);

  /* Transitions */
  --transition-default: 150ms ease-in-out;
}
```

---

## Tailwind CSS Configuration

If using Tailwind, extend the default config with these values:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1C3144',
          hover: '#152736',
          light: '#2B4C6F',
        },
        accent: {
          DEFAULT: '#4A7C59',
          hover: '#3D6649',
          surface: '#E8F0E3',
        },
        slate: {
          custom: '#6E8CA0',
        },
        surface: '#FFFFFF',
        background: '#F0F4F8',
        border: {
          DEFAULT: '#D5DDE5',
          hover: '#B0C1CE',
        },
        text: {
          DEFAULT: '#0F1D2B',
        },
        danger: {
          DEFAULT: '#B91C1C',
          surface: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#D97706',
          surface: '#FFFBEB',
        },
        info: {
          DEFAULT: '#2563EB',
          surface: '#EFF6FF',
        },
      },
      fontFamily: {
        heading: ['"DM Sans"', 'sans-serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 29, 43, 0.05)',
        md: '0 2px 8px rgba(15, 29, 43, 0.08)',
        lg: '0 4px 16px rgba(15, 29, 43, 0.10)',
        xl: '0 8px 32px rgba(15, 29, 43, 0.12)',
      },
    },
  },
};
```

---

## Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```
