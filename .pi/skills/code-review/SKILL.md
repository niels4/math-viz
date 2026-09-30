---
name: code-review
description: Review code for viz3d1 strictness, readability and pitfalls. Use when the user says "review", "code review", "check this", or before merging AI-generated viz or util code.
---

# Code Review - viz3d1

Review with the repo's max strictness in mind. TypeScript is Rust-like strict, oxlint is type-aware. Guide, do not nitpick style.

Enforcing pure functional style and `readonly` everywhere at the linter level is a mistake for this repo. Simple imperative code with `for` loops, `let buffer`, `push`, or direct `arr[i] ?? 0` can be more performant and easier to read than `readonly` + `map`/`spread` chains. `oxlint` intentionally does not enable `functional`/`unicorn` pure-functional rules. `readonly` is a review-time suggestion only where it prevents a real shared-mutation bug, not a CI failure.

## When to Use

- User says `review`, `code review`, `check this`, `is this clean?`
- Before merging AI-generated `src/pages/**` or `src/draw/**` code
- After `npm run typecheck` or `npx oxlint` shows new errors

## Checklist - Must Pass

- `npm run typecheck` - 0 errors (`strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`)
- `npx oxlint` - 0 errors (`correctness: error`, `suspicious: error`, `typeAware: true`, `typescript/no-deprecated: error`)
- `npm run build` - 0 errors, no `Clock` deprecated, no floating promises

## Review Focus - Pitfalls AI Hits

### 1. Undefined and Optionality

- `arr[i]` is `T | undefined` - require `?? 0`, `if (v === undefined) return`, or `get(arr,i)` helper. Never assume defined.
- `values[0]` after `if (values.length === 0) return` still needs `if (first === undefined) return` - compiler does not narrow.
- `process.env.FOO` must be `process.env["FOO"]`, `routes._not_found` must be `routes["_not_found"]` - `noPropertyAccessFromIndexSignature`.
- `prop?: string` is not `prop?: string | undefined` - `exactOptionalPropertyTypes` distinguishes missing vs `undefined`.

Remind: mark `readonly` where it makes sense - `readonly number[]`, `readonly CartesianPoint[]`, `Readonly<Domain>` for buffers, domains, point arrays that should not mutate. Do not force `readonly` everywhere, suggest where it prevents accidental mutation (shared buffers, `initialBuffer()`, `domainFor`).

### 2. Type Assertions

- `as` is banned by `no-unsafe-type-assertion` - prefer `get()` helper, `instanceof` checks, or `as unknown as T` with `// oxlint-disable-next-line` and comment.
- `as any` is almost always wrong - use `as React.CSSProperties` only if needed, otherwise remove.
- `!` non-null assertion is banned - use `if (v === undefined) throw` or `??`.

### 3. Promises and Effects

- Every promise must be `await` or `void` - `no-floating-promises` (`void init()`, `void renderer.setAnimationLoop(...)`).
- `useEffect` cleanup must be `return () => {}` or `return undefined` - `consistent-return` is disabled for React, but keep early `return` as `return;` not `return () => {}` confusion.
- `Clock` is deprecated - use `Timer` + `timer.update()` + `getDelta()`/`getElapsed()`.

### 4. Imports and Modules

- Relative imports use `import type` for types, carry `.ts` extension (`from "#src/util/foo.ts"` for project, `./helper.ts` for sibling) - `verbatimModuleSyntax` + `allowImportingTsExtensions`.
- No `html`/`body`/`:root` in CSS Modules - themes use `.theme` wrapper with `oklch`, `oxfmt` style.

### 5. Readonly Guidance - Suggest, Do Not Enforce

`readonly` is not enforced by the linter for a reason. Suggest it only where it prevents a real bug:

- Array is input and should not be mutated inside function - `function makePath(values: readonly number[])`
- Object is shared config/domain - `function domainFor(values: readonly number[]): Readonly<Domain>`
- Props that are not mutated - `type Props = { readonly points: readonly CartesianPoint[] }`

Do not suggest `readonly` for local mutable buffers that are intentionally mutated (`let buffer = initialBuffer()` then `buffer = [...buffer, next]` or `buffer.push` in a hot loop is okay and often faster/clearer). If a simple `for` with `let` and `push` is more readable and performant than a `readonly` + `map`/`spread` chain, prefer the imperative version and do not flag it.

## How to Review

1. Run `npx oxlint` and `npm run typecheck` - note categories.
2. Scan `src/pages/**` for `arr[i]` without guard, `as` without disable, floating promises without `void`.
3. Check `src/draw/**` for `p[i]` etc - should use `get()` helper.
4. Suggest `readonly` only where it prevents a real bug, not everywhere. Example comment: `// suggestion: mark as readonly - this buffer is shared and should not be mutated`.

Keep comments short, active voice, no em dashes. Fix must pass `npm test` (`oxlint && tsc -b --noEmit && vitest`).
