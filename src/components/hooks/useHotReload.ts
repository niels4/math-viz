// Returns its argument. Pass a module-level function through it to list that
// function as an effect dep: its identity changes only when HMR replaces the
// module, so the effect reruns with the new code. A hook's return value counts
// as reactive to the React Compiler and both dependency lint rules, so the dep
// needs no lint suppression, and missing deps still get reported.
export const useHotReload = <T>(value: T): T => value
