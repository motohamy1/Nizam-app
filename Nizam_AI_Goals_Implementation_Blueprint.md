# Nizam — AI Goals System Implementation Blueprint

## Document Purpose

This blueprint defines the complete implementation of the next-generation **AI Goals System** for the Nizam app.

The feature must transform the existing AI goal generator from a simple "generate a goal" interaction into an **Intent-Driven Goal Architect** that:

1. Understands exactly what the user means.
2. Identifies the core goal, goal type, domain, purpose, and timeframe.
3. Chooses suitable existing categories/sections and integrates with Nizam's current smart linking model.
4. Recommends **up to 3** suitable goal presentation/framework templates instead of silently choosing one.
5. Lets the user choose the template.
6. Renders the user's goal inside the chosen template without changing the user's intent.
7. Lets the user optionally expand the goal into milestones, sub-goals, sub-categories, and/or projects.
8. Keeps the interaction conversational and iterative.
9. Makes every AI-generated field editable/deletable/reorderable.
10. Preserves compatibility with the existing Nizam database, offline behavior, goals, projects, categories, tasks, insights, and other features.
11. Isolated implementation: this feature must not change or break unrelated app behavior.

---

# 1. Existing Nizam Architecture That Must Be Preserved

The current Nizam project already has the following foundation:

- `components/AIGoalGeneratorModal.tsx`
- `convex/aiGoals.ts`
- `constants/goalTemplates.ts`
- `convex/yearlyGoals.ts`
- `convex/schema.ts`

The existing `yearlyGoals` schema already supports:

- `year`
- optional `month`
- optional `day`
- `text`
- `description`
- `category`
- `color`
- `icon`
- `templateId`
- `milestones`
- `categoryId`
- `subCategoryId`
- `projectId`
- `tag`
- `hashtags`
- ordering/completion metadata
- offline `localId`

The current CRUD also already supports goal creation, updates, deletion, category/project linking, and separate Month/Day queries.

Projects already support:

- `categoryId`
- `subCategoryId`
- `goalId`

Tasks also already support `goalId`, `projectId`, categories, parent tasks, etc.

Therefore:

> **Do not replace the existing Goal/Project/Task system.**

The new AI Goal system is an orchestration layer that sits above it.

---

# 2. Isolation Principle

## Mandatory rule

Changes belonging to this feature must be isolated to AI Goals.

### Allowed areas to modify

Prefer modifying/adding only:

```text
components/
  AIGoalGeneratorModal.tsx
  ai-goals/
    AIGoalChat.tsx
    AIGoalPreview.tsx
    AIGoalTemplatePicker.tsx
    AIGoalExpansionPanel.tsx
    AIGoalConversation.tsx
    AIGoalFieldEditor.tsx
    AIGoalMilestoneEditor.tsx

convex/
  aiGoals.ts
  aiGoalSessions.ts          (new, only if persistence is needed)

constants/
  goalTemplates.ts
  aiGoalTemplates.ts         (new, preferred if separation is cleaner)

types/
  aiGoals.ts                 (new)

utils/
  aiGoalValidation.ts        (new)
  aiGoalIntent.ts            (new)
```

### Do NOT modify unrelated systems unless a tiny integration is strictly necessary

Do not change:

- task logic
- reminders
- notes
- calendar logic
- insights algorithms
- authentication
- offline sync architecture
- project CRUD behavior
- unrelated screens
- navigation behavior
- global theme
- existing goal rendering outside the AI-generated goal flow

### Integration rule

The AI Goals feature may **call** existing APIs/mutations/queries, but should not rewrite their behavior.

Examples:

```text
AI Goal → existing yearlyGoals.addGoal
AI Goal → existing yearlyGoals.updateGoal
AI Goal → existing project mutation
AI Goal → existing category mutation
AI Goal → existing task mutation
```

The feature owns orchestration; existing modules continue owning persistence/business rules.

---

# 3. Product Definition

The new system is:

> **AI Goal Architect**

not:

> AI Goal Generator

The AI should not optimize for producing more text.

It should optimize for:

> **accurately representing the user's intention inside Nizam's system.**

Core pipeline:

```text
Natural Language
      ↓
Intent Understanding
      ↓
Goal Identity
      ↓
Goal Type
      ↓
Domain / Category Mapping
      ↓
Template Recommendation (max 3)
      ↓
User Template Selection
      ↓
Goal Rendering
      ↓
Optional Expansion
      ↓
Conversational Refinement
      ↓
User Final Review
      ↓
Save / Link into Nizam
```

---

# 4. Core User Experience

## Example input

User writes:

> "make me a goal to finish flutter and build some small apps to fully understand flutter"

The AI must understand:

```json
{
  "coreSubject": "Flutter",
  "primaryIntent": "learn/master",
  "supportingOutcome": "build small apps",
  "purpose": "fully understand Flutter",
  "goalType": "learning_with_practice",
  "domain": "software_development",
  "timeframe": "contextual"
}
```

It must NOT reinterpret it as:

- career growth
- generic productivity
- health
- finance
- random projects
- reading books
- unrelated courses

unless the user explicitly asks for them.

---

# 5. Goal Intent Model

Create a normalized internal model.

Suggested TypeScript:

```ts
export type AIGoalType =
  | "learning"
  | "project"
  | "fitness"
  | "health"
  | "habit"
  | "financial"
  | "academic"
  | "career"
  | "creative"
  | "personal"
  | "mixed"
  | "custom";

export type AIGoalIntent = {
  rawInput: string;

  coreSubject: string;
  corePurpose: string;

  goalType: AIGoalType;
  domain: string;

  desiredOutcome?: string;
  supportingOutcomes?: string[];

  timeframe: "day" | "month" | "year";

  measurableSignals?: string[];
  explicitUserItems: string[];

  confidence?: {
    coreIntent: number;
    type: number;
    category: number;
  };
};
```

The intent model is internal to AI Goals.

Do not store it in `yearlyGoals` unless there is a future product requirement to persist it.

---

# 6. Critical AI Rule: Preserve Intent

The AI must distinguish between:

### Explicit user intent

User:

> learn Flutter

AI must not turn that into:

> finish a Flutter course, publish an app, get a job, build a portfolio, post on LinkedIn...

Those are possible suggestions only in the **optional expansion stage**, never as hidden assumptions.

### Explicitly implied supporting activity

User:

> learn Flutter and build some small apps to fully understand Flutter

Allowed interpretation:

```text
Learn Flutter
+
Practice by building small apps
=
one coherent mastery goal
```

### Unrelated invented content

Not allowed:

```text
Read 2 books
Exercise 3x/week
Create a GitHub portfolio
Post to LinkedIn
Study Dart for 30 days
```

unless the user asks for these.

---

# 7. Goal Title Intelligence

The title should express the **actual purpose**.

Bad:

```text
Technology Growth
Monthly Progress
Flutter Goal
Learning Objective
```

Better:

```text
Master Flutter Through Practice
Flutter Mastery: Learn → Build → Understand
From Flutter Fundamentals to Real Apps
```

The AI may generate 1 primary title and optionally 1–2 alternatives internally.

Default displayed title should be concise and outcome-oriented.

Title requirements:

- specific
- recognizable
- related to user's core subject
- outcome-oriented
- not generic
- no fake motivational language
- no unrelated scope expansion

---

# 8. Category / Section Intelligence

The system already has existing section/category concepts.

The AI should first attempt to map the goal to the user's existing relevant category.

### Example

Existing categories:

```text
Career & Projects
Technology
Health
Learning
Finance
```

User:

> learn Flutter

Recommended:

```text
Technology
```

User:

> learn Flutter to become a better mobile developer

Potential category:

```text
Technology
```

User:

> learn Flutter and build 3 portfolio apps for job applications

Potential category:

```text
Career & Projects
```

The distinction is based on **purpose**, not just keyword matching.

---

# 9. Category Selection Contract

Return:

```ts
type AICategoryRecommendation = {
  recommendedCategory: {
    mode: "existing" | "new";
    existingCategoryId?: string;
    name: string;
    description?: string;
  };

  alternatives: Array<{
    existingCategoryId?: string;
    name: string;
    reason: string;
  }>;

  createNewCategory: boolean;
};
```

### Important

The AI should NOT create a new category automatically when a reasonable existing one exists.

Creation should happen only if:

1. no suitable existing category exists, AND
2. the user accepts the new category.

---

# 10. Smart Linking

The AI should understand these existing relationships:

```text
Goal
├── Category
├── Sub-category
├── Project
└── Tasks
```

Existing Nizam data should be fed as context to the AI when relevant:

```text
existing categories
existing subcategories
existing projects
existing related goals
```

The AI may recommend:

```text
Link this goal to:
Technology
   └── Mobile Development
```

or:

```text
Goal: Master Flutter
Project: Flutter Learning Lab
```

But:

> Never automatically create/link entities without a clear user-facing confirmation when the action creates a new persistent entity.

Safe default:

```text
AI recommends
↓
User confirms
↓
Existing mutation creates/links
```

---

# 11. Goal Templates: Separate Structure From Visual Style

Current goal UI templates include concepts such as:

- roadmap
- checklist
- metric
- sprint
- pillar

Keep these IDs backward compatible.

However, introduce a more explicit separation:

## A. Goal Framework

Defines how content is structured.

```text
roadmap
checklist
metric
sprint
pillar
```

## B. Visual Style

Defines appearance.

Suggested visual styles:

```text
paper
book
glass
editorial
minimal
dark-capsule
notebook
```

This allows combinations:

```text
Roadmap + Book
Roadmap + Paper
Checklist + Glass
Metric + Editorial
Pillar + Minimal
```

Do not force visual style into the existing `templateId` if that risks breaking stored goals.

Preferred compatibility shape:

```ts
type AIGoalPresentation = {
  frameworkId: string;
  visualStyleId: string;
};
```

For old persisted goals:

```text
frameworkId = existing templateId
visualStyleId = default
```

---

# 12. Template Recommendation Rules

The AI should recommend **maximum 3 templates**.

Never show the entire template library after every prompt.

Recommendation should be ranked internally but not exposed as numeric scoring unless the product explicitly wants it.

Return:

```ts
type AITemplateRecommendation = {
  templateId: string;
  visualStyleId: string;
  reason: string;
  fit: "primary" | "alternative";
};
```

Example for:

> learn Flutter and build some small apps

Recommended:

```text
1. Roadmap + Book
   "Best fit for progressive learning and mastery."

2. Roadmap + Paper
   "Works well for a clear learning path with milestones."

3. Checklist + Glass
   "Better if you want a simple action-oriented view."
```

---

# 13. Template Recommendation Examples

## Learning

Input:

> Finish a React course and practice each concept

Recommend:

```text
Roadmap + Book
Roadmap + Editorial
Checklist + Paper
```

## Project

Input:

> Build a medical chat app MVP

Recommend:

```text
Roadmap + Dark Capsule
Checklist + Editorial
Sprint + Glass
```

## Quantified goal

Input:

> Read 100 pages every week

Recommend:

```text
Metric + Minimal
Checklist + Paper
Sprint + Glass
```

## Habit

Input:

> Exercise 4 times every week

Recommend:

```text
Pillar + Minimal
Metric + Editorial
Checklist + Paper
```

## Financial

Input:

> Save $1,000 this month

Recommend:

```text
Metric + Editorial
Checklist + Glass
Pillar + Minimal
```

---

# 14. Template Selection Flow

After analysis, show:

```text
Your Goal
Master Flutter Through Practice

Choose how you want it to look:

[ Book Roadmap ]
Progressive learning structure
Best match

[ Paper Roadmap ]
Clear milestone path

[ Glass Checklist ]
Simple actionable format
```

The user chooses.

Only after selection should the system create the final presentation state.

---

# 15. Rendering Principle

The selected template is only a **container**.

The AI must adapt the user's content to the container.

It must not modify the underlying intent to fit the template.

Example:

User:

> Learn Flutter and build small apps.

Selected:

```text
Book Roadmap
```

Rendered:

```text
MASTER FLUTTER THROUGH PRACTICE

Purpose
Build a strong practical understanding of Flutter by learning core concepts and reinforcing them through small apps.

Progress path
[Learning]
[Practice]
[Build]
[Validate]
```

The framework may determine visual grouping, but it must not invent unrelated content.

---

# 16. Initial Generation Must NOT Auto-Expand

The initial request should create:

```text
core goal
description
category recommendation
template recommendations
visual preview
```

Milestones/sub-goals should be empty unless explicitly stated.

This preserves the user's choice.

Example:

User:

> make me a goal to learn Flutter

Initial:

```text
Goal:
Master Flutter

Milestones:
[]
```

Then ask:

> "Want to add milestones, sub-goals, projects, or other details?"

---

# 17. Conversational Expansion

After the first draft, the AI asks:

```text
Is this the complete goal, or would you like to add more structure?
```

Suggested actions:

```text
+ Add sub-goals
+ Add milestones
+ Add projects
+ Add sub-category
+ Add notes
+ Continue chatting
✓ Finish goal
```

The user can always choose:

```text
Finish goal
```

at any stage.

---

# 18. Expansion Conversation

If user says:

> yes

AI asks:

```text
What would you like to add?

I can:
• suggest a structure
• use your own items
• do both
```

Do not immediately generate a long plan.

---

# 19. AI Suggested Expansion

For:

> Master Flutter Through Practice

AI may suggest:

```text
Suggested structure:

1. Flutter Fundamentals
2. UI & Layout
3. State Management
4. Navigation & Architecture
5. Build Small Apps
```

Then:

> "I can add these as milestones. Want to keep them as-is, edit them, or choose your own?"

This is critical.

Suggestions are **proposals**, not automatic truth.

---

# 20. User-Defined Expansion

User:

> add Riverpod, Firebase and build a weather app

AI should update the goal:

```text
Existing:
Flutter mastery

Added:
- Riverpod
- Firebase
- Weather App
```

It must preserve previously accepted content.

---

# 21. Expansion Types

The conversation engine must recognize:

```text
milestone
sub-goal
sub-category
project
note
resource
constraint
metric
deadline
priority
```

Not everything should be forced into `milestones`.

---

# 22. Goal Hierarchy

Recommended semantic model:

```text
Goal
│
├── Sub-goals
│     ├── Milestone
│     ├── Milestone
│     └── Milestone
│
├── Categories / Sub-categories
│
├── Projects
│     └── Tasks
│
└── Notes / Metadata
```

Important distinction:

### Goal

Why / what outcome?

### Sub-goal

Major component of the outcome.

### Milestone

Concrete checkpoint.

### Project

Work container producing something.

### Task

Action.

---

# 23. Example Hierarchy

User:

> Learn Flutter and build 3 small apps.

Correct interpretation:

```text
Goal
└── Master Flutter Through Practice
    │
    ├── Sub-goal
    │   └── Learn Flutter Fundamentals
    │
    ├── Sub-goal
    │   └── Practice State Management
    │
    └── Sub-goal
        └── Build Small Apps
            ├── Weather App
            ├── Notes App
            └── Expense App
```

Do NOT flatten everything into one long milestone array if the user explicitly asks for hierarchy.

---

# 24. Existing Database Compatibility Strategy

The current `yearlyGoals.milestones` structure is simple:

```ts
{
  id: string;
  text: string;
  isCompleted: boolean;
}
```

Keep it for backward compatibility.

Do not immediately redesign the entire database.

### Phase 1

Use existing milestones for:

- simple milestones
- lightweight sub-steps

### Phase 2, only if product requirements demand true hierarchy

Introduce a separate isolated table such as:

```text
aiGoalNodes
```

or a more domain-neutral structure if approved.

Do not migrate all current goals.

Old goals remain valid.

---

# 25. Recommended Draft Model

Create an internal client-side type:

```ts
type AIGoalDraft = {
  localDraftId: string;

  intent: AIGoalIntent;

  goal: {
    title: string;
    description: string;
  };

  category: {
    selectedName: string;
    existingCategoryId?: string;
    proposedNew: boolean;
    subCategoryId?: string;
  };

  presentation: {
    frameworkId: string;
    visualStyleId: string;
  };

  templateOptions: AITemplateRecommendation[];

  milestones: Array<{
    id: string;
    text: string;
    isCompleted: boolean;
  }>;

  suggestedProjects: Array<{
    localDraftId: string;
    name: string;
    description?: string;
  }>;

  notes?: string[];

  conversationState: AIGoalConversationState;

  dirtyByUser?: {
    title?: boolean;
    description?: boolean;
    category?: boolean;
    presentation?: boolean;
    milestones?: boolean;
  };
};
```

---

# 26. Conversation State Machine

Use explicit states instead of scattered booleans.

Suggested:

```ts
type AIGoalConversationState =
  | "idle"
  | "analyzing"
  | "awaiting_template"
  | "reviewing"
  | "asking_expansion"
  | "expanding"
  | "refining"
  | "final_review"
  | "saving"
  | "completed"
  | "error";
```

State flow:

```text
idle
 ↓
analyzing
 ↓
awaiting_template
 ↓
reviewing
 ↓
asking_expansion
 ├── finish → final_review
 └── expand → expanding
                 ↓
              reviewing
                 ↓
          asking_expansion
```

Never make `Finish` inaccessible.

---

# 27. Conversation Message Model

Use:

```ts
type AIGoalMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  type:
    | "text"
    | "template-options"
    | "goal-preview"
    | "expansion-options"
    | "suggestion"
    | "confirmation";
  content: string;
  timestamp: number;
};
```

The current chat UI can render these message types differently.

---

# 28. Never Let AI Mutate the Draft Without an Action Result

AI responses should be represented as operations.

Preferred internal contract:

```ts
type AIGoalOperation =
  | { type: "set_goal"; ... }
  | { type: "set_category"; ... }
  | { type: "set_presentation"; ... }
  | { type: "add_milestone"; ... }
  | { type: "update_milestone"; ... }
  | { type: "remove_milestone"; ... }
  | { type: "add_project_suggestion"; ... }
  | { type: "add_note"; ... }
  | { type: "finish" };
```

This allows the frontend to:

1. preview changes
2. validate them
3. apply them
4. allow undo
5. preserve user edits

---

# 29. User-Authored Data Has Higher Priority Than AI Data

Priority order:

```text
1. Explicit user input in latest message
2. Previously accepted user data
3. Existing Nizam data
4. AI suggestions
5. AI defaults
```

Example:

AI generated:

```text
Build 3 apps
```

User says:

> remove the expense app

The expense app must be removed even if AI originally considered it useful.

---

# 30. User Edits Must Be Protected

If user manually edits:

```text
Title = "Flutter Mastery"
```

Then later says:

> add Riverpod

AI must not silently replace the title.

Likewise:

```text
User manually chooses Glass
```

Later:

> add Firebase

AI must keep Glass unless user asks to change appearance.

---

# 31. Refinement Engine

Existing `refineGoalIntent` can evolve into a full conversational modifier.

Support:

```text
"make the title shorter"
"change it to a yearly goal"
"remove milestone 2"
"add Riverpod"
"make this more project-focused"
"use the paper style"
"put this under Mobile Development"
"turn the three apps into projects"
"make it less ambitious"
```

The AI must return only the changes necessary.

---

# 32. Refinement Examples

## Example A

User:

> "Make the title shorter."

Before:

```text
Master Flutter Through Hands-On Practice and Small Application Building
```

After:

```text
Flutter Mastery
```

Nothing else changes.

## Example B

User:

> "remove Firebase"

Only Firebase-related content is removed.

## Example C

User:

> "Make it a daily goal."

The timeframe context changes to `day`, but the feature must not automatically invent unrelated daily tasks.

---

# 33. Day / Month / Year Semantics

These are not three different AI systems.

They are three scopes.

## Year

Optimize for:

```text
direction
major outcomes
long-term milestones
large projects
```

Example:

> Become proficient in Flutter and build a portfolio of real applications.

## Month

Optimize for:

```text
concrete achievement
phases
deliverables
```

Example:

> Complete Flutter fundamentals and build 2 small apps.

## Day

Optimize for:

```text
immediate execution
small measurable outcome
focused completion
```

Example:

> Complete Flutter widget fundamentals and build one small UI screen.

---

# 34. Timeframe Guardrail

If user is in Daily Goals and writes:

> "Master Flutter"

The AI must not create:

```text
Master Flutter completely
```

as if the entire mastery can happen today.

Instead:

```text
Today:
Complete Flutter widget fundamentals and build one small practice screen.
```

But this is a **scope adaptation**, not invention.

If the user explicitly wants to put a large goal on a day, preserve it and let the user choose.

---

# 35. Initial Generation API

The existing:

```ts
architectGoalIntent
```

should evolve.

Suggested request:

```ts
{
  userMessage,
  timeframe,
  year,
  month?,
  day?,
  existingSections,
  existingCategories,
  existingSubCategories,
  existingProjects,
  existingRelatedGoals,
  previousGoalsInSession,
  language
}
```

Suggested response:

```ts
{
  intent,
  goal,
  categoryRecommendation,
  templateRecommendations,
  suggestedExpansionQuestion,
  aiResponseText
}
```

Do not return only a single `suggestedTemplateId`.

---

# 36. Initial AI JSON Contract

Use a strict schema similar to:

```json
{
  "intent": {
    "coreSubject": "Flutter",
    "corePurpose": "fully understand Flutter through learning and practice",
    "goalType": "learning",
    "domain": "software_development",
    "desiredOutcome": "practical understanding of Flutter",
    "supportingOutcomes": ["build small apps"]
  },
  "goal": {
    "title": "Flutter Mastery",
    "description": "Build a strong practical understanding of Flutter by learning its core concepts and reinforcing them through small apps."
  },
  "categoryRecommendation": {
    "mode": "existing",
    "existingCategoryId": "CATEGORY_ID",
    "name": "Technology",
    "reason": "The goal is primarily technical learning."
  },
  "templateRecommendations": [
    {
      "frameworkId": "roadmap",
      "visualStyleId": "book",
      "reason": "A progressive learning path fits the goal."
    },
    {
      "frameworkId": "roadmap",
      "visualStyleId": "paper",
      "reason": "Clear milestone progression."
    },
    {
      "frameworkId": "checklist",
      "visualStyleId": "glass",
      "reason": "Works well for an action-oriented learning plan."
    }
  ],
  "suggestedMilestones": [],
  "nextStep": "ask_expand",
  "aiResponseText": "I shaped this around Flutter mastery and hands-on practice. Choose the presentation you like, then we can add milestones or projects."
}
```

---

# 37. Hard Validation Rules

After LLM output, validate with TypeScript.

Reject or repair:

- invalid template IDs
- more than 3 template recommendations
- unknown framework IDs
- empty goal title
- unrelated category
- invented unsupported entities
- malformed IDs
- duplicate milestones
- invalid language
- malformed JSON
- extra output outside schema

The AI response must never be trusted directly.

---

# 38. Template IDs Must Come From Local Registry

Do not let the model invent:

```text
templateId: "beautiful_book_card"
```

unless that ID exists in the local template registry.

Create a local map:

```ts
const GOAL_TEMPLATE_REGISTRY = {
  roadmap: {...},
  checklist: {...},
  metric: {...},
  sprint: {...},
  pillar: {...}
};
```

Visual style registry:

```ts
const GOAL_VISUAL_STYLE_REGISTRY = {
  paper: {...},
  book: {...},
  glass: {...},
  editorial: {...},
  minimal: {...},
  capsule: {...}
};
```

AI selects from these IDs only.

---

# 39. Template Renderer Architecture

Do not put all JSX for every template inside one giant conditional component.

Prefer:

```text
AIGoalPreview
   ↓
GoalPresentationRenderer
   ├── RoadmapRenderer
   ├── ChecklistRenderer
   ├── MetricRenderer
   ├── SprintRenderer
   └── PillarRenderer

VisualStyleRenderer
   ├── PaperStyle
   ├── BookStyle
   ├── GlassStyle
   ├── EditorialStyle
   └── MinimalStyle
```

The renderer receives the same normalized goal data.

---

# 40. Existing Template Compatibility

Existing stored goals may only have:

```text
templateId
```

Do not break them.

Renderer behavior:

```ts
const presentation = normalizeLegacyTemplate(goal.templateId);
```

Example:

```text
templateId = "roadmap"

→ frameworkId = "roadmap"
→ visualStyleId = "default"
```

New AI goals may store:

```text
templateId = "roadmap"
```

plus visual style locally or in an extension field when safe.

---

# 41. Category Creation / Linking UX

If a new category is recommended:

```text
Category
Technology
[Existing]

or

+ Create "Mobile Development"
```

The user chooses.

For linking:

```text
Goal
Flutter Mastery

Category
Technology

Sub-category
Mobile Development

Project
[optional]
Flutter Learning Lab
```

Only user-confirmed links are persisted.

---

# 42. Projects Suggested From Goal

AI may recognize project-shaped content.

Example:

> Learn Flutter and build a weather app, notes app, and expense app.

AI should understand:

```text
Goal:
Flutter Mastery

Suggested projects:
- Weather App
- Notes App
- Expense App
```

It should present:

```text
Detected 3 project candidates.

[Create all]
[Choose]
[Keep as milestones]
```

Never silently create 3 projects.

---

# 43. Tasks

The initial AI Goal flow should NOT generate tasks by default.

Reason:

The goal system should remain focused.

Tasks may be created only when:

- user explicitly requests tasks
- user asks to turn milestones into tasks
- user says "make this actionable"

Then use existing task creation/linking APIs.

---

# 44. Notes

Allow notes inside the Goal Draft:

```text
Notes:
- Use Flutter 3.x
- Focus on practical understanding
- Build small apps
```

Notes are user content.

AI may formulate them but must never overwrite them without instruction.

---

# 45. Conversation UX

The user should always see:

```text
AI input
```

plus contextually relevant action chips.

Example:

```text
Add milestones
Add project
Change category
Change style
Edit goal
Finish goal
```

The chips should not block free-form chat.

---

# 46. Stop / Finish Behavior

At any stage:

```text
Finish Goal
```

must:

1. stop the conversational loop
2. validate current draft
3. show final preview
4. offer Save
5. preserve any user edits

No AI-generated continuation after the user chooses Finish.

---

# 47. Final Review

Final review should display:

```text
Goal
Flutter Mastery

Purpose
...

Category
Technology

Presentation
Book Roadmap

Structure
3 milestones

Projects
1 linked / 2 suggested

Notes
...
```

Actions:

```text
Edit
Continue with AI
Save Goal
Cancel
```

---

# 48. Save Behavior

Use existing persistence APIs where possible.

At save:

```text
Goal draft
↓
Create/reuse category if confirmed
↓
Create/reuse sub-category if confirmed
↓
Create/link project if confirmed
↓
Save yearlyGoals record
↓
Link only confirmed entities
↓
Trigger existing integrations naturally
```

Do not create hidden shadow goals.

---

# 49. Save Example

User final state:

```text
Goal:
Flutter Mastery

Description:
Build a strong practical understanding of Flutter by learning core concepts and reinforcing them through small apps.

Category:
Technology

Sub-category:
Mobile Development

Template:
roadmap

Visual:
book

Milestones:
1. Flutter Fundamentals
2. State Management with Riverpod
3. Build a Weather App
```

Persistence should produce one regular `yearlyGoals` record using existing fields.

If "Weather App" is explicitly promoted to a project:

```text
yearlyGoals
   ↓ goalId
projects
   ↓
tasks
```

using existing relationships.

---

# 50. Offline Safety

The AI itself may require network access.

The rest of Nizam must remain unaffected.

Rules:

- do not change global offline behavior
- do not make unrelated queries depend on AI Goal state
- use local draft state while the modal is open
- save through existing offline-aware mutation path where supported
- use idempotency/local IDs for newly created entities when the chosen persistence API requires them

If AI generation fails:

```text
keep current draft
show retry
allow manual edit
allow Finish if enough data exists
```

Never erase a valid existing draft after a failed AI request.

---

# 51. Error Recovery

## LLM error

Show:

> "I couldn't generate the structure. Your current goal is safe."

Actions:

```text
Retry
Continue manually
Cancel
```

## Invalid JSON

Backend should:

1. clean output
2. parse
3. validate
4. optionally retry once with a repair prompt
5. return a safe structured fallback

Frontend should not parse arbitrary prose.

---

# 52. LLM Provider Strategy

Keep the existing multi-provider structure.

Do not couple UI to Groq/Gemini.

Use:

```text
callLLMForGoals()
```

as the backend abstraction.

The prompt architecture changes; provider fallback remains.

---

# 53. Prompt Architecture

Use separate prompt blocks:

```text
BASE IDENTITY
INTENT RULES
TIMEFRAME RULES
CATEGORY RULES
TEMPLATE RULES
CONVERSATION RULES
OUTPUT SCHEMA
EXAMPLES
CURRENT NIZAM CONTEXT
USER INPUT
```

Do not maintain one giant vague prompt.

---

# 54. Few-Shot Examples Are Mandatory

Examples should be embedded in the AI instructions.

Example 1:

```text
USER:
Learn Flutter and build some small apps to fully understand Flutter.

CORRECT:
Goal = Flutter Mastery
Type = learning
Supporting outcome = small apps
No health/finance/career filler
No automatic milestones
Recommend learning-friendly templates
```

Example 2:

```text
USER:
Build a weather app in Flutter.

CORRECT:
Goal = Build a Flutter Weather App
Type = project
Do not convert it into "Learn Flutter"
unless the user says learning is the purpose.
```

Example 3:

```text
USER:
Learn Flutter to prepare for mobile developer interviews.

CORRECT:
Goal = Flutter Interview Readiness
Type = learning/career
Purpose includes interview preparation.
Do not invent unrelated portfolio goals.
```

Example 4:

```text
USER:
Save $1000 this month.

CORRECT:
Goal = Save $1,000 This Month
Type = financial
Metric-friendly template
No fitness or career content.
```

Example 5:

```text
USER:
Exercise 4 times this week.

CORRECT:
Goal = Complete 4 Workout Sessions
Type = habit/fitness
Metric or checklist suitable
```

---

# 55. Negative Examples Are Also Mandatory

Include explicit anti-examples.

```text
USER:
Learn Flutter.

WRONG:
Learn Flutter
+
Exercise
+
Read books
+
Build a startup
+
Update CV
+
Post on LinkedIn

WHY WRONG:
Unrelated invented domains.
```

This is important because weaker models often over-generate.

---

# 56. Conversation Examples

## Example A — simple goal

User:

> Learn Flutter.

AI:

```text
I shaped this into a focused Flutter learning goal.

Choose a presentation:
[Book Roadmap]
[Paper Roadmap]
[Minimal Checklist]

Want to add milestones, projects, or keep it simple?
```

## Example B — expansion

User:

> yes

AI:

```text
I can suggest a structure or use your own items.

Suggested:
- Fundamentals
- UI & Layout
- State Management
- Small Apps

Add these?
```

## Example C — user modification

User:

> remove UI & Layout and add Firebase

AI:

```text
Updated:
- Fundamentals
- State Management
- Firebase
- Small Apps
```

No unrelated changes.

## Example D — finish

User:

> looks good finish

AI:

```text
Perfect. Your goal is ready to save.
```

---

# 57. AI Response Style

AI responses should be:

- short
- clear
- useful
- action-oriented
- contextual

Avoid:

```text
As an elite productivity strategist...
```

Avoid essays.

The conversation UI should show a concise message while the structured content carries the detail.

---

# 58. UI Layout Recommendation

Suggested modal flow:

```text
────────────────────────────
AI GOAL ARCHITECT

User prompt / conversation

[chat messages]

Current Goal Preview
┌─────────────────────────┐
│ Flutter Mastery         │
│ ...                     │
│                         │
│ category               │
│ template preview       │
└─────────────────────────┘

Template options
[Book]
[Paper]
[Glass]

Quick actions
[Add milestones]
[Add project]
[Edit]
[Finish]

────────────────────────────
AI input
[________________________]
────────────────────────────
```

The preview should remain visible while chatting when screen size allows.

---

# 59. Editing

Every AI generated field must have an edit affordance.

For example:

```text
Goal title                [Edit]
Description               [Edit]
Category                  [Change]
Template                  [Change]
Visual style              [Change]
Milestone                 [Edit] [Delete]
```

Manual add:

```text
+ Add milestone
+ Add project
+ Add note
```

---

# 60. Template Preview Safety

Template cards shown during selection are previews.

Selecting a template should not mutate saved data yet.

Only the in-memory draft changes.

Save happens at the end.

---

# 61. Undo

Highly recommended:

Each AI mutation should be reversible in the current session.

Example:

```text
AI added 4 milestones
[Undo]
```

This can be implemented with a previous-draft stack:

```ts
const history: AIGoalDraft[] = [];
```

Limit history to a small number such as 10–20 snapshots.

---

# 62. Context Sent to AI

Send only useful context.

Good:

```text
Current goal
Current category
Existing relevant categories
Existing relevant projects
User edits
Latest user instruction
Current timeframe
```

Avoid dumping the entire database.

This reduces tokens and hallucination risk.

---

# 63. Relevance Filtering Before Prompting

If user has 200 projects, do not send all of them.

Use deterministic filtering first:

```text
keyword overlap
category match
goal text similarity
recent relevant entities
```

Then provide a small relevant context set.

---

# 64. Category Matching Should Be Hybrid

Use:

```text
Deterministic matching
+
LLM semantic reasoning
```

Example:

```text
Existing categories:
Health
Technology
Finance

Prompt:
Learn Flutter

Deterministic:
Technology keyword/domain

LLM:
Technology is the semantic match
```

This reduces hallucinations and unnecessary LLM work.

---

# 65. Template Matching Should Also Be Hybrid

Template registry includes local metadata.

Example:

```ts
{
  frameworkId: "roadmap",
  intendedFor: ["learning", "course", "project"],
  visualStyles: ["book", "paper", "editorial"]
}
```

The AI chooses from the registry.

Never let it invent templates.

---

# 66. Performance

Do not make multiple LLM requests for the initial goal.

Preferred initial generation:

```text
1 request
→ intent + title + category recommendation + 3 template recommendations
```

Then additional calls only when the user asks for:

- expansion
- refinement
- project generation
- advanced planning

---

# 67. Token Efficiency

Do not resend huge data every turn.

Maintain a compact `AIGoalDraft` context.

Each request can include:

```text
current draft
latest user message
relevant context
```

instead of entire conversation + all database records.

---

# 68. Avoid Prompt Drift

The prompt must explicitly state:

```text
The current draft is authoritative unless the user's latest instruction asks to change it.
```

And:

```text
Never "improve" unrelated fields.
```

---

# 69. Validation Layer

Create:

```text
utils/aiGoalValidation.ts
```

Functions:

```ts
validateGoalIntent()
validateTemplateRecommendations()
validateDraft()
sanitizeAIText()
ensureSupportedTemplate()
ensureSupportedCategory()
removeDuplicateMilestones()
```

This layer is deterministic.

---

# 70. Backend Contracts

Suggested functions:

```text
architectGoalIntent
recommendGoalPresentation
expandGoalIntent
refineGoalIntent
suggestGoalProjects
saveArchitectGoals
```

Existing:

```text
generateSubGoalsAction
```

can be retained temporarily for backward compatibility but should eventually use the same normalized goal context.

---

# 71. Backward Compatibility

Do not remove current APIs immediately.

For example:

```text
architectGoalIntent
```

can maintain the existing entry name while returning an expanded response.

If existing callers depend on old fields:

```text
suggestedTemplateId
suggestedHeader
suggestedMilestones
```

keep them temporarily as compatibility fields:

```json
{
  "suggestedTemplateId": "roadmap",
  "suggestedHeader": "Technology",
  "suggestedMilestones": [],
  "...new fields": "..."
}
```

Then migrate internal consumers.

---

# 72. Safe Migration Pattern

Use:

```text
new response
↓
normalizeGoalArchitectResponse()
↓
AIGoalDraft
↓
UI
```

This means UI does not depend directly on raw LLM JSON.

---

# 73. Existing `AIGoalGeneratorModal.tsx` Refactor

Current component contains:

- chat state
- generation state
- review state
- sub-goal state
- refinement state
- template selection
- milestone manipulation
- save behavior

Do not keep growing the same file indefinitely.

Split responsibilities.

Recommended:

```text
AIGoalGeneratorModal
    ├── useAIGoalSession()
    ├── AIGoalConversation
    ├── AIGoalTemplatePicker
    ├── AIGoalPreview
    ├── AIGoalExpansionPanel
    └── AIGoalFinalReview
```

The parent should coordinate; children should render and emit events.

---

# 74. Suggested Hook

Create:

```text
hooks/useAIGoalSession.ts
```

Responsibilities:

```ts
startGoal()
selectTemplate()
editGoal()
editCategory()
addMilestone()
updateMilestone()
deleteMilestone()
addProjectSuggestion()
acceptSuggestion()
rejectSuggestion()
sendMessage()
refineGoal()
finishGoal()
saveGoal()
undo()
```

This dramatically reduces UI complexity.

---

# 75. Draft History

Hook maintains:

```ts
past
present
future
```

or a simpler bounded snapshot stack.

Every meaningful AI transformation should create a snapshot.

Manual field edits may create snapshots depending on implementation.

---

# 76. Template Picker Contract

```ts
type TemplatePickerProps = {
  options: AITemplateRecommendation[];
  selected?: AIGoalPresentation;
  onSelect: (presentation: AIGoalPresentation) => void;
};
```

The component does not know anything about LLMs.

---

# 77. Preview Component Contract

```ts
type AIGoalPreviewProps = {
  draft: AIGoalDraft;
  isEditing: boolean;
  onEdit: (...);
};
```

Preview is deterministic.

It should render the same draft identically regardless of AI provider.

---

# 78. Conversational Component Contract

```ts
type AIGoalConversationProps = {
  messages: AIGoalMessage[];
  onSubmit: (message: string) => void;
  suggestions: string[];
  onAction: (action: string) => void;
};
```

---

# 79. Final Review Component

Should summarize:

```text
Intent
Goal
Category
Template
Milestones
Projects
Notes
```

and provide:

```text
Edit
Continue
Save
```

---

# 80. Save Integration

The save function should operate on normalized data, not raw AI response.

Example:

```ts
saveAIGoalDraft(draft)
```

Internally:

```text
1. Validate
2. Resolve/create category if confirmed
3. Resolve/create sub-category if confirmed
4. Resolve/create project if confirmed
5. Create goal
6. Link entities
7. Return created IDs
```

---

# 81. Do Not Create a Parallel Goal Database

Absolutely avoid:

```text
aiGoals table
```

containing duplicate permanent copies of normal goals.

AI draft/session data is temporary or session-specific.

The final source of truth remains Nizam's existing goal/project/task system.

---

# 82. Session Persistence — Optional

Phase 1:

```text
local component/hook state
```

This is simplest and safest.

Phase 2:

If product later requires resume-after-app-close:

```text
aiGoalSessions
```

can store incomplete drafts.

This must remain isolated.

Do not force session persistence into v1.

---

# 83. Security / Privacy

AI prompts must use only user-authorized Nizam context.

Do not send unrelated private records to the model.

Send:

```text
only relevant categories
only relevant projects
only relevant goals
```

---

# 84. Language Support

The existing app supports English/Arabic.

The AI Goals system must preserve the selected language.

Rules:

- structured content in selected language
- template metadata has existing English/Arabic labels
- AI should not mix languages unless user intentionally does so
- technical names such as `Flutter`, `Riverpod`, `Firebase` remain proper names

Example Arabic:

```text
إتقان Flutter من خلال التعلم والتطبيق
```

Do not translate technical product/library names incorrectly.

---

# 85. Arabic UI

The system must remain RTL-safe.

Keep data semantics language-neutral.

Do not create separate Arabic-only state models.

Use existing i18n and layout direction.

---

# 86. Accessibility

Template selection:

- keyboard/touch accessible
- sufficient labels
- selected state clear
- no information conveyed only by color

Editable fields:

- proper labels
- clear delete actions
- confirmation only for destructive persistent actions

---

# 87. Analytics

Optional and isolated.

Useful events:

```text
ai_goal_started
ai_goal_generated
ai_template_selected
ai_goal_expanded
ai_goal_refined
ai_goal_saved
ai_goal_cancelled
ai_goal_generation_failed
```

Do not introduce analytics dependencies just for this feature if the project does not already use them.

---

# 88. Acceptance Criteria

## Core generation

Given:

> make me a goal to finish flutter and build some small apps to fully understand flutter

System must:

- identify Flutter as core subject
- identify learning/mastery intent
- identify small apps as supporting practice outcome
- avoid unrelated domains
- generate an outcome-oriented title
- recommend relevant category
- recommend max 3 suitable presentation choices
- return no automatic milestones unless explicitly requested

## Template

- user sees up to 3 options
- user chooses one
- goal renders in selected presentation
- no persistence until Save

## Expansion

- system asks whether user wants more structure
- user can ask for suggestions
- suggestions are editable
- user can add own items
- user can delete/reorder items
- user can stop anytime

## Refinement

- natural-language edits work
- unrelated fields remain unchanged
- manual edits are respected

## Integration

- saved goal appears in existing Day/Month/Year goal views
- existing goal CRUD still works
- projects/tasks can still link through existing fields
- insights and other goal consumers keep working

## Isolation

- no unrelated screen behavior changes
- no database migration required for core v1
- existing goals remain readable
- existing template IDs remain valid

---

# 89. Test Matrix

## Test Group A — Learning

1. Learn Flutter.
2. Learn React.
3. Finish Python course.
4. Study cardiology for exam.

Expected:
learning/academic templates, no unrelated content.

## Test Group B — Project

1. Build a weather app.
2. Build a medical chat MVP.
3. Launch a portfolio website.

Expected:
project/launch structures.

## Test Group C — Metric

1. Read 100 pages.
2. Save $1,000.
3. Run 30 km.

Expected:
metric-capable presentation.

## Test Group D — Habit

1. Exercise 4 times this week.
2. Read every day.
3. Meditate 10 minutes daily.

Expected:
habit/pillar/checklist structures.

## Test Group E — Mixed intent

1. Learn Flutter and build 3 apps for my portfolio.

Expected:
learning + project + career purpose.

Must not become separate unrelated goals automatically.

---

# 90. Important Edge Cases

### Ambiguous input

User:

> I want to improve Flutter.

AI:

Do not assume whether this means:

- learn
- build
- refactor
- prepare for interview

Instead generate the most conservative interpretation or ask a short clarifying question.

### Very short input

> Flutter

AI should ask:

> "What do you want to achieve with Flutter?"

Do not hallucinate a goal.

### Multiple goals

User:

> Learn Flutter and improve my fitness.

This is explicitly two domains.

AI may:

```text
Goal 1: Flutter...
Goal 2: Fitness...
```

But should not merge them into one nonsense goal.

---

# 91. Goal Splitting Rule

Split only when the user explicitly expresses separate outcomes.

Example:

> Learn Flutter and improve my running.

This is two distinct goals.

Example:

> Learn Flutter by building small apps.

This is one coherent goal.

This distinction is critical.

---

# 92. Confidence / Clarification Rule

If semantic confidence is high:

```text
generate draft
```

If confidence is low:

```text
ask one concise question
```

Do not interrogate the user with 10 questions.

Example:

> "Do you mean learning Flutter itself, or building a specific Flutter app?"

---

# 93. No Fake Scoring in UI

The system may internally rank template candidates, but the user should primarily see:

```text
Best match
Alternative
Alternative
```

not:

```text
94% match
82% match
71% match
```

unless the product specifically requests scoring.

---

# 94. Prompt Injection / User Text Safety

User input is natural language data.

Do not let user prompt text redefine system rules.

The backend system prompt must retain:

```text
Do not invent unrelated goals.
Do not invent templates.
Respect current draft.
Output strict schema.
```

---

# 95. Generated Content Safety Boundary

This is a productivity feature.

The model should not provide unrelated advice just to fill a template.

For example:

```text
"Learn Flutter"
```

must remain a software learning goal.

---

# 96. Implementation Phases

## Phase 1 — Foundation

Implement:

- `types/aiGoals.ts`
- normalized draft model
- intent model
- template registry
- visual style registry
- validation helpers
- `useAIGoalSession`

No UI redesign yet.

## Phase 2 — Backend Architect

Upgrade:

```text
architectGoalIntent
```

to return:

- intent
- goal
- category recommendation
- up to 3 template recommendations
- next-step question

Keep compatibility fields.

## Phase 3 — Template Selection

Add:

```text
AIGoalTemplatePicker
```

and deterministic preview.

## Phase 4 — Conversation

Add:

```text
AIGoalConversation
```

with:

- expansion questions
- chips
- continue
- finish

## Phase 5 — Expansion

Support:

- milestones
- sub-goal suggestions
- projects
- categories
- notes

## Phase 6 — Refinement

Upgrade conversational editing.

## Phase 7 — Persistence Integration

Save through existing Nizam entities.

## Phase 8 — Regression Testing

Test Day/Month/Year + existing goal screens + offline flows.

---

# 97. Recommended File-Level Change Map

## Modify

```text
components/AIGoalGeneratorModal.tsx
```

Purpose:
- become orchestration shell
- remove duplicated state logic
- use the new session hook

```text
convex/aiGoals.ts
```

Purpose:
- new contracts
- improved architect action
- refinement/expansion actions
- shared validation/context utilities

```text
constants/goalTemplates.ts
```

Purpose:
- keep existing template IDs
- add metadata for framework suitability and visual styles where appropriate

## Add

```text
types/aiGoals.ts

hooks/useAIGoalSession.ts

components/ai-goals/AIGoalConversation.tsx
components/ai-goals/AIGoalPreview.tsx
components/ai-goals/AIGoalTemplatePicker.tsx
components/ai-goals/AIGoalExpansionPanel.tsx
components/ai-goals/AIGoalFinalReview.tsx
components/ai-goals/GoalPresentationRenderer.tsx

utils/aiGoalValidation.ts
utils/aiGoalContext.ts
```

Optional later:

```text
convex/aiGoalSessions.ts
```

---

# 98. Do Not Modify These Unless Required

Avoid modifications to:

```text
convex/todos.ts
convex/projects.ts
convex/insights.ts
hooks/useOfflineMutation.ts
hooks/useSyncManager.ts
utils/offlineStorage.ts
app/(tabs)/*
```

The AI Goal layer should consume these systems, not redesign them.

---

# 99. Existing Goal Persistence Mapping

Normalized draft:

```ts
{
  goal: {
    title,
    description
  },
  category: {
    selectedName,
    existingCategoryId
  },
  presentation: {
    frameworkId,
    visualStyleId
  },
  milestones
}
```

Existing goal:

```ts
{
  text: title,
  description,
  category,
  categoryId,
  templateId: frameworkId,
  milestones,
  color,
  icon,
  year,
  month?,
  day?
}
```

The visual style should remain a presentation concern until a dedicated persistence field is safely introduced.

---

# 100. Color/Icon Rules

AI may recommend color/icon metadata, but these must also come from allowed registries.

Do not let AI output arbitrary unsupported Ionicons names or invalid colors.

Preferred:

```ts
allowedIcons
allowedAccentColors
```

Then:

```text
AI suggestion
↓
validator
↓
fallback
```

---

# 101. User-Controlled Presentation

After choosing template, the user can still change it.

Example:

```text
AI recommended:
Book Roadmap

User:
"I want the Glass Checklist instead."

Result:
presentation changes only.
Goal content remains unchanged.
```

This is essential.

---

# 102. Manual Editing vs AI Editing

Manual editing:

```text
instant local update
```

AI editing:

```text
user command
→ backend
→ validated result
→ draft patch
→ UI update
```

Never send every keystroke to AI.

---

# 103. Autosave

Do not autosave unfinished AI draft into permanent goals by default.

Use:

```text
in-memory draft
```

until user explicitly chooses Save.

---

# 104. Cancel Behavior

Cancel should:

```text
close modal
discard unsaved draft
```

unless draft session persistence has been explicitly implemented.

Never delete an already-existing saved goal because the AI modal closes.

---

# 105. Loading Experience

Use meaningful states:

```text
Understanding your goal...
Finding the right category...
Choosing suitable layouts...
Preparing your preview...
```

But do not fake long processing times.

Status messages should reflect actual stages if possible.

---

# 106. Example End-to-End Flow

### User

> make me a goal to finish flutter and build some small apps to fully understand flutter

### AI Step 1

```text
Goal:
Flutter Mastery

Purpose:
Develop a strong practical understanding of Flutter through learning and small app projects.

Category:
Technology

Type:
Learning + Practice
```

### AI Step 2

```text
Choose a presentation:

1. Book Roadmap
   Best for progressive learning

2. Paper Roadmap
   Best for milestones

3. Glass Checklist
   Best for action-focused execution
```

### User

> Book

### AI Step 3

Preview:

```text
FLUTTER MASTERY

Learn → Build → Understand

Purpose
...

Progress
No milestones yet

[Add milestones]
[Add projects]
[Edit]
[Finish]
```

### AI Step 4

AI asks:

> "Want to add milestones, projects, or keep it focused?"

### User

> suggest milestones

### AI Step 5

```text
Suggested:

1. Flutter Fundamentals
2. UI & Layout
3. State Management
4. Build Small Apps

[Accept]
[Edit]
```

### User

> Remove UI & Layout and add Firebase.

### AI Step 6

```text
Updated:

1. Flutter Fundamentals
2. State Management
3. Firebase
4. Build Small Apps
```

### User

> make Small Apps into projects

### AI Step 7

```text
I found a project-shaped part.

Create:
+ Small Flutter Apps

or

Create separate projects for each app?
```

### User

> separate projects

AI suggests project candidates based only on explicitly discussed app names.

### User

> finish

### Final Review

```text
Goal:
Flutter Mastery

Category:
Technology

Presentation:
Book Roadmap

Milestones:
4

Projects:
3

[Edit]
[Save Goal]
```

---

# 107. What the AI Must Never Do in This Flow

1. Add unrelated goals.
2. Add random life areas.
3. Invent books/courses/resources unless asked.
4. Create projects silently.
5. Create categories silently.
6. select more than 3 template options.
7. overwrite user manual edits.
8. reset previous accepted content.
9. force every goal into the same framework.
10. generate huge plans before user asks.
11. use a template ID that does not exist.
12. break existing goal persistence.
13. alter Day/Month/Year semantics.
14. change unrelated Nizam features.

---

# 108. Definition of Done

The feature is considered complete when:

### Intent
The system consistently understands user intent instead of merely generating generic titles.

### Relevance
Generated content stays within the user's scope.

### Categories
Relevant existing categories are reused intelligently.

### Templates
The user receives no more than 3 relevant options.

### Presentation
The chosen presentation renders the same goal content correctly.

### Editing
Every field can be edited/removed as applicable.

### Conversation
The user can iteratively expand/refine the goal.

### Control
The user can stop at any time.

### Integration
Saved goals are normal Nizam goals and work with existing systems.

### Isolation
No unrelated feature changes.

### Reliability
Malformed or failed AI responses do not corrupt the draft or existing database.

---

# 109. Final Architectural Principle

The entire feature should follow:

```text
AI proposes
↓
Nizam validates
↓
User decides
↓
Nizam persists
```

Not:

```text
AI decides
↓
AI mutates
```

This is the most important product and engineering rule for the new AI Goals system.

---

# 110. Agent Implementation Instruction

When this blueprint is handed to a coding agent:

1. Read the current AI Goal files before editing.
2. Inspect existing callers of `architectGoalIntent`, `refineGoalIntent`, `generateSubGoalsAction`, and `saveArchitectGoals`.
3. Preserve existing API compatibility where practical.
4. Implement the new normalized draft layer first.
5. Implement deterministic validation before UI changes.
6. Keep all AI Goal changes isolated.
7. Do not modify unrelated Nizam modules.
8. Do not perform a broad refactor outside the defined change map.
9. Test existing goal creation/edit/delete before and after the feature.
10. Verify Day, Month, Year behavior independently.
11. Verify that a failed AI request cannot erase or corrupt current draft state.
12. Verify that old saved goals still render correctly.

---

# 111. Minimal Regression Checklist

Before declaring the feature complete, verify:

```text
[ ] Existing manual goal creation still works
[ ] Existing manual goal edit still works
[ ] Existing manual goal deletion still works
[ ] Month goals still load
[ ] Day goals still load
[ ] Year goals still load
[ ] Existing milestones still render
[ ] Existing category links still work
[ ] Existing project-goal links still work
[ ] Existing task-goal links still work
[ ] Offline goal creation still works
[ ] AI goal save uses normal goal persistence
[ ] Existing stored template IDs still work
[ ] AI failure preserves current draft
[ ] User edits are not overwritten
[ ] Max 3 template options enforced
[ ] No automatic unrelated content
[ ] User can finish at every stage
```

---

# 112. End State

The final Nizam AI Goals experience should feel like:

> "I tell Nizam what I want to achieve, and it understands what I really mean, helps me shape it, shows me how it can look, lets me keep changing it through conversation, and only saves it when I decide it is ready."

That is the target behavior.

