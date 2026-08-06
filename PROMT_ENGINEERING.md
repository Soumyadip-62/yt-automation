# Caspian AI Studio - Prompt Improvement Plan (v0.2)

## Goal

Improve the quality of AI-generated content by producing:

- Better hooks
- Higher retention scripts
- More clickable titles
- Better scene planning
- More accurate visual search terms
- Better pacing for YouTube Shorts

---

# 1. Rewrite the Script Prompt

Current Problem

The scripts often sound like informative paragraphs instead of engaging short-form videos.

New Requirements

The AI should generate scripts that:

- Hook the viewer within the first 2 seconds.
- Sound conversational.
- Build curiosity.
- Reveal information progressively.
- End immediately after the final interesting fact.
- Never include intros or outros.
- Never ask viewers to subscribe.
- Fit naturally within 28–35 seconds.

Desired Structure

Hook

↓

Curiosity

↓

Interesting Fact

↓

Unexpected Twist

↓

Strong Ending

---

# 2. Improve Title Generation

Current Problem

Titles sometimes sound educational rather than clickable.

New Goal

Generate titles that maximize curiosity while remaining factual.

Good Examples

Can You Actually Hear Sound in Space?

What REALLY Happens Inside a Black Hole?

The Biggest Star Ever Found

Earth Wouldn't Notice This for 8 Minutes

Avoid

What is Dark Matter?

Understanding Orbital Mechanics

The Science Behind Gravity

The AI should generate 5 title options.

Rank them from strongest to weakest.

---

# 3. Better Scene Generation

Current Problem

Scenes sometimes describe the same thing repeatedly.

New Goal

Each scene should represent a unique visual.

Example

Scene 1

Hook

Scene 2

Problem

Scene 3

Explanation

Scene 4

Scale Comparison

Scene 5

Final Reveal

Every scene should introduce a new visual idea.

---

# 4. Separate Narration From Visuals

Current Problem

The narration and visual prompt are almost identical.

This leads to repetitive videos.

Instead

Narration explains.

Visuals support.

Example

Narration

"If the Sun disappeared right now..."

Visual

Timelapse of Earth rotating in darkness.

Not

"The Sun disappearing."

---

# 5. Better Pexels Search Terms

Current Problem

Search queries are too specific to astronomy.

Examples

"black hole"

"dark matter"

"Milky Way"

Pexels often has little or no matching footage.

Instead

Generate search terms based on what should be seen visually.

Examples

Narration

"You would drift alone through endless darkness."

Bad Search

black hole

Better Search

deep space
stars
galaxy
space background
cosmic
floating
dark sky

Narration

"The explosion was brighter than billions of Suns."

Bad Search

supernova

Better Search

explosion
energy
fire
light burst
nebula
space clouds

Narration

"Time slows near a black hole."

Bad Search

time dilation

Better Search

clock
slow motion
spiral
space
abstract
light tunnel

The AI should generate:

- Primary Search
- Alternative Search 1
- Alternative Search 2

These should describe visuals instead of scientific terminology.

---

# 6. Generate Asset Intent

Each scene should include a visual intent.

Examples

Close-up

Wide Shot

Timelapse

Animation

Slow Motion

Macro

Abstract

Comparison

POV

Cinematic

This will improve future support for AI image/video generation.

---

# 7. Add Emotion Tags

Every scene should contain an emotion.

Examples

Wonder

Fear

Mystery

Shock

Curiosity

Scale

Isolation

Beauty

This allows animations, music, and pacing to match the narration.

---

# 8. Estimate Video Length

The AI should estimate narration duration.

If the script exceeds 35 seconds:

Flag it.

Suggest trimming.

Target

28–35 seconds.

---

# 9. Quality Scoring

Before returning results, score the script.

Hook Strength

Curiosity

Retention Potential

Visual Variety

Mass Appeal

Scientific Accuracy

Overall Score

Only scripts scoring 8.5/10 or higher should be considered production-ready.

---

# 10. JSON Improvements

Each scene should return:

{
"scene": 1,
"duration": 6,
"narration": "...",
"visual_description": "...",
"visual_intent": "Wide Shot",
"emotion": "Wonder",
"pexels_search": [
"deep space",
"stars",
"galaxy"
],
"fallback_search": [
"nebula",
"cosmic clouds",
"universe"
]
}

This separates narration from visual search and makes the rendering pipeline more reliable.

---

# Overall Goal

The AI should think like a short-form content creator, not a textbook writer.

Every output should be optimized for:

- Viewer retention
- Strong hooks
- Fast pacing
- Visual storytelling
- High-quality asset retrieval
- Minimal editing before rendering
