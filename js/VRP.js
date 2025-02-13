import * as geoprocessor from "@arcgis/core/rest/geoprocessor.js"
import { getTravelMode } from "./routeUtils.js"
import { toggleProgessBar } from "./utils/utils.js"
import { labelClass, routeLineSymbol, routePointSymbol } from "./utils/symbols.js"
import * as format from "./utils/format.js"
import { featuresToAddressList } from "./components/addressList.js"
import { addFeaturesToMap } from "./main.js"
import { div } from "./utils/html.js"

const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
const vrpUrl = 'https://logistics.arcgis.com/arcgis/rest/services/World/VehicleRoutingProblem/GPServer/SolveVehicleRoutingProblem'
const apiKey = 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'
const travelModeName = 'Walking Time'

const route = {
  "features": [
    {
      "attributes": {
        "Name": "Route",
        "StartDepotName": "Startpunkt",
        "EndDepotName": "Startpunkt",
        "MaxTotalTime": 120,
        "MaxOrderCount": 100
      }
    }
  ]
}

export const solveVRP = async (origins, destinations) => {
  const travelMode = await getTravelMode(routeUrl, apiKey, travelModeName)
  travelMode.useHierarchy = false
  const params = {
    depots: origins,
    orders: destinations,
    routes: route,
    time_units: "Minutes",
    populate_stop_shapes: true,
    travel_mode: travelMode,
    token: apiKey,
    f:'json'
  }

  params["env:outSR"] = {wkid: 25833}

  try {
    let jobInfo = await geoprocessor.submitJob(vrpUrl, params)
    const options = {statusCallback: jobStatus => logJobStatus(jobStatus)}
  
    let result = await jobInfo.waitForJobCompletion(options)
    let stops = await result.fetchResultData("out_stops")
    let routes = await result.fetchResultData("out_routes")
    let vrpResults = {stops: stops.value, routes: routes.value}
    showResults(vrpResults)
  } catch (error) {
    console.error(`Failed to solve the VRP. Message: ${error}`)
    return null
  }  
}
const logJobStatus = (jobInfo) => {
  console.log(`VRP job status: ${jobInfo.jobStatus}`)
}

const showResults = (vrpResults) => {
  showVRPResultsInMap(vrpResults) // Show stops and route in map
  featuresToAddressList(vrpResults.stops.features) // Show an ordered list of stops
  
  // Show statistics for route
  let route = vrpResults.routes.features[0]
  let totalTime = route.attributes['TotalTime'] 
  let totalTravelTime = route.attributes['TotalTravelTime']   
  let totalDistance = route.attributes['TotalDistance']

  let results = document.getElementById('result-text')
  results.innerHTML = ''

  let stopCountDiv = div(null, `Antall dører å banke på: ${vrpResults.stops.features.length}`)
  let travelTimeDiv = div(null, `Estimert gangtid er ${format.time(totalTravelTime)}`)
  let distanceDiv = div(null, `Estimert gangavstand er ${format.distance(totalDistance)}`)
  let timeDiv = div(null, `Total estimert tidsbruk er ${format.time(totalTime)} (3 min pr dør)`)
  results.append(stopCountDiv, travelTimeDiv, distanceDiv, timeDiv)

  let resultBlock = document.getElementById('result-block')
  resultBlock.open = true
  
  toggleProgessBar()
}

const showVRPResultsInMap = (vrpResults) => {
  const label = labelClass('Sequence')
  const lineSymbol = routeLineSymbol()
  const pointSymbol = routePointSymbol()

  console.log(`Antall resultater fra VRP: ${vrpResults.stops.features.length}`)
  addFeaturesToMap(vrpResults.stops.features, vrpResults.stops.fields, 'ObjectID', pointSymbol, label, 'VRP Stops')
  addFeaturesToMap(vrpResults.routes.features, vrpResults.routes.fields, 'ObjectID', lineSymbol, null, 'VRP Route')
}