# Technology Stack

## Overview

Rewind is a nostalgia discovery platform that helps users rediscover forgotten songs, cultural moments, and memories from their formative years.

The architecture prioritizes:

* Fast MVP development
* Low operational overhead
* Scalability for future AI features
* Strong support for content-driven experiences

---

# Architecture Principles

## Build for Content First

The initial product is primarily driven by:

* Historical music datasets
* Cultural memory datasets
* Visual memory triggers

Complex machine learning is not required for MVP.

The focus is on delivering emotionally resonant experiences through curated data.

---

## AI as an Enhancement Layer

AI is used to:

* Generate memory narratives
* Explain cultural moments
* Improve recommendations

AI is not responsible for determining core nostalgia relevance.

The nostalgia engine should remain deterministic and explainable.

---

# Frontend

## Framework

Next.js 15

Reason:

* Fast development
* Server-side rendering
* SEO-friendly
* Large ecosystem
* Excellent Vercel integration

---

## Language

TypeScript

Reason:

* Better maintainability
* Safer data modeling
* Improved AI-generated code quality

---

## Styling

Tailwind CSS

Reason:

* Fast iteration
* Consistent design system
* Easy AI-assisted development

---

## UI Components

shadcn/ui

Reason:

* Modern design language
* Accessible components
* Easy customization

---

## Animation

Framer Motion

Used for:

* Timeline transitions
* Memory card reveals
* Nostalgia discovery interactions

---

# Backend

## Primary Backend

Next.js Server Actions

Reason:

* Simpler architecture
* No separate backend deployment
* Faster MVP delivery

For MVP:

Frontend and backend remain inside a single codebase.

---

## Future Upgrade Path

If scale becomes necessary:

* Next.js Frontend
* NestJS Backend

This is not required initially.

---

# Database

## Primary Database

PostgreSQL

Hosted on Supabase

Reason:

* Reliable
* Familiar
* Excellent developer experience
* Easy authentication integration
* Supports structured nostalgia data

---

## ORM

Prisma

Reason:

* Excellent TypeScript support
* Easy schema management
* Strong AI coding compatibility

---

# Authentication

## Provider

Supabase Auth

Methods:

* Google Login
* Apple Login
* Email Login

Reason:

Avoid building authentication manually.

---

# Content Storage

## Images

Supabase Storage

Stores:

* Memory trigger images
* Era thumbnails
* User-generated content (future)

---

# Music Integration

## iTunes Search API (Apple)

Free public API. No credentials, no API key, no user account required.

Used for:

* Album artwork (600×600, cached at enrichment time)
* 30-second song previews (AAC, cached at enrichment time)

Data is populated once via `scripts/enrich-spotify.ts` and stored in the `Song` table. Zero API calls at runtime.

---

## Future Integrations

Potential:

* Apple Music API
* YouTube Music API
* KKBOX API

Particularly valuable for Asian markets.

---

# AI Layer

## Primary Model

OpenAI API

Usage:

* Memory narratives
* Timeline descriptions
* Cultural moment summaries
* Personalized nostalgia storytelling

Example:

"You were 14 years old in 2007. This was the era of MSN Messenger, Friendster and Bluetooth song sharing..."

---

## AI Guardrails

AI should never invent songs.

AI should only enrich experiences based on verified nostalgia datasets.

---

# Search

## MVP

PostgreSQL Full Text Search

Supports:

* Song search
* Artist search
* Memory search

---

## Future

Vector Search

Potential providers:

* pgvector
* Pinecone

Used for:

* Similar memories
* Similar eras
* Nostalgia clustering

Not required for MVP.

---

# Analytics

## Product Analytics

PostHog

Track:

* Songs remembered
* Songs forgotten
* Memory trigger engagement
* Timeline completion rate

Reason:

Understanding nostalgia patterns is a core product advantage.

---

# Recommendation Engine

## MVP

Rule-Based Engine

Inputs:

* Birth year
* Region
* Language
* Historical popularity
* Forgotten Gem score

Outputs:

* Timeline recommendations
* Forgotten Gems
* Memory Triggers

No machine learning required.

---

# Forgotten Gem Engine

Formula:

Forgotten Gem Score

=
Historical Popularity
×
Age Relevance
×
Regional Relevance
×
Memory Trigger Score

÷
Current Popularity

Higher score = stronger nostalgia candidate

---

# Data Sources

## Music

Sources:

* Billboard archives
* Spotify charts
* Regional music charts
* Public music datasets

---

## Cultural Memory Data

Curated database containing:

* Technology trends
* Popular websites
* Games
* TV shows
* Internet culture
* Fashion trends

Mapped by:

* Year
* Region

Example:

2007
Malaysia

Memory Triggers:

* Friendster
* MSN Messenger
* MapleStory
* Sony Ericsson Walkman

---

# Deployment

## Hosting

Vercel

Reason:

* Optimized for Next.js
* Fast deployments
* Excellent developer experience

---

## Database Hosting

Supabase

---

# Monitoring

## Error Tracking

Sentry

Track:

* Frontend errors
* API failures
* Spotify integration issues

---

# MVP Infrastructure Diagram

User

↓

Next.js Application

↓

Server Actions

↓

Supabase PostgreSQL

↓

Spotify API

↓

OpenAI API

↓

Memory Timeline

↓

Forgotten Gems

↓

Memory Triggers

---

# Future Vision

The platform evolves into a Memory Graph.

User
→ Life Stage
→ Cultural Moment
→ Memory Trigger
→ Song
→ Emotion

The long-term goal is not music recommendation.

The goal is reconstructing forgotten chapters of a user's life through data, nostalgia, and storytelling.
