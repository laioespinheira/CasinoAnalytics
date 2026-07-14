// Single demo-simplification flag, shared across the app. When true, the UI shows
// the pared-down CEO-pitch surface; set to false to restore the full analytical
// surface. Everything gated on this is hidden, never deleted. Committed value is
// the production value (Vercel serves the committed build as-is).
export const DEMO_MODE = true
