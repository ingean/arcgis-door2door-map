import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js"
import { addFeaturesToMap } from "./main.js"
import { getRoute } from "./Routing.js"
import { setReservedDestinations, clearReservations, bookReservations } from "./bookReservations.js"
import { toggleProgessBar } from "./utils/utils.js"
import { ErrorAlert, WarningAlert } from './components/Alert.js'
import { solveODMatrix } from './ODMatrix.js'
import { createEuclidRoute } from "./euclidRoute.js"
import { getTextFromString } from "./utils/format.js"

const maxSearchDistance = 3
const lineSymbol = {
  type: "simple-line", 
  color: [226, 119, 40],
  width: 6
}

const pointSymbol = {
  type: "esriSMS", 
  color: [255,255,255,64],
  style: "esriSLSSolid",
  size: 25
}

let destinationLayerView = null
let origin = null

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
    streetName = parseAddress(searchResult.result.name)
  }

  const origins = new FeatureSet({features: [origin]})
  let candidates = await getEulideanDestinations(origin.geometry, 0.1, streetName)
  if (!checkDestinations(candidates.features)) return
  
  const candidatesFeatures = candidates.features.slice(0, 1000) // Maximum 1000 destinations allowed
  const destinations = new FeatureSet({features: candidatesFeatures, fields: candidates.fields})
 
  const data = await solveODMatrix(origins, destinations, getDestinationsToFind())
  //const data = createEuclidRoute(origins, destinations, getDestinationsToFind())
  showResults(data)
}

const showResults = async (result) => {
  const maxDCount = getDestinationsToFind()
 
  //addFeaturesToMap(result.features, result.fields, lineSymbol, 'Linjer')
  //addFeaturesToMap(result.features, result.fields, pointSymbol, 'Punkter')
 
  const selectedDestinations = await getSelectedDestinations(result.features)
  getRoute(selectedDestinations.features)
  setReservedDestinations(selectedDestinations.features)
  bookReservations('PendingReservation')
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

const getEulideanDestinations = async (origin, distance, streetName = null) => {
  let where = `Status = 'Available'`
  if (streetName) where += ` AND adressenavn LIKE '${streetName}'`
  
  const query = destinationLayerView.layer.createQuery()
  query.geometry = origin
  query.distance = distance
  query.units = "kilometers"
  query.where = where
  query.outFields = ['OBJECTID', 'Status', 'adresse', 'bruksenhetsnr', 'adressenavn']

  let result = await destinationLayerView.queryFeatures(query)
  const maxDCount = getDestinationsToFind()

  if (result.features.length < maxDCount * 3) {
    if (distance * 2 > maxSearchDistance) return result
    return await getEulideanDestinations(origin, distance * 2, streetName)
  } else {
    return result
  }
}

const getSelectedDestinations = (odLineFeatures) => {
  const destinationIds = odLineFeatures.map(f => f.attributes.DestinationOID)

  const query = destinationLayerView.layer.createQuery()
  query.where = `ObjectID in (${destinationIds.toString()})`
  query.outFields = ['OBJECTID', 'Status', 'adresse', 'bruksenhetsnr']

  return destinationLayerView.queryFeatures(query)
}

const parseAddress = (searchResult) => {
  let s = searchResult.split(',')
  if (s.length > 0) {
    return getTextFromString(s[0])
  }
    return null
}