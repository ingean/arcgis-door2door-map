import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js'


export const avgDistanceClosest = (origin, destinations, count) => {

  let distances = []

  destinations.forEach(d => {
    const dist = geometryEngine.distance(origin.geometry, d.geometry)
    distances.push({geometry: d.geometry, distance: dist})
  })

  const byDistance = distances.sort((a,b) => {return a.distance - b.distance})
  const closest = byDistance.slice(0, count)
  let sum = 0
  closest.forEach((c, idx) => { 
    if (idx < closest.length - 1) sum += geometryEngine.distance(c.geometry, closest[idx + 1].geometry)
  })

  return sum / closest.length
}