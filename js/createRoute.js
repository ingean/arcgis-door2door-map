import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js"
import { addFeaturesToMap } from "./main.js"
import { getRoute } from "./Routing.js"
import { setReservedDestinations, clearReservations, bookReservations } from "./bookReservations.js"
import { toggleProgessBar } from "./utils/utils.js"
import { ErrorAlert, WarningAlert } from './components/Alert.js'
import { solveODMatrix } from './ODMatrix.js'
import { createEuclidRoute } from "./euclidRoute.js"
import { getTextFromString } from "./utils/format.js"
import { avgDistanceClosest, sortFeaturesByDistance } from "./utils/geometry.js"
import { candidatePointSymbol, odInPointSymbol, odLineSymbol, labelClass, routeLineSymbol, routePointSymbol } from "./utils/symbols.js"
import { solveVRP } from "./VRP.js"

const maxSearchDistance = 8
const useVRP = true

let destinationLayerView = null
let origin = null
let onStreetCount = 0
let onStreetCandidates = null

const checkDestinations = (destinations) => {
  if (destinations.length == 0) {
    const error = new ErrorAlert({
      title: 'Klarer ikke lage rute',
      message: `Ingen bruksenheter nærmere enn ${maxSearchDistance} km fra valgt startpunkt`,
    })
    toggleProgessBar()
    return false
  } else if (destinations.length < getDestinationsToFind() * 3) {
    const warning = new WarningAlert({
      title: 'Få boenheter i nærområdet',
      message: `Kun ${destinations.length} boenheter nærmere enn ${maxSearchDistance} km fra valgt startpunkt`
    })
    return true
  } else return true
}


export const createRoute = async (searchResult) => {
  toggleProgessBar()
  clearReservations()

  let streetName = null

  if (searchResult) {
    origin = searchResult.result.feature
    origin.attributes.Name = 'Startpunkt'
    streetName = parseAddress(searchResult.result.name)
  }

  const origins = new FeatureSet({features: [origin]})
  let candidates = await getEulideanDestinations(origin.geometry, 0.1, streetName)
  if (!checkDestinations(candidates.features)) return
 
  candidates.features = sortFeaturesByDistance(origin.geometry, candidates.features)
  //showCandidatesInMap(candidates)

  const destinationsToFind = adjustDestinationsToFind(origin, candidates.features)

  const candidateLimit = (useVRP) ? 200 : 1000
  const maxCandidates = (destinationsToFind * 3 < candidateLimit) ? destinationsToFind * 3 : candidateLimit 
 
  const candidatesFeatures = candidates.features.slice(0, maxCandidates)
  const destinations = new FeatureSet({features: candidatesFeatures, fields: candidates.fields})

  if (useVRP) { 
    createVRPRoute(origins, destinations) 
  } else { 
    createODRoute(origins, destinations, destinationsToFind) 
  }
}

const createVRPRoute = async (origins, destinations) => {
  //showODInputInMap(destinations)
  await solveVRP(origins, destinations, 120)
}

const createODRoute = async (origins, destinations, destinationsToFind) => {
  //showODInputInMap(destinations)
  const odResults = await solveODMatrix(origins, destinations, destinationsToFind)
  //showODResultsInMap(odResults)
  showResults(origins, odResults)
}

const showCandidatesInMap = (candidates) => {
  let pointSymbol = candidatePointSymbol()
  console.log(`Antall kandidater (luftlinje): ${candidates.features.length}`)
  addFeaturesToMap(candidates.features, candidates.fields, 'OBJECTID', pointSymbol, null, 'Kandidater')
}

const showODInputInMap = (destinations) => {
  let pointSymbol = odInPointSymbol()
  console.log(`Antall kandidater sendt til analyse: ${destinations.features.length}`)
  addFeaturesToMap(destinations.features, destinations.fields, 'OBJECTID', pointSymbol, null, 'OD input')
}

const showODResultsInMap = (odResults) => {
  const label = labelClass('Total_Time', 'above-center')
  const pointSymbol = odLineSymbol()
  console.log(`Antall resultater fra OD-matrise: ${odResults.features.length}`)
  addFeaturesToMap(odResults.features, odResults.fields, 'OBJECTID', pointSymbol, label, 'OD Resultater')
}

const showResults = async (origins, odResults) => {
  const maxDCount = getDestinationsToFind()
 
  //addFeaturesToMap(result.features, result.fields, lineSymbol, 'Linjer')
  //addFeaturesToMap(result.features, result.fields, pointSymbol, 'Punkter')
 
  const selectedDestinations = await getSelectedDestinations(odResults.features)
  console.log(`Antall valgte destinasjoner: ${selectedDestinations.features.length}`)

  getRoute(origins.features.concat(selectedDestinations.features))
  //setReservedDestinations(selectedDestinations.features)
  //bookReservations('PendingReservation')
}

export const setDestinationLayerView = (layerView) => {
  destinationLayerView = layerView
}

export const setOrigin = (searchResult) => {
  let btn = document.getElementById('create-route-btn')
  btn.disabled = false
  origin = searchResult.result.feature
}

export const getDestinationsToFind = () => {
  let element = document.getElementById("unit-count")  
  return element.value
}

export const adjustDestinationsToFind = (origin, features) => {
  let destinationsToFind = getDestinationsToFind()

  //let avDistance = avgDistanceClosest(origin, features, destinationsToFind)
  
  //Check what the distance will be
  //console.log(avDistance)
  
  return destinationsToFind
}

const getEulideanDestinations = async (origin, distance, streetName, onStreet = true) => {
  let where = `Status = 'Available'`
  if (onStreet) {
    where += ` AND adressenavn LIKE '${streetName}'`
  } else {
    where += ` AND adressenavn NOT LIKE '${streetName}'`
  }
  
  const query = destinationLayerView.layer.createQuery()
  query.geometry = origin
  query.distance = distance
  query.units = "kilometers"
  query.where = where
  query.outFields = ['OBJECTID', 'ServiceTime', 'Status', 'adresse', 'bruksenhetsnr', 'adressenavn']

  let result = await destinationLayerView.layer.queryFeatures(query)
  //result.features = sortFeaturesByDistance(origin, result.features)
  
  const maxCandidateCount = getDestinationsToFind() * 3

  if (onStreetCount + result.features.length < maxCandidateCount && distance * 2 < maxSearchDistance) {
    if (result.features.length === onStreetCount || onStreetCandidates) {
      if (!onStreetCandidates) onStreetCandidates = result
      return await getEulideanDestinations(origin, distance * 2, streetName, false)
    } else {
      onStreetCount = result.features.length
      return await getEulideanDestinations(origin, distance * 2, streetName)
    }
  } else {
    result.features = onStreetCandidates.features.concat(result.features)
    //result.features = sortFeaturesByDistance(origin, result.features)
    onStreetCount = 0
    onStreetCandidates = null
    return result
  }
}

const getSelectedDestinations = (odLineFeatures) => {
  const destinationIds = odLineFeatures.map(f => f.attributes.DestinationOID)

  const query = destinationLayerView.layer.createQuery()
  query.where = `ObjectID in (${destinationIds.toString()})`
  query.outFields = ['OBJECTID', 'Status', 'adresse', 'bruksenhetsnr']

  return destinationLayerView.layer.queryFeatures(query)
}

const parseAddress = (searchResult) => {
  let s = searchResult.split(',')
  if (s.length > 0) {
    return getTextFromString(s[0])
  }
    return null
}