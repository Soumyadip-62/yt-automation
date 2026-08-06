# Caspian AI Studio - UI Improvement Plan (v0.2)

## Goal

Improve the usability of the application by making generated content easier to review, reducing unnecessary scrolling, and creating a cleaner production workflow.

---

# 1. Redesign the Layout

## Objective

Make the application feel like a professional content studio rather than a long form.

## Desired Layout

---

## | Sidebar | Main Workspace | Asset Panel |

Main Workspace

- Topic Input
- Generate Button
- Video Metadata
- Scene Editor
- Preview
- Render Progress

Asset Panel

- Fixed width
- Independently scrollable
- Search
- Asset cards
- Replace asset
- Download status

---

# 2. Persistent Video Metadata

Currently:

After generation the title and metadata disappear or become difficult to reference.

Change to:

Keep generated metadata visible until a new generation starts.

Metadata should include:

- Video Title
- Description
- Hashtags
- Topic
- Duration
- Status

Allow:

- Copy Title
- Copy Description
- Copy Hashtags
- Edit Title
- Edit Description

This becomes the source of truth for the current video.

---

# 3. Sticky Asset Panel

Current Problem

The asset section grows with the page and forces the entire page to scroll.

Desired Behaviour

The Asset Panel should remain visible.

Only the asset list should scroll.

Layout

---

## Assets

Search

Filters

---

(scrollable)

Scene 1

Scene 2

Scene 3

Scene 4

Scene 5

---

The main page should not become thousands of pixels tall.

Implementation idea

- height: calc(100vh - header)
- overflow-y: auto
- position: sticky (or fixed depending on layout)

---

# 4. Scene Cards

Each scene should become a card.

Example

---

Scene 1

Narration

Visual Prompt

Asset Query

Selected Asset

Replace Button

Preview

---

Collapsed by default.

Expandable when editing.

---

# 5. Asset Selection Improvements

Each asset card should show

- Thumbnail
- Provider
- Resolution
- License
- Download Status
- Replace Button
- Preview Button

Highlight the selected asset.

---

# 6. Better Progress Tracking

Replace simple loading indicators with a pipeline.

Example

Script
✓

Scenes
✓

Assets
⏳

Voice
⌛

Render
⌛

Upload
⌛

Users should immediately know where the process is.

---

# 7. Better Page Sections

Organize the UI into logical cards.

1. Generate Script

2. Video Metadata

3. Scene Timeline

4. Asset Manager

5. Voice

6. Render

7. Publish

---

# 8. Sticky Action Bar

Keep important actions visible.

Actions

Generate

Save

Render

Upload

Reset

Should remain accessible while scrolling.

---

# 9. Better Visual Hierarchy

Use consistent spacing.

- Larger section headings
- Card based layout
- Rounded containers
- Clear dividers
- Better typography
- Less visual clutter

The interface should feel like a creative studio instead of a dashboard full of forms.

---

# 10. Future Ready

Design every section to support future features without major redesign.

Examples

Metadata

- SEO Score
- Estimated Read Time
- Trending Score

Assets

- Multiple providers
- Manual upload
- AI generated assets
- Asset history

Render

- Progress
- Logs
- Retry
- Download

Publish

- Schedule
- Multiple platforms
- Analytics

---

# Overall Goal

Transform the application into a modern AI content production studio where creators can move naturally through the workflow:

Generate
↓
Review Metadata
↓
Review Scenes
↓
Choose Assets
↓
Generate Voice
↓
Render
↓
Publish

Each stage should remain visible, editable, and easy to navigate without excessive page scrolling.
