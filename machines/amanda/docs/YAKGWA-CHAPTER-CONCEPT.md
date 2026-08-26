# Yakgwa chapter concept — The Flower I Forgot

Status: narrative direction approved for exploration; cultural and culinary claims require Korean-source review before final dialogue.

## Collection identity

- Display name: Yakgwa
- Regional shelf: East Asia — Korea
- Candidate tags: Korean confection, Fried, Honeyed, Moulded, Wheat-based, Celebration, Traditional sweet
- Tag wording must be reviewed with the final research.

## Emotional premise

Yakgwa arrives polished and courteous but avoids looking at their own pattern. They remember being pressed, changed, and following a long sticky path, yet cannot remember why anyone would choose that shape for them. They worry the grooves are marks left by everything that went wrong.

Beary never tells Yakgwa what the marks mean. The player helps them follow sensory and visual memories until Yakgwa recognizes the flower form themselves.

The emotional resolution is not “hardship makes you better.” It is gentler: being shaped by an experience does not make someone damaged, and care can leave visible patterns too.

## Three clue beats

### 1. Conversation — A sweetness that lingers

Yakgwa remembers a warm golden scent and a sweetness that stayed with them. They also recall a wooden surface with repeating curves. The dialogue choices let Beary respond with curiosity, reassurance, or a playful observation; every tone progresses the story.

Clue unlocked: `golden-trace`

### 2. Minigame — Honey Trail

The tray becomes a simplified flower-groove board. The player guides a glowing honey droplet through a sequence of rounded paths, illuminating one petal at a time. Each completed petal reveals a small memory fragment: texture, scent, pattern, gathering.

Controls:

- Desktop: drag through adjacent nodes or click nodes in sequence.
- Mobile: tap adjacent nodes; dragging is optional.
- Keyboard: arrow between nodes and press Enter to confirm.
- No timer by default.
- Taking a wrong branch causes the honey to gently retreat one node, with no failure screen.

Clue unlocked: `flower-pattern`

### 3. Final deduction — Marks or pattern?

Prompt: “What was Yakgwa beginning to remember about the marks they carried?”

Conceptual choices:

- They were random cracks that needed to be hidden.
- They formed a deliberate flower-like pattern connected to how Yakgwa was shaped. (intended answer; exact factual wording pending research)
- They were directions to another shop.

Incorrect choices trigger another memory line and retry.

## Restored-memory scene

The separate curves join into a complete flower. Yakgwa sees that the pattern was never evidence that they were broken. The honey trail becomes a soft golden outline behind them, and their guarded pose opens into the joyful pose from the concept sheet.

Suggested closing line, fictional and safe to revise:

> “I kept looking at every line separately. I forgot they were making a flower.”

## Minigame art list

- Yakgwa neutral, guarded, discouraged, hopeful, and joyful sprites.
- Flower-shaped mould board.
- Six to eight large path nodes for phones.
- Golden honey droplet cursor.
- Unlit and illuminated petal-path states.
- Four abstract memory fragments; facts added only after research.
- Completed flower glow.
- Restored-memory illustration.
- Card portrait.

## Implementation note

Build Honey Trail as a reusable `pathTrace` minigame. Future chapters can reuse it for piping, syrup trails, braided dough, migration routes, or decorative patterns without reusing Yakgwa's exact cultural story.
