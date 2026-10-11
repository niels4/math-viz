const trimSlashRegex = /^([/]*)|[/](?=[/])|([/]*)$/g

// remove starting, trailing, and duplicate slashes (see router-util.test.ts for examples)
export const trimSlashes = (route: string): string => route.replaceAll(trimSlashRegex, "")

export type RouteAndSearchString = {
  route: string
  search: string
}

export const getRouteAndSearchString = (): RouteAndSearchString => {
  const fullHash = window.location.hash.substring(1)
  const searchStart = fullHash.indexOf("?")

  if (searchStart < 0) {
    return { route: fullHash, search: "" }
  } else {
    return {
      route: fullHash.substring(0, searchStart),
      search: fullHash.substring(searchStart + 1),
    }
  }
}

export const createFullHash = (route: string, searchString: string): string => {
  return searchString.length === 0 ? route : `${route}?${searchString}`
}
