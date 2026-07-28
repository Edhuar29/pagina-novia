# Redesign of the 3D Museum Engine

I will completely rebuild the 3D math for the museum to behave exactly like a real first-person video game. This solves all clipping, mirroring, and scaling issues permanently.

## Problem Analysis
The current glitches (giant photos, clipping, mirrored text) happen because the camera rotation and the world translation were fighting each other.
- The walls were placed randomly at `X=-1500` and `X=-500` instead of `-500` and `+500`.
- The camera was rotating around the origin `(0,0,0)` instead of the user's eye `(0,0,800)`. This caused the walls to swing like a bat and hit the camera, causing clipping.

## Proposed Changes

### 1. Fix the Wall Geometry (JS)
I will center the hallway perfectly around the camera:
- **Left Wall**: `X = -500px`.
- **Right Wall**: `X = +500px`.
- **Floor**: `Y = +500px`.
- **Ceiling**: `Y = -500px`.

### 2. Implement True First-Person Camera (JS & CSS)
I will separate rotation and translation:
- `.museum-camera` will handle rotation (`rotateY`) with `transform-origin: 50% 50% 800px`. This guarantees you rotate your head *exactly* where you stand.
- `.museum-3d-world` will handle translation (`translate3d(0, 0, currentZ)`).

### 3. Fix Painting Positions (JS)
- Left wall paintings will be placed exactly on the left wall (`X = -490px`) and facing right (`rotateY(90deg)`).
- Right wall paintings will be exactly on the right wall (`X = +490px`) and facing left (`rotateY(-90deg)`).

### 4. Adjust the Starting Position (JS)
- You will start at `currentZ = 400`. This means when you enter, the first photos are 400px in front of you (perfectly visible).
- When you click "Avanzar", you walk to `currentZ = 800`, standing right beside them.
- When you click "Izq" or "Der", you turn your head and see them perfectly flat, centered, and right reading.

## User Review Required
> [!IMPORTANT]
> Please review this plan. This is a complete structural fix that will make the museum feel like a smooth video game. If you approve, I will apply these math changes.
