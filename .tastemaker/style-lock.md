# Style lock: Front Desk (platform brand)

Locked 2026-10-25 (Stone & Sage v2, supersedes the warm paper + serif lock from the same morning). Reuse these tokens for every new screen (dashboard P2, settings P3, admin). Change only when Anas asks for a new direction.

## Direction contract
- Thesis: clean clinical, calm hospitality. Tinted stone page, white surfaces, one sage accent, soft sage and sand washes so the page is never pure white.
- Picked from three mockups (A Clinic White, B Deep Green, C Stone & Sage). Anas chose C and asked for a little colour in the background.
- Mode: light only for now. The shadcn `.dark` block is untouched and not designed.

## Color contract (tokens in `src/app/globals.css`)
| Role | Token | Hex |
|---|---|---|
| Stone (page bg, Sara bubble) | `--background` | #F4F3EE |
| Surface (cards, chat column) | `--card` | #FFFFFF |
| Panel (soft blocks, secondary) | `--panel`, `--secondary` | #EAE8E1 |
| Ink (text, CTA band, send button) | `--foreground` | #1C1917 |
| Muted text | `--muted-foreground` | #57534E |
| Sage (primary, patient bubble, CTA) | `--primary` | #4F6F5C |
| Sage soft (chips, badges) | `--accent` | #E8EFEA |
| Sage deep (text on sage soft) | `--accent-foreground` | #3E5A49 |
| Sand (wash only) | `--sand` | #E9C9A8 |
| Border | `--border` | #E7E5E4 |

Checked with `tastemaker/scripts/check_contrast.py`:
- Text-safe (>= 4.5): ink on stone ~16.7, muted on stone 6.87, muted on panel 6.22, sage on stone 5.03, white on sage 5.58.
- Sand is decorative only, never text or a state signal.
- Clinic white-label accent (`clinic.branding.accent`) replaces `--primary` inside the chat only. Not contrast-checked yet; P3 settings must check it against white before saving.

## Type
- All sans. Manrope for Latin (headlines 800, tracking -0.03 to -0.04em), Readex Pro for Arabic, IBM Plex Mono for times, prices and small labels.
- Stack order: Manrope first, Readex second. `--font-sans` names the real families, not the next/font variables, because next/font always adds an Arial "Manrope Fallback" face with no unicode-range that would catch Arabic.
- Labels: mono 11px uppercase, tracking 0.08em, muted.

## Shape
- Bubbles `rounded-[18px]` with one small corner (`rounded-bl-md` Sara, `rounded-br-md` patient). Cards `rounded-2xl` or `rounded-[22px]`. Big blocks `rounded-[36px]`. Buttons and inputs are pills.
- Shadows only soft and low: `0 20px 40px -24px rgb(28 25 23 / 0.3)`.

## Background
- `.wash`: blurred sage circle top-left and sand circle right. `.wash-soft` for quieter pages (chat, dark CTA).
- `.dots`: 22px dot grid with a radial mask, hero only.

## Motion
- Enter 200-240ms ease-out (`EASE_OUT`), reveals 400ms with `amount: 0.2`. `.drift` 6s float on the hero product only.
- Every animation respects reduced motion.
