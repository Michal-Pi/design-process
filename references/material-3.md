# Material Design 3: Interaction States + Motion Tokens

**Stage:** 4 (Interact)
**Topic:** Material 3 interaction states model, dynamic color, motion tokens

## Summary

Material Design 3 (M3) from Google defines a systematic approach to interaction states, color,
and motion. It introduces dynamic color (Material You) and a refined states model covering all
user interactions with a component.

## Interaction States Model

Every interactive component in M3 can be in one of these states:

| State | Description | Visual Signal |
|-------|-------------|---------------|
| **Default** | Rest state, no user interaction | Base container + content colors |
| **Hovered** | Cursor over the component (desktop) | State layer at 8% opacity |
| **Focused** | Keyboard focus on component | State layer at 12% opacity + focus ring |
| **Pressed** | Active press or click | State layer at 12% opacity + ripple |
| **Dragged** | Component being dragged | State layer at 16% opacity + elevation increase |
| **Disabled** | Component not interactive | 38% opacity content, no state layers |

**State Layer:** Overlay applied on top of the container color using the `onContainer` color.
State layers provide consistent visual feedback without breaking the color system.

## Dynamic Color (Material You)

M3 introduces `colorScheme` generation from a source color (user wallpaper or brand seed):
- `primary` / `onPrimary` / `primaryContainer` / `onPrimaryContainer`
- `secondary` / `tertiary` — analogous colors for variety
- `error` / `onError` — semantic error state color pair
- `surface` / `onSurface` — neutral backgrounds + content

**For design-os Stage 4:** Use semantic color token names, never raw hex. The DTCG token layer
(Stage 5b) maps these semantic names to actual color values.

## Motion Tokens

| Token | Duration | Use |
|-------|----------|-----|
| `motion-duration-short1` | 50ms | Icon transitions, micro-interactions |
| `motion-duration-short2` | 100ms | Simple state changes (color, opacity) |
| `motion-duration-medium1` | 200ms | Component expansion, card reveal |
| `motion-duration-medium2` | 300ms | Full-screen transitions |
| `motion-duration-long1` | 450ms | Complex transitions |

Easing curves: `motion-easing-standard` (emphasized: cubic-bezier(0.2, 0, 0, 1.0)).

## Citations

Material Design 3 Documentation. Google. https://m3.material.io/
- Interaction states: https://m3.material.io/foundations/interaction/states/overview
- Dynamic color: https://m3.material.io/styles/color/dynamic-color/overview
- Motion: https://m3.material.io/styles/motion/overview
