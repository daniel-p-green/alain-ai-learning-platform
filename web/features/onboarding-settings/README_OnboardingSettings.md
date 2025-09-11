# ALAIN Onboarding + Settings Module

This folder provides a production-ready onboarding wizard and a clean Settings UI for ALAIN. Paste these into a Next.js (App Router) or a Vite React app.

## Files

1. `types.ts` — shared types and defaults
2. `useOnboarding.ts` — onboarding state with `start()`, `complete()`, `reset()`
3. `useSettings.ts` — providers/models/ui settings + import/export
4. `OnboardingWizard.tsx` - 5-step wizard
5. `SettingsPage.tsx` — tabs + Reset dialog
6. `OnboardingGate.tsx` — route guard component
7. `__tests__/useOnboarding.test.ts` — minimal unit test

Brand: Uses your Tailwind tokens (`alain-blue`, `alain-yellow`, `alain-stroke`, `paper-*`, `ink-*`).

## Next.js Wiring

- Route: `web/app/onboarding/page.tsx` already renders `OnboardingWizard`.
- Route: `web/app/settings/page.tsx` already renders the new `SettingsPage`.
- Gate usage (inside any client component):

```tsx
"use client";
import { useRouter } from "next/navigation";
import OnboardingGate from "@/features/onboarding-settings/OnboardingGate";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <OnboardingGate redirect={to => router.push(to)}>
      {children}
    </OnboardingGate>
  );
}
```

## Vite React Wiring (examples)

- Place files anywhere, then mount routes.

### App.tsx
```tsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import OnboardingWizard from './features/onboarding-settings/OnboardingWizard';
import SettingsPage from './features/onboarding-settings/SettingsPage';
import OnboardingGate from './features/onboarding-settings/OnboardingGate';

function Gate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return <OnboardingGate redirect={(to) => navigate(to)}>{children}</OnboardingGate>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Gate><div>Home</div></Gate>} />
      </Routes>
    </BrowserRouter>
  );
}
```

### main.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### index.html (fonts)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700&display=swap" rel="stylesheet">
```

## A11y
- Labels and `aria-describedby` on inputs
- Keyboard focus visible (`focus-visible` rings)
- Dialog: ESC to close, initial focus, modal semantics

## Events (console)
- `alain.onboarding.started`
- `alain.onboarding.completed`
- `alain.onboarding.reset`
- `alain.settings.saved`
- `alain.provider.tested` with `{ provider, success }`

## Test
Run with your existing test runner (vitest recommended). The test checks that reset toggles the onboarding flag to false.

```
vitest run web/features/onboarding-settings/__tests__/useOnboarding.test.ts
```

## Acceptance Checklist
- Finish the wizard → Settings → Reset onboarding → refresh → onboarding shows again.
- Provider Test buttons disable while testing and show success/error.
- LocalStorage keys update:
  - `alain.onboarding.completed` flips to `false` on reset.
  - `alain.onboarding.version` is `"1"`.
  - Provider and model settings persist to `alain.providers` and `alain.models`.
