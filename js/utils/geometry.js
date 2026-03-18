import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js'

export const sortFeaturesByDistance = (origin, destinations) => {
  let distances = []

  destinations.forEach(d => {
    const dist = geometryEngine.distance(origin, d.geometry)
    distances.push({feature: d, distance: dist})
  })

  distances.sort((a,b) => {return a.distance - b.distance})
  return distances.map(d => d.feature)
}

export const avgDistanceClosest = (origin, destinations, count) => {
  const byDistance = sortFeaturesByDistance(origin, destinations)
  const closest = byDistance.slice(0, count)
  let sum = 0
  closest.forEach((c, idx) => { 
    if (idx < closest.length - 1) sum += geometryEngine.distance(c.geometry, closest[idx + 1].geometry)
  })

  return sum / closest.length
}


