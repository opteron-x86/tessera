# Tessera Card Lore and Affinity Guidelines

Tessera cards are fragments of a world, not encyclopedic entries. A card should tell the player what kind of being, place, relic, or power they are holding, while implying a larger history around it.

The setting is post-cataclysmic and post-magical: roughly 2000 years after a world-breaking event. The surviving world contains humans, three elven peoples, reshai, giants, beasts, relic constructs, undead, corrupted creatures, and the fallen gods called Daeva, whose Graveland plane can intrude on mortal places.

## Core Principles

- Every card should have a clear world identity before it has a mechanical role.
- Lore text should imply history, conflict, or belief rather than explain taxonomy.
- Affinity should stay readable during play. Use it as a broad mechanical and metaphysical identity, not as a complete species database.
- Use future tags for precise lore labels when needed, such as `God`, `Graveland`, `Corrupted`, `Legendary`, `Elf`, or `Daeva-Touched`.
- Prefer names that feel specific to Tessera over generic fantasy labels when the card represents a person, faction, culture, or legendary figure.

## Canonical Affinities

Use these values for `affinity`.

### Human

Mortals, city-states, relic hunters, soldiers, saints, tyrants, farmers, oathkeepers, scholars, and survivors.

Human cards should feel adaptive, political, stubborn, devotional, or ambitious. They are the people most visibly rebuilding, misremembering, exploiting, or sanctifying the broken world.

Examples:

- Relic Hunter
- Sparmos Blacksmith
- Cutthroat
- King Garath

### Kynathi

Highborn or starward elves associated with lineage, memory, old authority, refinement, inheritance, pride, and ancient continuity.

Kynathi cards should feel formal, hierarchical, precise, beautiful, dangerous, or burdened by history. They remember too much and admit too little.

Examples:

- Kynathi Highborn
- Natari Erudite
- Star-Veil Magistrate

### Alnathi

Moonwell elves associated with hidden places, water, veils, dreams, prophecy, ritual, and ecological or spiritual magic.

Alnathi cards should feel secretive, liminal, mournful, visionary, or holy in a strange local way. They should often know something without fully explaining how.

Examples:

- Moonwell Diver
- Well-Masked Seer
- Alnathi Veilkeeper

### Myrathi

Tide and coastal elves associated with storms, raiding, navigation, trade, salt, weather, and boundary-crossing.

Myrathi cards should feel mobile, practical, fierce, opportunistic, and at home where land, sea, and sky contend.

Examples:

- Myrathi Raider
- Myrathi Tidecaller
- Salt-Oath Navigator

### Reshai

Monkey-like people associated with motion, wit, memory performance, clan champions, masks, trickery, agility, and oral tradition.

Reshai cards should feel quick, social, clever, improvisational, and difficult to pin down. They can be comic, sacred, dangerous, or all three, but avoid making them merely whimsical.

Examples:

- Reshai Maskrunner
- Laughing Staff Adept
- Canopy Duelist

### Giant

Giants, giant-blooded figures, mountain clans, titanspawn, old pact-keepers, siege bodies, and monumental beings of the mortal world.

Giant cards should feel old, slow to anger, physically immense, oathbound, geological, or tragically diminished after the cataclysm.

Examples:

- Cairn-Shouldered Elder
- Last Bridge Giant
- Frost-Ridge Oathkeeper

### Beast

Natural creatures, ancient animals, predators, mounts, wild guardians, monstrous wildlife, and animals that belong to the mortal ecology.

Beast cards should feel territorial, instinctive, sacred to local cultures, dangerous because they belong here, or changed by survival rather than corruption.

Examples:

- Piasa Whelp
- Dire Wolf
- Wooly Rhino
- Roc
- Areneid

### Construct

Golems, dolls, machines, automata, relic-servitors, awakened tools, animated ruins, and post-magical remnants built or bound by someone.

Construct cards should feel purposeful, damaged, obedient, haunted by instructions, or misaligned with the present age.

Examples:

- Homonculus
- Broken Doll
- Gate-Thread Automaton

### Undead

Ghouls, skeletons, revenants, ancestral dead, grave-haunted things, failed deaths, and beings sustained by broken burial rites or cataclysmic residue.

Undead cards should feel like a social or spiritual failure, not only a monster type. Ask what obligation, sin, hunger, or memory keeps them moving.

Examples:

- Rotted Zombie
- Brittle Skeleton
- Ghoul

### Aberration

Corrupted mortal-world creatures, plague mutants, warped beasts, malformed persons, cataclysm-born monsters, and things made wrong by damage inside the world.

Use Aberration when the horror comes from the mortal world being broken. Use Eldritch when the horror comes from the Graveland or the Daeva.

Examples:

- Skraal
- Flesh Amalgamation
- Glass-Bone Stray

### Eldritch

Graveland creatures, outer-plane invaders, lesser horrors, Daeva-touched entities, impossible servants, and things shaped by fallen divine influence.

Eldritch cards should feel invasive, uncanny, ritualistic, alien, or spiritually contaminating. They may obey Daeva, leak from the Graveland, or be mortal things remade by contact with it.

Examples:

- Red Imp
- Blue Imp
- Siguapa
- Snallygaster
- Ghuler

### Daeva

The fallen gods and named divine powers themselves.

Daeva should be rare in the card pool and usually reserved for legendary figures. Do not use Daeva for ordinary Graveland creatures, cultists, or corrupted mortals. Those are usually Eldritch or Aberration.

Examples:

- Chayliel
- Iphareth
- Syrath
- Leraye

## Affinity vs Tags

Affinity is the gameplay-facing identity. It should be short, visible, and mechanically meaningful.

Tags are planned metadata for lore precision. The current card schema does not yet include tags, so do not add `tags` to YAML until schema support exists.

Suggested future tag examples:

```yaml
affinity: Eldritch
# future tags: [Graveland, Daeva-Touched, Imp]
```

```yaml
affinity: Aberration
# future tags: [Corrupted, Beast, Plagueborn]
```

```yaml
affinity: Daeva
# future tags: [God, Graveland, Legendary]
```

```yaml
affinity: Myrathi
# future tags: [Elf, Myrathi, Tidebound, Person]
```

## Lore Text

Lore text should be one sharp fragment. Prefer implication over explanation.

Good lore text:

- Names a consequence, oath, superstition, place, ritual, or remembered event.
- Makes the world feel older than the card.
- Gives the player a reason to wonder what happened before or after.
- Stays short enough to read on a card.

Avoid lore text that merely defines the card:

```text
Bad: A Myrathi warrior who raids ships along the coast.
Better: She leaves one coin nailed to each mast, payment for the storm she borrowed.
```

```text
Bad: A Daeva from the Graveland who corrupts dreams.
Better: No sleeper in Vaul remembered the same moon after Iphareth opened its eye.
```

```text
Bad: A construct made before the cataclysm.
Better: It still polishes the throne each dawn, though the palace burned seventeen kings ago.
```

## Naming Conventions

- Common creatures can use direct names when clarity matters: `Dire Wolf`, `Roc`, `Ghoul`.
- Specific cultures, persons, and legends should use setting-specific names: `Sparmos Blacksmith`, `Kynathi Highborn`, `Myrathi Tidecaller`.
- Legendary figures and gods should use proper names, often with titles: `Chayliel, Ash-Wreathed Daeva`.
- Avoid overusing real-world folklore names unless they have been adapted into Tessera's setting logic.
- Avoid joke names unless the card represents an in-world joke, insult, tavern name, or folk nickname.

## Rarity Meaning

Rarity should describe both collection frequency and narrative weight.

- `COMMON`: everyday dangers, ordinary people, local beasts, minor undead, common tools, familiar ruins.
- `UNCOMMON`: trained specialists, regional threats, named minor places, unusual monsters, minor relics.
- `RARE`: notable persons, elite creatures, faction leaders, powerful relics, famous monsters.
- `EPIC`: legendary beings, major saints, old war engines, named horrors, figures known across regions.
- `LEGENDARY`: singular persons, gods, world-shaping relics, unique monsters, events made manifest.

Not every powerful being needs high rarity, but every legendary card should feel singular.

## Mechanical Guidance

Tessera is a compact 3x3, five-card game. New mechanics should preserve that clarity.

- Prefer match rules over long individual card abilities.
- Let affinities support rules like Legion and Decimation.
- Add new rules only when they create interesting board decisions with low text burden.
- Avoid creating many affinity-specific exceptions until each affinity has enough cards to support them.
- When a new affinity is added, also add matching visual tokens and UI colors.

Current affinity-driven rules:

- `Legion`: when the third card of an affinity appears, that affinity gains side strength.
- `Decimation`: when the third card of an affinity appears, that affinity loses side strength.

Future rule ideas:

- `Graveland`: Eldritch and Daeva cards alter edge values after the center is occupied.
- `Oathbound`: the first Human, Kynathi, or Giant card played into a corner resists normal capture once.
- `Ruinfall`: after the fifth move, the center weakens adjacent cards.
- `Bloodline`: the first affinity to reach three cards gains a bonus only for its controller.
- `Cataclysm`: very high side values become unstable late in the match.

## Set-Building Guidance

For a small set, keep the affinity distribution playable. A good early target is:

- 3 to 5 cards each for Human, Beast, Undead, Construct, Eldritch, and one or two elven affinities.
- 1 to 3 cards each for Reshai, Giant, Aberration, and the remaining elven affinities.
- 0 to 2 Daeva cards unless the set is explicitly about fallen gods.

Each set should have:

- A mundane face of the world: people, trades, roads, beasts, local dangers.
- A memory of the cataclysm: relics, ruins, old constructs, broken rituals.
- A spiritual pressure: undead, Daeva traces, cults, Graveland leakage.
- A cultural spread: at least two peoples or factions shown through concrete roles.

## Implementation Notes

The current schema accepts any non-empty string as an affinity, but the canonical list above should be treated as the source of truth.

When adding a new affinity value in YAML:

- Add or confirm a matching CSS token in `src/app/globals.css`, such as `--affinity-reshai`.
- Confirm collection and deck filters display it clearly.
- Confirm PvE opponent `deckAffinity` values match the canonical spelling.
- Regenerate content with `pnpm content:generate`.

Do not add future fields like `tags` directly to card YAML until `src/game/content-schema.ts` and related types support them.
