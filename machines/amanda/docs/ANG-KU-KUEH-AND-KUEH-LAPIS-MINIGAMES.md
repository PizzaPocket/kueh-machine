# Ang Ku Kueh and Kueh Lapis minigames

## Scope

Implement only these two minigames. Do not add later characters, the full collection flow, or new chapter systems as part of this task. Both games should run inside the existing tray presentation and follow the approved Ondeh-Ondeh vertical slice for scene transitions, dialogue, pause and resume behavior, sound settings, and success flow.

The new source sheets are:

- `assets/minigames/ang-ku-kueh-restore-pattern/asset-sheet-v1.png`
- `assets/minigames/ang-ku-kueh-restore-pattern/mould-top-down-v1.png`
- `assets/minigames/ang-ku-kueh-restore-pattern/mould-top-down-v4-fat-cavity.png`
- `assets/minigames/ang-ku-kueh-restore-pattern/pattern-pieces-exact-v2.png`
- `assets/minigames/ang-ku-kueh-restore-pattern/pattern-pieces-angled-v4.png`
- `assets/minigames/kueh-lapis-build-layers/asset-sheet-v1.png`

Both are true transparent PNGs. Crop the separated objects into individual transparent files before wiring the interactions. Do not use CSS background removal or ship the whole source sheet as a visible game image.

The repaired transparent Ang Ku Kueh worried expression is:

- `assets/characters/ang-ku-kueh/dialogue/worried-v1.png`

Do not alter the original character artwork or existing Ondeh-Ondeh minigame while implementing these chapters.

## Shared presentation and controls

- Use the current tray artwork as the minigame background. The source sheets contain game pieces only.
- Keep gameplay within the tray's safe central area. Avoid the bear paws and outer rim.
- All instructions and buttons must be live HTML text. Do not bake words into images.
- Support mouse, touch, and keyboard.
- Give interactive targets a minimum 44 by 44 CSS pixel hit area.
- Do not rely on color alone. Selected pieces need an outline, lift, and small scale change.
- Never punish mistakes with lives, timers, or chapter resets.
- Save progress after every successful placement or layer. On resume, rebuild the exact completed state.
- Respect reduced-motion settings. Replace shake, swirl, and bounce with a simple opacity change when reduced motion is enabled.
- The close control pauses and returns to the customer scene. Reopening the minigame continues from the saved step.
- Keep the completion effect short, approximately 1.2 seconds, before moving to the remembering dialogue and unlocked card sequence.

## Ang Ku Kueh: Restore the Pattern

### Emotional purpose

Ang Ku Kueh remembers that its pattern was pressed with care, but the pattern itself feels incomplete. Beary helps restore the seven parts of the moulded design. The action should feel gentle and deliberate, not like a timed jigsaw.

### Start layout

- Place the top-down wooden mould in the center of the tray.
- Use the corrected handled top-down mould stored at `mould-top-down-v1.png`. The same asset is retained as `mould-top-down-v4-fat-cavity.png` for version tracking. Keep the handle visible below the oval play area.
- Begin with the pale blank Ang Ku Kueh base outside the mould. The player's first action is to place the blank base into the mould's inner cavity.
- The mould cavity and blank base now share the same broad, rounded oval proportion. Scale the blank base uniformly until it sits completely inside the recessed cavity with a small, even clearance on every side. Preserve its aspect ratio. Do not stretch its width or height independently.
- Show seven recessed pattern slots on the base: six outer sections and one large centre section.
- Arrange the seven raised pattern pieces around the base, keeping the centre piece visually distinct in the picker.
- On narrow mobile screens, place the base in the upper part of the usable tray and show the pieces in a two-row horizontal picker below it.
- Show a small `See pattern` control. While pressed or focused, fade in the guide silhouette. Hide it on release or blur.
- The wooden mould is part of the play area, not a decorative title object. It remains fixed while the blank base and pattern pieces are placed into it.

### Interaction

First place `base-blank` into the top-down mould. After it locks into the cavity, reveal the six outer pieces from `pattern-pieces-angled-v4.png` plus `piece-centre-v1.png`. Do not use the older loose outer pieces from `asset-sheet-v1.png` or `pattern-pieces-exact-v2.png`. The middle-left and middle-right pieces have straight blunt ends set on diagonal angles matching the slot joins. They must not have pointed tips or horizontal ends. Use seven pieces with fixed orientation. Do not require rotation.

Desktop:

1. The player may drag a piece to its matching slot, or click a piece and then click a slot.
2. A selected piece lifts slightly and receives a warm cream outline.
3. A compatible slot gains a soft glow when the piece approaches it.

Mobile:

1. Tap a piece to select it.
2. Tap the matching slot to place it.
3. Dragging can remain supported, but tap-to-place is the primary interaction.

Keyboard:

1. Tab to a piece and press Enter or Space to select it.
2. Tab to a slot and press Enter or Space to place it.
3. Give each piece and slot a clear accessible name such as `upper left pattern piece` and `upper left pattern space`.

### Rules and feedback

- Correct placement: lock the piece, play a small star burst, and update progress.
- Incorrect placement: return the piece to its origin and play two gentle wobble movements. Do not use a red error flash or negative sound.
- Reveal a short memory dialogue beat after pieces 2 and 4. Keep each beat to one or two lines, then return to the same saved board.
- When all seven pieces are placed, reveal the complete pattern, pulse the golden ring once, and scatter the small stars.
- Continue to Ang Ku Kueh's remembering expression and final dialogue after the success effect.

### State model

Recommended states:

`intro`, `playing`, `memoryBeatOne`, `memoryBeatTwo`, `completeEffect`, `complete`

Persist:

- IDs of locked pieces
- Whether each memory beat has been viewed
- Completion status

### Suggested copy

Title: `Restore the Pattern`

Instruction: `Fit each piece into the pattern Ang Ku Kueh is trying to remember.`

Progress: `Pattern pieces: 0 of 7`

Hint control: `See pattern`

Completion: `The whole pattern feels familiar again!`

## Kueh Lapis: Build the Layers

### Emotional purpose

Kueh Lapis remembers being made one careful layer at a time. The minigame should express patience and rhythm. It is not a speed challenge and should not become a difficult precision task on mobile.

### Core loop

The player builds 8 thin layers, alternating toasted brown and warm ivory. The game selects the alternating batter automatically so the player can focus on pouring each layer carefully.

1. Tap the pour control to start the moving indicator.
2. Tap it again when the indicator enters the calm target area.

The sequence begins with brown, then alternates after every successful layer. A stop near the centre of the calm zone creates a longer layer. A stop near either edge creates a slightly shorter layer.

### Start layout

- Center the low cake base near the lower half of the tray.
- Show the automatically selected brown or ivory batter above the play area.
- Place the tilted pouring spoon above the cake and align the batter flow with the spoon cavity.
- Place a simple horizontal thickness meter close to the cake. Build this meter in HTML and CSS, not as an image.
- Clearly show the next required color using a ghost layer, a pattern label, and accessible text.

### Interaction

1. The game automatically selects the next alternating batter colour.
2. The player taps the pour control to start the thickness indicator.
3. The indicator travels continuously in both directions, bouncing at each end of the meter.
4. The player taps the control again inside the broad target area to place and lock the layer.
5. Stopping outside the target area briefly shows the matching uneven layer, then offers `Try this layer again`.

The target area should occupy about 40 percent of the meter. The indicator should take about 2.5 seconds to cross the full meter. Do not make the target smaller as the game progresses.

For keyboard control, the first Enter or Space activation starts pouring and the second stops it.

### Rules and feedback

- Good layer: settle the strip into place, add one small sparkle, and increment progress.
- Uneven layer: show the appropriate wavy strip for about 700 milliseconds, then return to the same step. No lives are lost.
- Reveal a short memory dialogue beat after layer 4. Resume from the saved stack afterward.
- After layer 8, settle the finished stack, add the golden glow and stars, then continue to Kueh Lapis's remembering expression and final dialogue.

### State model

Recommended states:

`intro`, `ready`, `spreading`, `retryLayer`, `memoryBeatOne`, `completeEffect`, `complete`

Persist:

- Number of completed layers
- Expected next color
- Whether each memory beat has been viewed
- Completion status

### Suggested copy

Title: `Build the Layers`

Instruction: `Alternate the batters and spread each thin layer with care.`

Progress: `Layers: 0 of 8`

Spread control: `Press and hold to spread`

Retry: `Almost. Let's make this layer a little more even.`

Completion: `Every careful layer has found its place!`

## Approval boundary

First implement a functional desktop and mobile draft of these two games using the supplied assets. Stop after both can be played through and resumed correctly. Do not proceed to additional minigames or chapters until the interactions, pacing, art scale, and difficulty have been reviewed.
