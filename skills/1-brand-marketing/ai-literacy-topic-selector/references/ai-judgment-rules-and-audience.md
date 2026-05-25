# AI 文選題助理的規則 (AI Literacy Topic Selection Rules)

Source: [Google Doc](https://docs.google.com/document/d/1GHdmwKWIOpYGN7u7njMX9VjZOeoKkm4hcLkBAIu1B7A/edit)

## Tab 1: 判斷對錯的規則 (Rules for Judging Right/Wrong)

### 2. Unpacking how our daily routine looks like

#### 2.1 Types of intention – Why (3)

This dimension captures what kind of cognitive or operational intent is behind the communication:

**Context–Direction:** User/assistant gives background; no explicit question or task, only nudges the conversation direction.
- Works well with: Roleplay scenarios, setting tone/persona ("You are a harsh critic"), establishing constraints before a complex task.
- Does not work with: Immediate execution needs or users seeking a binary Yes/No answer.

**Question–Answer pairing:** User asks, AI replies with knowledge, or AI asks, user replies.
- Works well with: Fact retrieval, definitions, customer support FAQs, verifying understanding.
- Does not work with: Complex workflows requiring multiple steps, content generation, creative brainstorming.

**Instruction–Execution pairing:** User gives task, AI performs (or AI gives tasks, user performs).
- Works well with: Coding, summarization, data formatting, translation, specific operational requests.
- Does not work with: Open-ended philosophical exploration or ambiguous queries where desired outcome is unclear.

**Purpose:** Defines the purpose of information exchange — whether to inform, inquire, or act.

#### 2.2 Types of knowledge reference – What (4)

**General knowledge:** Pretrained, common-sense, or domain-general data.
- Works well with: Broad topics, grammar, coding logic, history, creative writing where accuracy is secondary to fluency.
- Does not work with: Post-cutoff current events, niche proprietary data, obscure facts prone to hallucination.

**Contextual knowledge:** Information provided in the prompt, chat history, or memory.
- Works well with: Follow-up questions, analyzing text pasted by the user, maintaining consistency within a session.
- Does not work with: Massive datasets exceeding token window or information from months ago (unless long-term memory active).

**Retrieval-Based knowledge (RAG):** Dynamic access to private databases/docs.
- Works well with: Company policy inquiries, technical manual troubleshooting, specific legal/medical referencing.
- Does not work with: Questions requiring holistic summary of every document in a database.

**Tool-Based/Real-Time knowledge:** Web browsing, API calls, Calculator.
- Works well with: Mathematical calculations, checking stock prices/weather, interacting with external software (CRMs, calendars).
- Does not work with: Conceptual questions, abstract reasoning, scenarios where external APIs are offline or rate-limited.

**Purpose:** Specifies the epistemic base — what kind of "mind" the human/AI is using.

#### 2.3 Types of cognitive mode – How (3)

**System 1, Associative Generation:** AI relies on "gut instinct" from training data. Provides answer immediately without "thinking" or examples.
- Works well with: Creative writing, simple facts, chit-chat.
- Does not work with: Math, complex logic, strict constraints.

**Pattern Matching, Analogical Generation:** AI looks at provided examples (One-shot/Few-shot) and mimics the pattern. Copying structure, not necessarily using logic.
- Works well with: JSON/CSV formatting, style mimicry, classification.
- Does not work with: Logic puzzles where answer matters more than format.

**System 2, Deductive Generation:** AI produces internal monologue or step-by-step derivation (Chain of Thought) before final answer. Calculates rather than predicts.
- Works well with: Math, coding, root cause analysis.
- Does not work with: Low-latency tasks, simple greetings.

**Purpose:** Controls how the AI generalizes or imitates from given inputs.

#### 2.4 Interaction initiative – Who (2)

**Human-Driven (Reactive):** User prompts, AI responds.
- Works well with: Search engines, drafting tools, utility bots with specific goals.
- Does not work with: Habit-building, safety alerts, scenarios where user doesn't know what they don't know.

**AI-Driven (Proactive):** AI notifies, nudges, or acts without current prompt.
- Works well with: Security alerts, sales agents, automated workflows.
- Does not work with: Passive information retrieval or users prioritizing silence and privacy.

**Purpose:** Defines the locus of control—who is the driver and who is the passenger.

#### 2.5 Interaction flow – When (3)

**Transactional (Atomic):** One input, one output, session closed.
- Works well with: Quick translations, command-line tools, checking a fact, API triggers.
- Does not work with: Complex problem solving, negotiation, learning user preferences over time.

**Conversational (Linear):** Standard back-and-forth thread (A → B → A → B).
- Works well with: Interviews, customer support troubleshooting, roleplay, deep-dive learning.
- Does not work with: Tasks where user wants to edit same output repeatedly rather than generating new replies.

**Cyclical (Iterative):** Feedback loop where user and AI refine the same asset repeatedly.
- Works well with: Debugging code, drafting essays, refining image prompt, design processes.
- Does not work with: Simple Q&A or scenarios where the first answer is usually the correct one.

**Purpose:** Captures the structural rhythm—whether it's a dot (transaction), a line (conversation), or a loop (cycle).

### 2.6 Conflicting Rules & The Order of the Combination

#### 1. The "Temporal" Conflicts (Time & Memory)

**A. The Memory Paradox:** Contextual Knowledge (3.2) + Transactional Topology (3.5)
- Why it fails: Contextual Knowledge relies on Short-Term Memory; Transactional ends immediately.
- The Conflict: Cannot ask AI to "Remember what I just said" if session resets after first turn.

**B. The "Useless Setup":** Context–Direction (3.1) + Transactional Topology (3.5)
- Why it fails: Context–Direction sets stage for future interaction; Transactional ends immediately.
- The Conflict: Like hiring an actor as Hamlet, then firing them before they say a line.

#### 2. The "Agency" Conflicts (Who Knows What)

**C. The "Missing Teacher":** AI-Driven Initiative (3.4) + Analogical Generation (3.3)
- Why it fails: Analogical Generation needs user examples; AI-Driven means AI starts proactively.
- The Conflict: AI cannot mimic user's example if user hasn't typed anything yet.

#### 3. The "Efficiency" Conflicts (Resource Mismatch)

**D. The "Over-Thinking":** Context–Direction (3.1) + Deductive Generation (3.3)
- Why it fails: Context–Direction sets a vibe; Deductive Generation triggers Chain of Thought.
- The Conflict: Waste of latency and cost to "think step-by-step" just to confirm persona.

**E. The "Over-Engineering":** Associative Generation (3.3) + Cyclical Topology (3.5)
- Why it fails: Associative is "gut instinct"; Cyclical is iterative refinement loop.
- The Conflict: Refinement needs analysis (Analogical/Deductive); gut-instinct loops just "random guess".

#### 4. The "Epistemic" Conflicts (Knowledge Limits)

**F. The "Hallucination Trap":** General Knowledge (3.2) + Specific/Real-Time Intent
- Why it fails: General Knowledge frozen at training cutoff; Real-Time asks for current data.
- The Conflict: AI must refuse or hallucinate if asked for today's weather using only General Knowledge.

## Tab 2: 客群分佈 (Audience Distribution)

| 職業 | Count |
|------|-------|
| 行政人員 | 81 |
| 其它 | 59 |
| 創意工作者 | 52 |
| 專案經理 | 46 |
| 業務人員 | 45 |
| 待業中 | 41 |
| 工程師 | 37 |
| 管理階層 | 31 |
| 產品經理 | 30 |
| 執行專員 | 26 |
| 教職人員 | 24 |
| 研究人員 | 23 |
| 專業人士 | 22 |
| 技術人員 | 21 |
| 服務人員 | 16 |
| 自營商 | 15 |
| 秘書 | 13 |
| 醫療技術人員 | 11 |
| 家管 | 9 |
| 已退休 | 2 |
| 護理師 | 2 |
| 體力工作者 | 2 |
