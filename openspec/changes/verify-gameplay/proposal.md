# Verify gameplay

## Why
The save endpoint accepts browser-reported scores. A bounded score does not establish a valid run.

## What Changes
- Issue expiring random-seeded runs and replay ordered gameplay events using shared rules.
- Validate checkpoint timing, pause state, progression, death and atomic single-use finalization.
- Publish only server-calculated new scores; mark existing scores as legacy without deleting them.
- Preserve responsive local gameplay and offline forks. Retire the old unverified write path after cutover.

## Impact
Game runtime, leaderboard, new Edge Function, private run-state table and transactional RPCs. Replays prove rule consistency, not human input; bots remain possible.
