# Luk Chup trio character concept

## Status

Approved base direction for character development. This chapter should not be implemented until the current three chapters are approved.

The emotional narrative is fictional. Historical and cultural details must be researched and verified before publication.

## Character design

Luk Chup appears as one customer made up of three tiny fruit-shaped sweets who always enter together:

- Mango: a tall golden yellow mango shape who usually speaks first
- Mangosteen: a small deep purple mangosteen shape who notices quiet details
- Mandarin: a small warm orange mandarin shape who reacts quickly and openly

All three must share the same strong glossy coating. Use large curved white highlights, translucent shine and a slightly oily glutinous finish so they read as handmade coated sweets rather than ordinary fruit.

Keep the trio close together in every dialogue sprite. They are one collectible character and one chapter, not three separate customers or cards.

Base sprite:

- `assets/characters/luk-chup/dialogue/neutral-v1.png`

Future production sprites should follow the standard five states:

- `neutral`
- `worried`
- `thinking`
- `happy`
- `remembering`

Each state must remain a square transparent PNG with consistent scale, spacing and group proportions.

## Region and tags

- `Thailand`
- `Luk Chup`
- `Glossy`

## Chapter title

Different Shapes, One Beginning

## Arrival

Three tiny fruits squeeze through the cafe door together. Mango walks in first, Mangosteen holds onto Mango's arm and Mandarin rushes to catch up.

They introduce themselves as an orchard, but their memories do not quite agree. Mango remembers being shaped by careful fingers. Mangosteen remembers a tiny brush. Mandarin remembers a clear, shining coat. None of those memories sounds like growing on a tree.

The trio worries that discovering the truth might separate them. If they were made in different shapes, perhaps they were never really meant to belong together.

## Story direction

Beary helps the trio compare what they remember beneath their different colours. Each one recalls the same soft centre, the same careful shaping and the same gleaming finish.

Their fruit forms are individual and worth celebrating, but those forms do not make them strangers. They were created as an assortment. Being different was part of how they belonged together from the beginning.

The restored memory is not that the trio must always agree or move as one. It is that a shared origin can hold several distinct personalities without making any of them less real.

## Minigame concept

### Shape, Paint, Shine

The player restores one memory stage for each member of the trio:

1. Match each soft sweet base to the mango, mangosteen or mandarin silhouette.
2. Apply the correct colour using simple visual clues.
3. Sweep a clear glaze across each finished sweet until the highlights connect smoothly.

The final step brings all three onto the tray together. Their glossy highlights catch the same warm cafe light, revealing that they belong to one assortment.

Keep this gentle and tactile. Do not make the player paint detailed shapes with pixel precision. On mobile, use tap-to-select and broad swipe areas.

## Restored line

> We do not need to look alike to know we belong together. We were made to bring different colours to the same little tray.

## Short card story

> Mango, Mangosteen and Mandarin arrived believing they were three lost fruits. Beneath their different shapes and colours, they discovered the same softly made centre and gleaming finish. Their differences were never a reason to separate. They were part of one bright assortment from the beginning.

## Full story

The cafe door opened just wide enough for a golden mango, a purple mangosteen and a bright mandarin to tumble through together.

Mango introduced the group as a tiny orchard. Mangosteen quietly pointed out that none of them remembered a tree. Mandarin tried to laugh, but the sound came out nervous.

Their memories arrived in fragments. Mango remembered gentle fingers smoothing a curved shape. Mangosteen remembered a fine brush adding colour. Mandarin remembered a clear coat settling over their surface until everything gleamed.

The more they compared their memories, the more worried they became. Their colours and shapes were so different. If they had not grown together, perhaps they did not truly belong together at all.

Beary placed three soft forms on the tray. The trio helped match each one to a remembered silhouette. A curve became Mango. A round shape became Mandarin. A small crown formed Mangosteen.

Next came colour, then a smooth shining coat. As the glaze settled, the same warm light travelled across all three glossy surfaces.

They finally remembered that they had never been three fruits from one tree. They were three carefully shaped sweets in one assortment. Their different forms had been intentional, each adding something the others could not.

Mango did not have to speak for everyone. Mangosteen did not have to hide behind the others. Mandarin did not have to hurry to keep the group together.

They left Beary's cafe as three distinct friends, still walking side by side.

## Emotional theme

Belonging without sameness, friendship and shared origin

## Claude implementation note

Treat all three sweets as one character entity in chapter logic. Dialogue may identify the active speaker by name, but scene movement, save progress, chapter completion and card unlocking apply to the trio as a single customer. The unlocked card should show all three together.
