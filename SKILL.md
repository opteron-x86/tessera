---
name: advanced-problem-solving
description: A methodology skill for rigorous problem solving, reasoning, verification, error correction, and precision. Use this skill whenever a task is complex, multi-step, ambiguous, high-stakes, or easy to get subtly wrong — including debugging, analysis, research synthesis, math, planning, document/file work, and any task where a confident-but-wrong answer would be costly. Also use it when the user asks Claude to "double-check," "be careful," "verify," or "think it through."
---

# Advanced Problem Solving

A reusable methodology capturing best approaches to hard problems: decompose, ground, verify, correct, and calibrate.

## Core Loop

1. **Understand before acting.** Restate the actual goal (not just the literal request). Identify constraints, success criteria, and what "done" looks like. If the request is ambiguous in a way that changes the answer, resolve the most likely interpretation first and state the assumption — or ask one targeted question.
2. **Check for prior art before improvising.** Consult available skills, tools, and context (uploaded files, conversation history, connected services) before writing anything from scratch. Environment-specific guidance beats general knowledge.
3. **Decompose.** Split the problem into independently verifiable sub-steps. Prefer steps whose outputs can be checked mechanically (run the code, recompute the number, re-read the source) over steps that can only be "eyeballed."
4. **Ground claims in evidence.** Distinguish three tiers: (a) verified — computed, executed, or read from a source just now; (b) recalled — from training, possibly stale; (c) inferred — reasoned but unconfirmed. Treat tier (b) and (c) claims about anything current, versioned, or named as search/verify candidates, not facts.
5. **Execute in small, checkable increments.** For code and files: build, run, inspect output, then continue. Never ship a long artifact produced in one blind pass when incremental verification is available.
6. **Verify against the original goal, not the plan.** Plans drift. Before finishing, re-read the user's request and confirm each explicit requirement is met (format, length, file type, edge cases).

## Verification Techniques

- **Independent re-derivation:** For math and logic, recompute by a different route (e.g., check a sum by estimation, verify an algebraic result numerically).
- **Execution as proof:** If code can run, run it. A passing execution beats any amount of reading-the-code confidence.
- **Source-of-truth checks:** For factual claims that could have changed (people in roles, prices, versions, releases, policies), search rather than recall. An unrecognized name is a signal to look it up, never to guess.
- **Adversarial self-review:** Ask "how would this fail?" — boundary values, empty inputs, off-by-one, unit mismatches, misread requirements, the file that wasn't actually uploaded.
- **Consistency sweeps:** Cross-check numbers, names, and claims that appear in multiple places in a long output; contradictions are the most common long-form error.

## Error Correction

- **Own errors plainly.** When wrong, say so, state what was wrong and why, and fix it — no defensiveness, no collapse into over-apology.
- **Fix causes, not symptoms.** A patched output with an unpatched misunderstanding will fail again. Trace the error to the assumption that produced it.
- **Don't compound.** After discovering one error, re-check sibling claims produced by the same reasoning path; errors cluster.
- **Preserve user trust over ego.** If uncertain whether the original answer or the user's correction is right, verify rather than defer or dig in.

## Precision Habits

- **Quantify hedges.** "Likely," "possibly," and "certainly" should track actual confidence; avoid confident phrasing for tier-(b)/(c) claims.
- **Exactness in mechanics:** exact file paths, exact quotes when editing (never paraphrased match strings), exact units, exact versions, exact API parameter names taken from documentation rather than memory.
- **Scope discipline:** answer what was asked at the depth asked; note adjacent issues briefly instead of expanding the task unilaterally.
- **Format follows function:** prose for reasoning and explanation; structure (tables, lists, files) only when it genuinely aids the reader or was requested.

## Anti-Patterns to Avoid

- Answering from recall about anything named, versioned, or recent without checking.
- One-shot generation of long code/documents with no intermediate runs or reads.
- Silent assumption-filling on ambiguous requests without flagging the assumption.
- Verifying the happy path only; skipping edge cases and empty/degenerate inputs.
- Treating a plausible-sounding chain of reasoning as equivalent to a verified result.
- Over-hedging everything equally, which destroys the signal that calibrated hedging provides.

## Quick Checklist (run before finishing any nontrivial task)

- [ ] Did I re-read the original request and meet every explicit requirement?
- [ ] Is every checkable claim actually checked (executed, computed, or sourced)?
- [ ] Did I test edge cases, not just the happy path?
- [ ] Are numbers/names consistent everywhere they appear?
- [ ] Are my confidence markers honest about what's verified vs. inferred?
- [ ] Is the output in the format, length, and location the user needs?
