# Core Set — Planning Document

> Blueprint for the flagship **core** set: a tier × affinity map of every card we intend to
> ship, with a computable **Power Value (PV)** per card and a **Deck Power** that sums them for
> matchmaking and balance. Existing cards are slotted in; empty slots are the work to do.
>
> Source of truth for the cards themselves stays [core.yaml](core.yaml) →
> `content:generate` → [content.generated.ts](../../src/game/content.generated.ts). This doc holds
> *targets*; a PV script (see [Next steps](#next-steps)) computes *actuals* from the YAML.

---

## 1. Goals & shape

- **Flagship size:** ~90 cards in core across **11 affinities** (Daeva excluded — see below), crossing
  100+ once the Daeva/god track lands.
- **Clean rarity pyramid**, filling today's mid-rarity hole (only 2 RARE / 1 EPIC exist now).
- **Every affinity is deckable** — enough low/mid cards to build a mono-affinity deck (Legion/
  Decimation and the AI builder both reward stacking up to 3 of one affinity).
- **Keywords designed-ahead** (Phase 2.1 ability engine): authored here as a planning annotation,
  not yet engine-backed.

### Daeva / god cards — deferred

Daeva is a **god-card track**, planned separately later. Daeva are **always Legendary and always
T9/T10** — but they are *not* the only legendaries (other affinities get their own, see §6). The 4
existing Daeva legendaries (`leraye` T6, `syrath` T7, `iphareth`/`chayliel` T8) are parked, excluded
from the grid/PV targets below, and **under-tiered for the new rule** — re-tier them to T9/T10 when
the Daeva track is authored.

---

## 2. Deckbuilding & Deck Power

- A deck is **5 cards**.
- **Max 2 EPIC + LEGENDARY combined, of which at most 1 LEGENDARY.** So a deck runs 0–2 high-rarity
  cards (e.g. 2 epics, or 1 epic + 1 legendary), never 2 legendaries. They're chase/capstone slots,
  not deck-fillers.
- **Deck Power = Σ PV of the 5 cards.** Used for matchmaking brackets and balance telemetry.

Suggested matchmaking brackets (tune against real decks):

| Bracket | Deck Power | Feel |
| --- | --- | --- |
| I — Wayfarer | < 75 | Low-tier cards |
| II — Seasoned | 75–110 | Mid-tier mix |
| III — Veteran | 110–150 | Mostly high-tier |
| IV — Champion | 150+ | Top-tier (T8+) heavy |

> **Deck Power is a progression gate.** Higher-tier cards carry more PV and so cost more Deck Power;
> a deeper collection lets you field higher-PV cards and climb into higher bands. That climb is what
> unlocks meaningful matches against **elite PvE opponents** and **high-band players** — collecting
> and upgrading toward T8–T10 cards is the long-game power curve.

---

## 3. Power Value (PV) model

**PV = SideSum + Shape + Keywords**, computed deterministically from the card. Side values are
**1–11** (per `sideValueSchema`), so SideSum ranges 4–44.

### 3.1 Components

- **SideSum** = `top + right + bottom + left`. The backbone (~80% of a vanilla card's strength).
- **Shape** = `Corner + Same + Flex` (small, situational, tunable):
  - **Corner** = `clamp(round((maxAdjacentPair − SideSum/2) × 0.5), 0, 4)` — rewards lopsided
    cards that get safe corner placements. Adjacent pairs: (T+R), (R+B), (B+L), (L+T).
  - **Same** = `clamp(maxValueMultiplicity − 1, 0, 3)` — repeated side values fish for Same
    captures (pair → +1, triple → +2, quad → +3).
  - **Flex** = `(maxSide − minSide) ≤ 2 ? 2 : (≤ 3 ? 1 : 0)` — balanced cards play more Plus/center.
  - *Corner rewards imbalance, Flex rewards balance — the tension is intentional.*
- **Keywords** = sum of per-keyword points (§4).

### 3.2 Per-tier bands

**Tier *is* the PV band — nothing more.** A card's tier is wherever its computed PV lands, and it is
**independent of rarity**. T10 holds the highest-PV cards (and costs the most Deck Power); T1 the
lowest. Vanilla (keyword-less) cards reach their band on SideSum alone; keyword cards trade raw
sides for ability PV and sit lower on Σ. Bands overlap by design, so a borderline card can sit in
either adjacent tier.

| Tier | PV band | Vanilla Σ guide |
| --- | --- | --- |
| 1 | 12–16 | 9–12 |
| 2 | 15–19 | 13–16 |
| 3 | 18–22 | 16–19 |
| 4 | 21–25 | 19–22 |
| 5 | 24–28 | 22–25 |
| 6 | 27–31 | 24–27 |
| 7 | 30–34 | 26–29 |
| 8 | 33–37 | 28–31 |
| 9 | 36–40 | 30–33 |
| 10 | 39–44 | 33–40 |

> **Rarity is decoupled from tier.** Rarity is a *drop-rate / collectibility* axis, not a power axis —
> **any tier can hold commons, uncommons, and rares** (the catalog already has a RARE at T1,
> `sparmos-blacksmith`, and an UNCOMMON at T1, `ghuler`). The only constraint: **Epic and Legendary
> appear only at T4+**, and are rare even there; Daeva are pinned to T9/T10. A card's PV sets its tier
> and Deck-Power cost; its rarity only sets how hard it is to pull.

### 3.3 Worked examples

- **Piasa Whelp** `1/5/1/4` — Σ11. Corner: maxAdj=6, (6−5.5)×0.5≈0. Same: two 1s → +1. Flex:
  spread 4 → 0. **PV ≈ 12.** Sits at the floor of Tier 1 [12–16]. ✓
- **Leraye** (parked Daeva legendary) `7/6/4/8` — Σ25, Corner +1 → vanilla PV 26. As a T6 card it's
  *under* its band (27–31) on stats alone — it needs a keyword (e.g. **Ward** +5 → PV 31) to earn its
  tier. This is exactly why legendaries carry abilities, and a good template for new high-rarity cards.

---

## 4. Keyword catalog (designed-ahead)

Phase 2.1 keywords. PV points are **starter values — validate against the self-play harness**, not
by guesswork. Not engine-backed yet; treat as planning annotations until 2.1 lands.

**Abilities span all tiers and rarities** — even commons can carry one — but grow **more common the
higher the rarity** (uncommon → legendary). A low-tier keyword card should trade raw sides for the
ability (lower Σ) so its PV stays inside the tier band.

| Keyword | Effect | PV |
| --- | --- | --- |
| **Ward** | Immune to Same/Plus flips | +5 |
| **Echo** | On capture, weaken an adjacent enemy by 1 side | +5 |
| **Surge** | +1 to sides of same-affinity neighbors while in play | +4 |
| **Bulwark** | Uncapturable the turn it's played | +3 |
| **Ambush** | On play, reveal an opponent hand card | +2 |

---

## 5. Coverage matrix (have → target)

Counts per affinity × rarity. **Bold deltas** = cards to make.

| Affinity | Common | Uncommon | Rare | Epic | Legendary | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Beast | 7→7 | 0→**2** | 0→**1** | 0→**1** | 0→**1** | 7→12 |
| Human | 2→**3** | 1→**2** | 1→**2** | 1→1 | 0→**1** | 5→9 |
| Construct | 2→**4** | 0→**2** | 0→**1** | 0→**1** | 0→0 | 2→8 |
| Undead | 3→**4** | 0→**2** | 0→**1** | 0→**1** | 0→0 | 3→8 |
| Eldritch | 2→**3** | 3→3 | 0→**2** | 0→**1** | 0→**1** | 5→10 |
| Aberration | 3→**4** | 0→**2** | 1→**2** | 0→**1** | 0→0 | 4→9 |
| Giant | 1→**3** | 0→**2** | 0→**1** | 0→**1** | 0→0 | 1→7 |
| Reshai | 0→**3** | 0→**2** | 0→**1** | 0→0 | 0→**1** | 0→7 |
| Alnathi | 1→**3** | 0→**2** | 0→**1** | 0→**1** | 0→0 | 1→7 |
| Myrathi | 1→**2** | 1→**2** | 0→**1** | 0→0 | 0→**1** | 2→6 |
| Kynathi | 2→**3** | 0→**2** | 0→**1** | 0→**1** | 0→0 | 2→7 |
| **Totals** | 24→39 | 5→23 | 2→14 | 1→9 | 0→5 | **32→90** |

**~58 new cards to make.** Note how the work concentrates in Uncommon/Rare/Epic — exactly the
hole in today's set.

---

## 6. Per-affinity slots

Each affinity: existing cards (**Have**) + the slots **To make**. Slot codes are working labels;
collector numbers are assigned at authoring time, continuing from `CORE-037`. `Σ` = target SideSum.

> Tier and rarity are independent (§3.2): the Tier/Σ below is where a card's PV should land; its
> Rarity is just its drop-rate. A common can be high-tier and a rare low-tier — the assignments here
> are a sensible starting spread, not a rule.

### Beast — *wild packs; win by numbers & momentum*  ·  signature: **Surge**, **Echo**

**Have (7):** `piasa-whelp` `dire-wolf` `wooly-rhino` `adze` `elephant-bird` `areneid` (C/T1) · `roc` (C/T2)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Bst-U1 | Uncommon | 3 | ~16 | Surge | Pack alpha — buffs adjacent Beasts |
| Bst-U2 | Uncommon | 3 | ~18 | — | Stampede bruiser; lopsided corner card |
| Bst-R1 | Rare | 5 | ~22 | Echo | Apex hunter — weakens on capture |
| Bst-E1 | Epic | 7 | ~25 | Surge | Packlord — strong Surge anchor |
| Bst-L1 | Legendary | 9 | ~30 | Surge + Echo | **Beast champion** (chase) |

### Human — *versatile, tactical; gear & guile*  ·  signature: **Ambush**

**Have (5):** `relic-hunter` `cutthroat` (C/T1) · `sparmos-blacksmith` (R/T1) · `ember-page` (U/T2) · `king-garath` (E/T4)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Hum-C1 | Common | 2 | ~14 | — | Footsoldier; balanced sides |
| Hum-U1 | Uncommon | 3 | ~17 | Ambush | Scout — reveals a hand card |
| Hum-R1 | Rare | 5 | ~21 | Ambush | Spymaster; flexible mid card |
| Hum-L1 | Legendary | 9 | ~31 | Ward + Ambush | **Human champion** (chase) |

### Construct — *defensive walls; fixed and immovable*  ·  signature: **Bulwark**, **Ward**

**Have (2):** `homonculus` (C/T1) · `broken-doll` (C/T2)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Con-C1 | Common | 1 | ~11 | — | Cheap blocker; high single side |
| Con-C2 | Common | 2 | ~14 | Bulwark | Wall — safe the turn it lands |
| Con-U1 | Uncommon | 3 | ~16 | Ward | Sentinel — immune to Same/Plus |
| Con-U2 | Uncommon | 4 | ~19 | Bulwark | Bastion; balanced |
| Con-R1 | Rare | 5 | ~22 | Ward | Aegis-frame |
| Con-E1 | Epic | 7 | ~24 | Ward + Bulwark | Fortress engine |

### Undead — *attrition; grind the board down*  ·  signature: **Echo**

**Have (3):** `rotted-zombie` `brittle-skeleton` (C/T1) · `ghoul` (C/T2)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Und-C1 | Common | 2 | ~14 | — | Shambler; balanced |
| Und-U1 | Uncommon | 3 | ~16 | Echo | Wight — decays a neighbor on capture |
| Und-U2 | Uncommon | 4 | ~19 | — | Revenant; lopsided |
| Und-R1 | Rare | 5 | ~22 | Echo | Lich-thrall |
| Und-E1 | Epic | 7 | ~24 | Echo | Plague-marshal — chain decay |

### Eldritch — *chaos; flips and reversals*  ·  signature: **Echo**, **Surge**

**Have (5):** `red-imp` `blue-imp` (C/T2) · `ghuler` (U/T1) · `siguapa` (U/T3) · `snallygaster` (U/T4)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Eld-C1 | Common | 1 | ~11 | — | Lesser imp; Same-bait pair |
| Eld-R1 | Rare | 5 | ~21 | Surge | Warlock — buffs Eldritch neighbors |
| Eld-R2 | Rare | 6 | ~23 | Echo | Horror — weakens on capture |
| Eld-E1 | Epic | 7 | ~25 | Echo | Outer thing |
| Eld-L1 | Legendary | 9 | ~30 | Echo + Surge | **Eldritch champion** (chase) |

### Aberration — *mutation; irregular, spiky sides*  ·  signature: **Echo** (mixed)

**Have (4):** `squonk` `plague-rat` (C/T1) · `skraal` (C/T2) · `flesh-amalgamation` (R/T3)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Abr-C1 | Common | 2 | ~14 | — | Mutant; spiky corner card |
| Abr-U1 | Uncommon | 3 | ~16 | Echo | Grafter |
| Abr-U2 | Uncommon | 4 | ~19 | — | Amalgam; high single side |
| Abr-R1 | Rare | 5 | ~23 | Echo | Devourer |
| Abr-E1 | Epic | 7 | ~25 | Echo | Apex aberration |

### Giant — *huge single sides, slow*  ·  signature: **Bulwark**

**Have (1):** `forest-troll` (C/T2)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Gnt-C1 | Common | 1 | ~11 | — | Hill brute; one big side |
| Gnt-C2 | Common | 2 | ~14 | Bulwark | Boulder — safe on play |
| Gnt-U1 | Uncommon | 3 | ~17 | — | Ogre; lopsided |
| Gnt-U2 | Uncommon | 4 | ~19 | Bulwark | Mountain-kin |
| Gnt-R1 | Rare | 5 | ~22 | Bulwark | Titan |
| Gnt-E1 | Epic | 7 | ~25 | Ward + Bulwark | Colossus |

### Reshai — *Wukong-like monkey humanoids; agile tricksters, staff & shapeshifting*  ·  signature: **Ambush** (feints), **Echo** (clones)

**Have (0).** Identity set; still needs palette + art before authoring.

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Rsh-C1 | Common | 1 | ~11 | — | Scrapper — nimble, lopsided |
| Rsh-C2 | Common | 2 | ~13 | Ambush | Trickster-cub — feints (reveal) |
| Rsh-C3 | Common | 2 | ~15 | — | Staff-novice |
| Rsh-U1 | Uncommon | 3 | ~16 | Ambush | Cloud-leaper |
| Rsh-U2 | Uncommon | 4 | ~19 | Echo | Mirror-double — clone flavor |
| Rsh-R1 | Rare | 5 | ~22 | Ambush | Staff-saint |
| Rsh-L1 | Legendary | 9 | ~31 | Ambush + Echo | **Monkey King** — Reshai champion (chase) |

### Alnathi — *faction; moon/tide wardens*  ·  signature: **Ward**

**Have (1):** `moonwell-diver` (C/T2)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Aln-C1 | Common | 1 | ~11 | — | Tidewatcher |
| Aln-C2 | Common | 2 | ~14 | — | Moon-acolyte |
| Aln-U1 | Uncommon | 3 | ~16 | Ward | Lunar warden |
| Aln-U2 | Uncommon | 4 | ~19 | — | Tideguard |
| Aln-R1 | Rare | 5 | ~22 | Ward | Moon-priest |
| Aln-E1 | Epic | 7 | ~25 | Ward | Tide-sovereign |

### Myrathi — *faction; raiders & tide-swell*  ·  signature: **Surge**

**Have (2):** `myrathi-raider` (C/T2) · `myrathi-tidecaller` (U/T3)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Myr-C1 | Common | 1 | ~11 | — | Reaver |
| Myr-U1 | Uncommon | 4 | ~19 | Surge | Tide-shaman — buffs Myrathi neighbors |
| Myr-R1 | Rare | 5 | ~22 | Surge | Swell-caller |
| Myr-L1 | Legendary | 9 | ~30 | Surge + ? | **Myrathi champion** (chase) |

### Kynathi — *faction; highborn erudites*  ·  signature: **Ambush**

**Have (2):** `natari-erudite` (C/T1) · `kynathi-highborn` (C/T2)

| Slot | Rarity | Tier | Σ | Keyword | Concept |
| --- | --- | --- | --- | --- | --- |
| Kyn-C1 | Common | 2 | ~14 | — | Adept |
| Kyn-U1 | Uncommon | 3 | ~16 | Ambush | Loremaster — reveals a hand card |
| Kyn-U2 | Uncommon | 4 | ~19 | — | Magister |
| Kyn-R1 | Rare | 5 | ~22 | Ambush | Archon |
| Kyn-E1 | Epic | 7 | ~25 | Ambush + Ward | Highborn paragon |

---

## 7. Known anomalies → action items

1. **Mid-rarity hole** — only 2 RARE / 1 EPIC exist. ~30 of the new cards are U/R/E by design.
2. **Beast has no capstone** — 7 commons, nothing above T2. Adds U/R/E/L.
3. **Reshai is empty** — identity now set (Wukong-like monkey humanoids); still needs palette + art.
4. **Giant / Alnathi are 1 card each** — not deckable; bring each to ~7.
5. **Parked Daeva legendaries are under-tiered** — they sit at T6–T8 today, but the Daeva rule is
   T9/T10; re-tier them when the god-card track is authored. (Also confirms keyword cards earn tier
   via abilities, not raw Σ.)
6. **Empty tiers 5, 9, 10** — filled by the new rares and legendary capstones.

---

## 8. Open questions

- **Reshai palette & art** — identity is set (monkey humanoids); colors and signature keyword
  (Ambush/Echo proposed) still to lock.
- **Keyword PV weights** — the §4 numbers are guesses until the self-play harness validates them.
- **Daeva/god track** — separate doc. Since Daeva are always Legendary, a Daeva *is* your one
  legendary slot — confirm they don't get a privileged 6th slot.

## Next steps

1. **PV script — done.** `pnpm cards:power` ([scripts/card-power.ts](../../scripts/card-power.ts),
   model in [src/game/power.ts](../../src/game/power.ts)) computes PV + Deck Power and flags any card
   outside its tier band. Bands in §3.2 were calibrated from its output.
2. **Surface Deck Power** in the deck builder UI and gate matchmaking on it (reuse `deckPower`).
3. **Author by rarity**, low → high, validating each wave against the self-play harness before the
   next.
