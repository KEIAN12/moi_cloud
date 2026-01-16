# UI Skills Review Report

## Violations Found

### 1. Layout: h-screen → h-dvh
**Files:**
- `src/components/layout/dashboard-layout.tsx:41`
- `src/app/login/login-form.tsx:52`
- `src/app/login/page.tsx:7`
- `src/app/tasks/my/page.tsx:100`
- `src/app/select-user/page.tsx:25`
- `src/app/tasks/[id]/page.tsx:104,112,119`

**Why it matters:** `h-screen` doesn't account for mobile browser UI (address bar, etc.). `h-dvh` uses dynamic viewport height.

**Fix:**
```tsx
// Before
<div className="flex h-screen ...">
<div className="min-h-screen ...">

// After
<div className="flex h-dvh ...">
<div className="min-h-dvh ...">
```

### 2. Components: Missing aria-label on icon-only buttons
**Files:**
- `src/app/tasks/my/page.tsx:104`
- `src/app/dashboard/page.tsx:269,313`
- `src/app/tasks/[id]/page.tsx:122`
- `src/components/layout/dashboard-layout.tsx:64,99,111,115`

**Why it matters:** Screen readers need descriptive labels for icon-only buttons.

**Fix:**
```tsx
// Before
<Button variant="ghost" size="icon" onClick={...}>
  <ArrowLeft className="h-5 w-5" />
</Button>

// After
<Button variant="ghost" size="icon" onClick={...} aria-label="戻る">
  <ArrowLeft className="h-5 w-5" />
</Button>
```

### 3. Animation: Duration exceeds 200ms for interaction feedback
**File:** `src/app/login/login-form.tsx:56`

**Why it matters:** Interaction feedback should be immediate (<200ms) to feel responsive.

**Fix:**
```tsx
// Before
transition={{ duration: 0.5 }}

// After
transition={{ duration: 0.15 }}
```

### 4. Typography: Missing text-balance/text-pretty
**Files:** Multiple heading and paragraph elements

**Why it matters:** Improves text readability and visual balance.

**Fix:**
```tsx
// Before
<CardTitle className="text-2xl font-bold">...</CardTitle>
<p>...</p>

// After
<CardTitle className="text-2xl font-bold text-balance">...</CardTitle>
<p className="text-pretty">...</p>
```

### 5. Typography: Data should use tabular-nums
**Files:** Date/time displays, statistics

**Why it matters:** Numbers align better in tables and data displays.

**Fix:**
```tsx
// Before
<div className="text-2xl font-bold">12</div>

// After
<div className="text-2xl font-bold tabular-nums">12</div>
```

### 6. Layout: Z-index should use fixed scale
**Files:** `src/components/layout/dashboard-layout.tsx:50`

**Why it matters:** Arbitrary z-index values make layering unpredictable.

**Fix:** Use Tailwind's z-index scale (z-0 to z-50) or define custom scale in config.
