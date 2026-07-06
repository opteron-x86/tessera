# Build lore roadmap

> I've finished ripping out and cleaning up a bunch of the lore documentation, stripping it down to foundational levels. Give the content/lore/ documents a review, and with a world-builder's lens construct a roadmap for development, focused ONLY on the lore and worldbuilding, NOT the card game.

<details><summary>5 previous messages</summary>

> I’ll read the lore docs as source material first, then I’ll synthesize gaps and a development roadmap strictly around setting coherence, cultures, history, magic, places, and conflicts.
>
> <details><summary>Explored 2 lists</summary>
>
> - Listed files in `lore`
> - Listed files in `lore`
>
> </details>
>
> I found five concise lore files. I’m going to read them with line numbers so the roadmap can point back to the exact foundations already present.
>
> <details><summary>Explored 5 files</summary>
>
> - Read `./content/lore/world.md`
> - Read `./content/lore/magic.md`
> - Read `./content/lore/peoples.md`
> - Read `./content/lore/geopolitics.md`
> - Read `./content/lore/locations.md`
>
> </details>
>
> The documents are intentionally skeletal now, but the setting already has a strong spine: a declining world, contested catastrophe, damaged metaphysics, successor states, and peoples whose histories disagree. The biggest missing layer is not more names yet; it is chronology, causal geography, and lived institutions.
</details>

I reviewed the five `content/lore/` files and made no edits. I’m treating this strictly as a setting bible, not as game design.

**Core Read**
Tessera’s strongest foundation is the tension between a damaged metaphysical world and the political/cultural systems trying to survive after it. The Spellbreak ambiguity in [world.md](./content/lore/world.md:20), the Graveland/Daeva coherence rules in [world.md](./content/lore/world.md:37), and the blood-as-participation premise in [magic.md](./content/lore/magic.md:13) are the setting’s best engines.

The biggest current weakness is that many entries are evocative but not yet causal. We know what exists, but not enough about how it pressures daily life, borders, institutions, faith, trade, memory, succession, law, or identity.

**Main Gaps**
- `world.md` mentions the Waning in the intro, but there is no actual Waning section yet.
- `geopolitics.md` is currently the thinnest file; the Merathine Empire is only defined as “human-founded” at [geopolitics.md](./content/lore/geopolitics.md:7).
- `locations.md` mixes cities, kingdoms, regions, seas, and polities under one heading; useful now, but it will need a clearer geography hierarchy.
- `magic.md` needs rules of practice: institutions, failure modes, costs, taboos, what common magic can and cannot do.
- `peoples.md` has strong asymmetry, but Alnathi, humans, and were-creatures need more development. Were-creatures are explicitly undeveloped at [peoples.md](./content/lore/peoples.md:91).
- Source bias is a great principle at [world.md](./content/lore/world.md:33), but it should become a formal lore method: what is objective canon, contested history, propaganda, theology, or regional belief.

**Roadmap**
1. **Canon Spine**
   Build a short `timeline.md` or chronology section covering: Elathi traditions, rise of the Kynathi Hegemony, Giant War, Alnathi schism, Spellbreak, early collapse, rise of human successor states, present day. Keep some dates approximate, but establish sequence and generational distance.

2. **Metaphysical Rules**
   Expand `magic.md` around five questions: what magic can reliably do, what it cannot do anymore, what failure looks like, who regulates it, and how blood changes the stakes. Add the Waning either here or in `world.md`.

3. **Political Engines**
   Expand `geopolitics.md` into actual pressure systems: Natari Dominion legitimacy, Merathine imperial ideology, Lorindale wealth, Seradon maritime exposure, Vrasar frontier militarization, Juna’s northern buffer role, and the Banner-Sworn threat from the Vezhan Steppe.

4. **Cultural Dossiers**
   For each major people, define: origin story, social structure, religion, economy, military tradition, relationship to the Spellbreak, prejudice toward others, internal fault line, and one thing outsiders consistently misunderstand. Start with Kynathi, humans/Merathines, Alnathi, Dyrathi, Myrathi, Reshai, Sehrati, Riftborn, vampires.

5. **Geography With Consequences**
   Turn `locations.md` into a causal map: river systems, mountain barriers, trade corridors, storm/ice boundaries, Blightlands containment routes, pilgrimage paths to Neresce, coastal raiding zones, and why each capital exists where it does.

6. **Religion And Memory**
   Create or expand a religion layer: Avara worship, Daevic cults, Anchorite heresy, Alnathi death practice, Myrathi Reading, Reshai animism, Sehrati ruin-veneration, and human imperial syncretism. This should also clarify what “the gods no longer answer reliably” means in practice.

7. **Changed Peoples And Horror Boundaries**
   Define Riftborn, vampires, were-creatures, Aberrations, and Eldritch as separate categories with social and metaphysical implications. The vampire material is already strong; Riftborn need community names and political treatment, and were-creatures need a cause.

8. **Local Texture Pass**
   After the big systems are stable, add grounded details: currencies, calendars, titles, funeral customs, legal categories, taboo phrases, border rituals, ship types, scholarly orders, ruin protocols, and common folk explanations for magic going wrong.

**Best Next Move**
Start with a foundational `timeline.md` plus a serious expansion of `geopolitics.md`. Those two will give every people, place, and magical tradition a stronger place to stand.

> let's make a first pass on the canon spine and timeline. We can work collaboratively on this, you can ask questions, propose content, clarify, revise, enhance, improve, remove, and iterate as we go. Let's get started

<details><summary>15 previous messages</summary>

> I’ll make this concrete by drafting a new lore document rather than only discussing it. I’ll keep the first pass conservative: establish sequence, fixed anchors, and open questions without over-answering mysteries the current docs intentionally leave unresolved.
>
> <details><summary>Explored a search, ran a command</summary>
>
> - Ran `git status --short`
>
> <details><summary>Explored a search</summary>
>
> - Searched for `timeline|chronology|Waning|Spellbreak|Kynathi|Hegemony|Giant War|Anchorite|Codex|Vahari|Urath|Maren|Banner-Sworn` in `lore`
>
> </details>
>
> </details>
>
> `world.md` is already modified in the worktree, so I’m checking the current text before touching anything. I’ll avoid overwriting those changes and link the new spine file back into it with a minimal patch if the link point is still clean.
>
> <details><summary>Explored a file, a list, ran a command</summary>
>
> - Ran `git diff -- content/lore/world.md`
>
> <details><summary>Explored a file, a list</summary>
>
> - Read `./content/lore/world.md`
> - Listed files in `lore`
>
> </details>
>
> </details>
>
> I have enough to draft a usable first pass. I’m going to add a new `timeline.md` that separates fixed canon from contested tradition, then I’ll leave open questions where we should decide rather than accidentally canonize too much.
>
> One key working assumption I’m baking into the draft: the present sits several centuries after the Spellbreak, likely within the outer edge of Kynathi living memory. That gives the world ruins and successor states while allowing a few ancient witnesses to still matter politically.
>
> I’m adding the draft now. The goal is for this to be editable scaffolding: enough structure to argue with, not a polished encyclopedia entry.
>
> <details><summary>Created a file</summary>
>
> - Wrote `./content/lore/timeline.md` (+214 -0)
>
> </details>
>
> The first draft is in place as `content/lore/timeline.md`. I’m going to do a consistency pass now against the existing files, mainly checking that I didn’t accidentally promote an open question into settled canon.
>
> <details><summary>Explored a file, a search, ran a command</summary>
>
> <details><summary>Explored a file, a search</summary>
>
> - Read `./content/lore/timeline.md`
> - Searched for `Fixed:|Contested:|Open:|Waning|Spellbreak|Natari|Merathine|Vahari|Anchorite|Nerescine|Banner-Sworn|Riftborn|Aberrations|Eldritch|Avara|Daeva` in `timeline.md`
>
> </details>
>
> - Ran `git diff -- content/lore/timeline.md`
>
> </details>
>
> Consistency pass looks clean overall. I spotted one phrase that implied more certainty about the Merathine Empire’s origin than the current docs support, so I’m tightening that before wrapping this pass.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./content/lore/timeline.md` (+1 -1)
>
> </details>
>
> The draft now stays inside the facts already present unless it is explicitly marked `Contested` or `Open`. I’ll check the final diff/status and then give you the first set of decisions I think we should make together.
>
> <details><summary>Ran 3 commands</summary>
>
> - Ran `git status --short`
> - Ran `git diff --stat`
> - Ran `git diff -- content/lore/timeline.md`
>
> </details>
>
> <details><summary>Plan</summary>
>
> - [x] Define canon-spine structure and uncertainty labels
> - [x] Draft first-pass chronology in a new lore file
> - [x] Review for contradictions with existing lore
> - [x] Summarize decisions and collaboration questions
>
> </details>
</details>

Created the first-pass canon spine and chronology in [timeline.md](./content/lore/timeline.md:1).

It includes:
- Fixed / Contested / Open labels for canon confidence.
- A load-bearing “Canon Spine” section.
- A broad chronology from creation myths through the current age.
- A “Priority Canon Decisions” section for collaboration.

I did not modify `world.md`; it was already dirty from your cleanup, so I left it alone.

The biggest next decisions are probably:

1. Is the present still within Kynathi living memory of the Spellbreak?
2. What exactly is **the Waning**?
3. Was the Spellbreak a moment, a cascade, or an era?
4. Was Natari the old Hegemony capital, or merely the surviving claimant?
5. Are the Alnathi heresy and Anchorite heresy the same thing, related, or separate?

My recommendation: answer #1 first, because the age of the current era controls almost everything else: politics, ruins, eyewitnesses, resentment, historical reliability, and how “post-catastrophe” the world still feels.

> 1. What makes for a more interesting setting? Provide a few timespans, weigh the features and pros and cons of each, and which you recommend.
> 2. The Waning has been struck from the canon, it is no longer relevant
> 3. The Spellbreak was a moment, but reality was so destabilized it may have been a cascade, or years of time. Sources are unreliable on what actually happened when the Spellbreak occurred and for how long.

<details><summary>6 previous messages</summary>

> I’ll fold your canon calls into `timeline.md` now: remove the Waning from active decisions, and reframe the Spellbreak as an instantaneous rupture whose experienced duration is unreliable. Then I’ll give you the timespan options with a recommendation.
>
> <details><summary>Explored a file, a search</summary>
>
> - Searched for `Waning|Spellbreak duration|current date|living memory|several centuries|Priority Canon` in `timeline.md`
> - Read `./content/lore/timeline.md`
>
> </details>
>
> The existing draft had already lost the Waning section, so I’m just cleaning the remaining decision list and making the Spellbreak wording explicit. This keeps “moment” as authorial truth while preserving unreliable in-world chronology.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./content/lore/timeline.md` (+12 -11)
>
> </details>
>
> That patch is in. I’m doing a quick verification pass so the response can reference the updated file accurately.
>
> <details><summary>Explored a search, ran a command</summary>
>
> <details><summary>Explored a search</summary>
>
> - Searched for `Waning|Spellbreak was|cascade|Current date|Priority Canon` in `timeline.md`
>
> </details>
>
> - Ran `git status --short`
>
> </details>
</details>

Updated [timeline.md](./content/lore/timeline.md:111) to make the Spellbreak authorially a moment, while in-world sources may describe cascades, lost years, repeated days, or contradictory durations. The Waning is gone from the timeline and priority decisions.

For the current era, I’d weigh the options this way:

| Timespan After Spellbreak | Features | Pros | Cons |
|---|---|---|---|
| **150-250 years** | Recent catastrophe, active reconstruction, many Kynathi eyewitnesses | Raw political trauma, direct grudges, fast-moving collapse/recovery | Too recent for deep successor cultures, ruins feel less ancient, unreliable history is harder to justify |
| **350-550 years** | Mature successor states, living elder witnesses, partial mythologizing | Strong balance of memory and history; human kingdoms feel established | Kynathi testimony may still be common enough to reduce mystery |
| **700-850 years** | Last edge of Kynathi living memory; human age fully rooted | Best tension: ancient to humans, personal to the oldest Kynathi; enough time for empires, distortions, religions, frontier cultures | Requires care: only rare Kynathi should truly remember the old world |
| **1000-1500+ years** | Spellbreak becomes mythic antiquity | Maximum historical ambiguity, cultures fully transformed | Loses the emotional bite of “some people still remember”; Natari’s continuity becomes more abstract |

My recommendation: **around 750 years after the Spellbreak**.

That gives humans roughly 25-30 generations to build successor kingdoms, rewrite histories, normalize ruins, and forget uncomfortable truths. It also means the oldest Kynathi can still remember the pre-Spellbreak world, but only barely: childhood memories, late-life testimony, or rare figures kept alive by power, office, magic, or obsession. That is more interesting than either “everyone remembers” or “no one remembers.”

I’d make the formal present something like **c. 760 AS**: After Spellbreak as the common scholarly dating system, with some cultures rejecting or adjusting the count because the Spellbreak’s experienced duration is disputed.

> I'll go with 760 AS. With this date set as the current era since the Spellbreak, where would you like to best continue on the worldbuilding development?

<details><summary>6 previous messages</summary>

> I’ll canonize `760 AS` in the timeline first, then I’ll recommend the next development layer. With the date fixed, the best next work is no longer abstract chronology; it’s turning that chronology into political memory and living institutions.
>
> <details><summary>Explored a file, a search</summary>
>
> - Read `./content/lore/timeline.md`
> - Searched for `current date|Current date|760|provisional|living memory|Priority Canon` in `timeline.md`
>
> </details>
>
> I’m replacing the remaining provisional language with the fixed date, and removing the date from the open decision list. I’m also adding a small implication note so future work knows what `760 AS` means for memory and politics.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./content/lore/timeline.md` (+11 -10)
>
> </details>
>
> `760 AS` is now canonical in the timeline. I’m doing one quick check for stale provisional wording, then I’ll recommend the next development target and why.
>
> <details><summary>Explored a search, ran 2 commands</summary>
>
> <details><summary>Explored a search</summary>
>
> - Searched for `provisional|current date|Current date|760 AS|living memory` in `timeline.md`
>
> </details>
>
> - Ran `git diff -- content/lore/timeline.md`
>
> - Ran `git status --short`
>
> </details>
</details>

Set `760 AS` as canon in [timeline.md](./content/lore/timeline.md:17), with the present year repeated in the Current Age section at [timeline.md](./content/lore/timeline.md:175).

I’d continue with **geopolitics next**.

Now that the date is fixed, the most valuable next question is: *what does 760 years of post-Spellbreak history actually look like in power, borders, resentment, legitimacy, and daily pressure?* That will make the rest of the worldbuilding much easier.

My recommended next pass:

1. Expand `geopolitics.md` into **Merata in 760 AS**.
2. Define the current balance of power:
   - Natari Dominion: old legitimacy, diminished force.
   - Merathine Empire: human center of gravity.
   - Lorindale: fertile wealth and soft power.
   - Seradon: coastal exposure, trade, Myrathi anxiety.
   - Vrasar: militarized frontier facing the Banner-Sworn.
   - Juna: northern buffer between Dyrathi mountains and Isenfall.
   - Teutania: hard-to-conquer independent highlands.
3. Decide the Merathine Empire’s condition. My recommendation: **plateaued and overextended**, not newly rising or fully declining. That gives it confidence, bureaucracy, border stress, rivals, and internal pressure without making it feel doomed.
4. Add a section for **historical claims**: who says they inherited, liberated, avenged, preserved, or replaced the Kynathi order.
5. Add present-tense flashpoints for 760 AS.

After that, I’d do **living witnesses and memory institutions**: the oldest Kynathi, vampire survivors, Alnathi records, Dyrathi sealed archives, Merathine historians, Natari propaganda, and contested public truth. That will make the timeline feel inhabited rather than just dated.

> Let's make the expanded geopolitics pass. On question 2, I'd like to take a second look at what's current canon, and walk through a series of questions and answers to better shape these entries. For example, The Natari Dominion could be completely rewritten or revised (not saying it HAS to be, just an option). Consider everything in these lore documents soft canon and that it can be changed if we decide something will work better a different way or would do better in a revised way, or cut entirely. I agree with the Merathine Empire bein plateaued and overextended.

<details><summary>15 previous messages</summary>

> I’ll treat the existing lore as soft canon for this pass: preserve useful pieces, but structure `geopolitics.md` so disputed items are clearly marked as working assumptions or questions. I’ll anchor only the Merathine Empire’s plateaued/overextended condition as decided.
>
> <details><summary>Explored 4 files</summary>
>
> - Read `./content/lore/geopolitics.md`
> - Read `./content/lore/timeline.md`
> - Read `./content/lore/locations.md`
> - Read `./content/lore/peoples.md`
>
> </details>
>
> The key shape I’m seeing: `geopolitics.md` should not just list states; it should explain each polity’s claim about the post-Spellbreak order. I’m going to rewrite it as a 760 AS working document with soft-canon questions preserved inside it, especially around Natari.
>
> I’m making the rewrite now. I’m keeping this as a first pass, so entries are intentionally useful-but-revisable: enough specificity to develop from, without pretending the unresolved pieces are settled.
>
> <details><summary>Deleted a file</summary>
>
> - Deleted `./content/lore/geopolitics.md` (+0 -16)
>
> </details>
>
> The old file was only a short stub, so I removed it cleanly before replacing it with the expanded 760 AS version.
>
> <details><summary>Created a file</summary>
>
> - Wrote `./content/lore/geopolitics.md` (+373 -0)
>
> </details>
>
> The expanded geopolitics pass is now drafted. I’m checking it against the rest of the lore for stale assumptions and places where I should soften wording before we treat it as a collaborative working file.
>
> One important note: because we are treating current lore as soft canon, I intentionally left several entries as `Open` rather than forcing answers. The most substantive proposal is that Natari is probably more interesting as a sacred/legal continuity center than simply “the old capital.”
>
> <details><summary>Explored a file, a search, ran a command</summary>
>
> <details><summary>Explored a file, a search</summary>
>
> - Searched for `Open:|Recommendation:|Current condition|Political claim|Natari|Merathine|Banner-Sworn|760 AS|Waning|plateaued` in `geopolitics.md`
> - Read `./content/lore/geopolitics.md`
>
> </details>
>
> - Ran `git diff -- content/lore/geopolitics.md`
>
> </details>
>
> Since the Merathine Empire’s plateaued/overextended state is now decided, I’m also syncing that one point back into `timeline.md` so the two files do not disagree. Natari remains deliberately unresolved for the next collaborative pass.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./content/lore/timeline.md` (+1 -1)
>
> </details>
>
> The geopolitics pass and timeline sync are done. I’m checking the diff and then I’ll give you the specific Natari questions I’d start with in the next iteration.
>
> <details><summary>Explored a search, ran 2 commands</summary>
>
> - Ran `git status --short`
>
> - Ran `git diff --stat`
>
> <details><summary>Explored a search</summary>
>
> - Searched for `Merathine Empire has plateaued|Natari's old role|Merathine origin|Priority Canon` in `timeline.md`
>
> </details>
>
> </details>
>
> <details><summary>Plan</summary>
>
> - [x] Rewrite geopolitics as a 760 AS working reference
> - [x] Add polity entries with claims, pressures, and flashpoints
> - [x] Add Natari soft-canon Q&A section
> - [ ] Check consistency and summarize next questions
>
> </details>
</details>

Expanded [geopolitics.md](./content/lore/geopolitics.md:1) into a full 760 AS working reference.

What changed:
- Reframed Meratan politics around competing claims: continuation, inheritance, liberation, containment, restoration, survival.
- Expanded the Merathine Empire as **plateaued and overextended**.
- Added working entries for Cassidor, Maren River, Natari, Lorindale, Seradon, Vrasar, Banner-Sworn, Juna, Teutania, Isenfall, Dyrathi, Myrathi, Neresce, Sehrati, and Reshai.
- Added present flashpoints for 760 AS.
- Added a dedicated [Natari Development Questions](./content/lore/geopolitics.md:282) section with options and recommendations.

I also synced [timeline.md](./content/lore/timeline.md:171) so the Merathine Empire’s plateaued/overextended state is now fixed there too.

My recommendation for Natari: make it **not simply the old imperial capital**. The richest version is that Natari was a sacred/juridical capital, or a surviving legal refuge, while the Hegemony’s administrative heart was destroyed, lost, or transformed by the Spellbreak.

The next questions I’d answer together:

1. Was Natari the sacred/legal center, the surviving refuge, or the actual old capital?
2. If Natari was not the main capital, what happened to the true imperial center?
3. Should Natari’s factions be restorationists, continuity loyalists, and preservationists?
4. Why has no one conquered Natari: old defenses, political deterrence, taboo, treaties, or something stranger?
