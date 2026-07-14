# AI Space Shorts Studio

## Overview

AI Space Shorts Studio is a full-stack web application that automates the creation of educational YouTube Shorts focused on space, astronomy, and science.

The goal is not to completely replace human creativity, but to automate repetitive tasks such as research, scripting, asset collection, video rendering, and publishing.

The project is designed with a modular architecture so every component can be replaced or improved independently.

---

# Primary Goals

- Generate high-quality YouTube Shorts about space and astronomy.
- Reduce manual work using AI.
- Produce factually accurate content.
- Build a scalable content production pipeline.
- Support future expansion into multiple niches.

---

# High Level Workflow

```
Topic
    ↓
AI Research
    ↓
Script Generation
    ↓
Scene Planning
    ↓
Asset Collection
    ↓
Voice Generation
    ↓
Video Rendering
    ↓
YouTube Upload
```

---

# Core Modules

## AI Module

Responsible for generating:

- Script
- Title
- Description
- Hashtags
- Scene breakdown
- Search keywords

Uses Gemini API.

---

## Asset Module

Responsible for collecting media for each scene.

Possible providers include:

- NASA Image & Video Library
- Pexels
- Wikimedia Commons
- AI Image Generation (fallback)

The module should expose a common interface so providers can be swapped without affecting the rest of the application.

---

## Storage Module

Stores:

- Generated scripts
- Downloaded assets
- Metadata
- Rendered videos

Object storage should be used instead of local server storage.

---

## Rendering Module

Responsible for creating the final video.

Responsibilities include:

- Scene sequencing
- Captions
- Camera animations
- Background music
- Voice synchronization
- Final MP4 export

Implementation should remain independent of AI generation.

---

## Publishing Module

Responsible for:

- YouTube upload
- Scheduling
- Metadata submission
- Thumbnail upload
- Analytics retrieval (future)

---

# Design Principles

- Modular architecture
- Replaceable providers
- Strong typing
- JSON-driven workflow
- Minimal manual intervention
- Retry-friendly pipeline
- Easy debugging

---

# Project Philosophy

Every stage should produce structured data instead of tightly coupling components together.

Example:

```
Topic
    ↓
Script JSON
    ↓
Scene JSON
    ↓
Asset JSON
    ↓
Render JSON
```

Each module only understands the JSON it receives and does not depend on internal implementation details of previous modules.

---

# Future Features

- Trend detection
- AI fact checking
- Multiple languages
- Multiple content niches
- AI voice selection
- Automatic thumbnail generation
- Content scheduling
- Analytics dashboard
- Asset caching
- Multi-platform publishing (YouTube, Instagram, TikTok)

---

# Overall Vision

The application should function as an AI-assisted content production studio rather than a simple script generator.

A creator provides only a topic. The system handles research, writing, asset discovery, rendering, and publishing while allowing manual review at any stage.

The architecture should remain flexible enough to support new AI models, media providers, and publishing platforms without requiring major changes to the overall system.