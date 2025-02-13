import * as route from "@arcgis/core/rest/route.js"
import RouteParameters from "@arcgis/core/rest/support/RouteParameters.js"
import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js"
import Graphic from "@arcgis/core/Graphic.js"
import { toggleProgessBar } from "./utils/utils.js"
import { div } from "./utils/html.js"
import { addFeaturesToMap, zoomToFeature } from "./main.js"
import { getDestinationsToFind } from "./createRoute.js"
import * as format from "./utils/format.js"
import { getGDOToken } from "./utils/tokenAuth.js"
import { routeLineSymbol, routePointSymbol, labelClass } from "./utils/symbols.js"
import { getTravelMode } from "./routeUtils.js"
import { featuresToAddressList } from "./components/addressList.js"

const useGDO = false

// ArcGIS Location Platform routing service
let routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
let travelModeName = 'Walking Time'
const apiKey = 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'
let resultTotalTravelTime = 'Total_WalkTime'
let resultTotalLength = 'Total_Kilometers'
let token = apiKey

// Geodata Online routing service
const gdoUrl = 'https://services.geodataonline.no/arcgis/rest/services/Geosok/GeosokRute3/NAServer/Route'
const gdoTravelModeName = 'Gange'
let gdoTotalTravelTime = 'Total_WalkTime'
let gdoTotalLength = 'Total_Meters_Gange'

const minPrDoor = 3
const kmPrDoor = 0.025

const setRoutingService = async () => {
  routeUrl = useGDO ? gdoUrl : routeUrl
  travelModeName = useGDO ? gdoTravelModeName : travelModeName
  resultTotalTravelTime = useGDO ? gdoTotalTravelTime : resultTotalTravelTime
  resultTotalLength = useGDO ? gdoTotalLength : resultTotalLength
  let url = ''

  if (useGDO) {
    token = await getGDOToken()
    url = `${routeUrl}?token=${token}`
  } else {
    url = routeUrl
  }
  return url
}


export const getRoute = async (features) => {
  let url = await setRoutingService()

  features = features.map(f => {
    
    let name = {
      adresse: f.attributes.adresse,
      bruksenhet: f.attributes.bruksenhetsnr
    }
    
    return new Graphic({
      geometry: f.geometry,
      attributes: {Name: JSON.stringify(name)}
    })
  })

  let travelMode = await getTravelMode(routeUrl, token, travelModeName)

  const routeParams = new RouteParameters({
    stops: new FeatureSet({
      features
    }),
    returnStops: true,
    returnDirections: false,
    findBestSequence: true,
    preserveFirstStop: true,
    preserveLastStop: false,    
    travelMode: travelMode
  })

  route.solve(url, routeParams)
    .then((data)=> {
      if (data.routeResults.length > 0) {
        addRouteStats(data.routeResults[0].route, data.routeResults[0].stops)
        addRouteStopsToMap(data.routeResults[0].stops)
        //addGroupedAddressList(data.routeResults[0].stops)
        featuresToAddressList(data.routeResults[0].stops)
      }
    })
    .catch((error)=>{
      console.log(error);
    })
}

export const removeResults = () => {
  let results = document.getElementById('result-text')
  results.innerHTML = ''

  let list = document.getElementById('result-list')
  list.innerHTML = ''
}

const addRouteStopsToMap = (stops) => {
  
  const label = labelClass('Sequence')
  stops = stops.map(stop => {
    return {
      geometry: stop.geometry, 
      attributes: {
        OBJECTID: stop.attributes.ObjectID, 
        Name: stop.attributes.Name, 
        Sequence: stop.attributes.Sequence
      }
    }
  })

  let pointSymbol = routePointSymbol()
  addFeaturesToMap(
    stops,
    [
      {name: "OBJECTID",type: "oid"},
      {name: "Name",type: "string"},
      {name: "Sequence",type: "integer"}
    ], 
    'OBJECTID', 
    pointSymbol, 
    label, 
    'Rutestopp')
}

const addRouteStats = (route, stops) => {
  console.log('Managed to calc route')
  let mins = route.attributes[resultTotalTravelTime]
  let total = mins + minPrDoor * getDestinationsToFind()

  let kms = route.attributes[resultTotalLength]

  kms = (useGDO) ? kms / 1000 : kms
  //kms += kmPrDoor * getDestinationsToFind()

  let results = document.getElementById('result-text')
  results.innerHTML = ''

  let stopCountDiv = div(null, `Antall dører å banke på: ${stops.length}`)
  let time = div(null, `Estimert gangtid er ${format.time(mins)}`)
  let length = div(null, `Estimert gangavstand er ${format.distance(kms)}`)
  let totalTime = div(null, `Estimert tidsbruk er ${format.time(total)} (3 min pr dør)`)
  results.append(stopCountDiv, time, length, totalTime)

  let resultBlock = document.getElementById('result-block')
  resultBlock.open = true

  let fields = [
    {
      name: "FirstStopID",
      type: "string"
    },
    {
      name: "LastStopID",
      type: "string"
    },
    {
      name: "Name",
      type: "string"
    },
    {
      name: "OBJECTID",
      type: "string"
    },
    {
      name: "Shape_Length",
      type: "double"
    },
    {
      name: "StopCount",
      type: "integer"
    },
    {
      name: "Total_Kilometers",
      type: "double"
    },
    {
      name: "Total_Miles",
      type: "double"
    },
    {
      name: "Total_WalkTime",
      type: "double"
    }
  ]


  let lineSymbol = routeLineSymbol()
  addFeaturesToMap([route], fields, 'ObjectId', lineSymbol, null, 'Rute')
  toggleProgessBar()
}

const addRouteStops = (stops) => {
  let list = document.getElementById('result-list')

  stops.forEach(stop => {
    list.appendChild(addressListItem(stop))
  })
}

