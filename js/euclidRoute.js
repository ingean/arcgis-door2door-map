import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js"

export const createEuclidRoute = (origins, destinations, destinationsToFind) => {

  let route = [origins.features[0]]
  let routeCount = destinationsToFind < destinations.features.length ? destinationsToFind : destinations.feature.length
  let startpoint = origins.features[0]
  let points = destinations.features 

  for (let i = 0; i < routeCount; i++) {
    const closestFeature = findClosestFeature(startpoint, points)
    
    route.push(closestFeature)
    points = removeFeatureFromFeatures(closestFeature, points)
    startpoint = closestFeature
  }

  return new FeatureSet({features: route, fields: destinations.fields})
}

const findClosestFeature = (feature, features) => {
  let closestFeature = null
  let closestDistance = 9999999999999999999
  
  features.forEach(f => {
    let distance = geometryEngine.distance(feature.geometry, f.geometry)
    if (distance < closestDistance && distance > 0) {
      closestDistance = distance
      closestFeature = f
    }
  })
  return closestFeature
}

const removeFeatureFromFeatures = (feature, features) => {
  return features.filter(f => f.attributes.OBJECTID != feature.attributes.OBJECTID)
}