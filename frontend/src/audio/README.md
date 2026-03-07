# Sound system

Centralized SFX via `SoundManager` and `soundRegistry`. Respects global volume/mute from `useSoundStore`.

## Usage

```ts
import { SoundManager, isRegisteredSound } from "@/audio";

// Play once (fixed pitch)
SoundManager.play("card_drop");

// Play with slight pitch variation (0.95–1.05) to avoid repetition
SoundManager.playRandomPitch("draw_card");

// Optional: only play if registered (e.g. when card type might be a sound name)
if (isRegisteredSound(cardType)) {
  SoundManager.play(cardType);
}

// Volume by category (0–1), applied on next play
SoundManager.setVolume("events", 0.8);

// Global mute/unmute (uses sound store)
SoundManager.muteAll();
SoundManager.unmuteAll();

// Stop all instances of a sound
SoundManager.stop("victory");
```

## Example: game event triggers

- **Card played:** `SoundManager.play("card_drop");`
- **Targeting a player:** `SoundManager.play("target_select");` then `SoundManager.play("target_confirm");` on confirm
- **Card effect (by type):** `SoundManager.play(cardType);` e.g. `SoundManager.play("microwave");`
- **Elimination (by effect):** `SoundManager.play("elimination_heat");` etc.
- **Round start:** `SoundManager.play("round_start");`
- **Game won:** `SoundManager.play("victory");`

## Frontend integration example

```tsx
import { SoundManager, isRegisteredSound } from "@/audio";

function GameTable({ send }) {
  function onCardPlayed(cardType: string) {
    SoundManager.play("card_drop");
    if (isRegisteredSound(cardType)) {
      SoundManager.playRandomPitch(cardType);
    }
  }

  function onPlayerEliminated(cardType?: string) {
    // Map card type to elimination sound, e.g. microwave -> elimination_heat
    const eliminationSound =
      cardType && isRegisteredSound(`elimination_${cardType}`)
        ? `elimination_${cardType}`
        : "elimination_heat";
    SoundManager.play(eliminationSound);
  }

  function onGameWon() {
    SoundManager.play("victory");
  }

  // Wire to your socket events or callbacks
  useEffect(() => {
    // e.g. when card_played event received:
    // onCardPlayed(payload.cardType);
  }, []);
}
```

## Adding new sounds

1. Add the sound to `soundRegistry.ts`: `my_sound: { category: "ui" }`.
2. Add the file at `public/sounds/ui/my_sound.mp3` (or the category subdir).
3. Call `SoundManager.play("my_sound")` or `SoundManager.playRandomPitch("my_sound")` where needed.

## Limits

- Max 4 sounds playing at once; oldest lowest-priority sound is stopped when full.
- Priority order (low → high): ui → targeting → cards → eliminations → events.
