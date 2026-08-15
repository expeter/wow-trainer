# Anonymized L’ura trainer survey summary

Source: 22 guild responses collected in August 2026. This summary deliberately
removes names and avoids attributable verbatim free text.

## Participation and usefulness

- 16 respondents said they used the guild’s L’ura trainer.
- 5 said they did not use a simulator.
- 1 did not answer the usage question.
- 5 responses rated the trainer clearly helpful.
- 10 rated it somewhat helpful.
- 2 rated it not helpful.

The usefulness question received an answer from 17 people, so these counts
should not be presented as percentages of all 22 without stating the
denominator.

## Practice areas and time

Selected phase answers, including multi-selects:

- Phase 1: 2 explicit selections.
- Intermission: 9.
- Phase 2: 10.
- Phase 3: 12.
- Phase 4: 10.
- All phases: 5.

Reported practice time:

- About 10 minutes: 3.
- About 30 minutes: 4.
- More than 30 minutes: 8.
- Until no mistakes remained: 2.

The phase counts overlap because respondents could select several phases and
some selected “All” as well as individual phases.

## Future demand

- 18 expected they would use another guild trainer.
- 2 would use one only for selected difficult mechanics.
- 2 did not want another dedicated simulator.

In the separate next-season willingness question, 9 answered definitely, 4
probably, 2 only for particularly complex mechanics, and 2 rather not. Empty
answers account for the remaining responses.

## Strong positive themes

### Spatial rehearsal

The clearest value was converting a video or explanation into remembered
movement paths and positions. Players reported that interactive rehearsal made
route choices and movement minimization easier to understand even after they
had watched the fight repeatedly.

### Situational awareness

Interrupt order, movement mechanics, personal responsibilities and reacting to
visible state were considered suitable trainer material.

### Preparation and recruitment value

Respondents saw particular value in having a trainer before the first pull and
in using unusual guild tooling as a recruitment/co-development strength.

## Friction and requested improvements

### Camera and input

Several responses mentioned camera control. Requests included a top-down view,
more keyboard control, mouse movement closer to WoW, and both mouse buttons to
move forward. One non-user described the controls as feeling wrong compared
with the game.

Product response:

- Provide a simplified Learn 2D mode.
- Preserve detailed Train 3D.
- Add WoW-like mouse-forward behavior and keep rebindable keyboard/mouse
  controls.
- Avoid requiring camera practice in the teaching mode.

### Role-specific practice

A tank respondent could not adequately practice boss frontal ownership or
leading movement and felt like a damage dealer instead.

Product response:

- Make roles and role actions part of the encounter package contract.
- Support tank ownership, taunt/swap and encounter-specific extra actions.
- Let tactics choose the controlled role and assignment.

### NPC responsibility

NPC failures in Hard mode were demotivating because the player could wipe
without understanding or owning the error.

Product response:

- Reliable deterministic bots by default.
- Explicitly attribute every failure.
- Allow bot mistakes only in a labelled coordination/recovery drill.

### Excess generic actions

Some feedback favored keeping the trainer simpler and removing generic potion
or health-action simulation while retaining useful encounter actions such as
interrupts.

Product response:

- Remove global potion/shield/Main-ability requirements.
- Show actions only when the selected encounter and role provide them.

### Adoption limits

Non-use was attributed to limited time/opportunity, missing the announcement,
feeling already prepared, preferring in-game practice, and personal reluctance.
Two respondents selected no future simulator.

Product response:

- Do not attempt to recreate every boss merely for completeness.
- Prioritize mechanics with clear interactive learning value.
- Offer short direct drills and make the trainer available early.
- Treat usage statistics as product evidence, not as pressure on individual
  guild members.

## Architectural implications

- The reviewed shell, accessibility and controls are reusable platform work.
- Learn 2D and Train 3D solve different feedback themes and should not be forced
  into one simulation.
- Encounter packages need explicit roles, actions, tactics, timing provenance,
  failure ownership and bot policy.
- Public analytics should distinguish attempts, sessions/devices and
  authenticated players.
- Achievements and competitive scoring should not block encounter learning.
