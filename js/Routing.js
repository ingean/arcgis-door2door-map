import * as route from "@arcgis/core/rest/route.js"
import * as networkService from "@arcgis/core/rest/networkService.js"
import RouteParameters from "@arcgis/core/rest/support/RouteParameters.js"
import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js"
import Graphic from "@arcgis/core/Graphic.js"
import { toggleProgessBar } from "./utils/utils.js"
import { div } from "./utils/html.js"
import { element } from "./utils/html.js"
import { addFeaturesToMap, zoomToFeature } from "./main.js"
import { getDestinationsToFind } from "./createRoute.js"
import * as format from "./utils/format.js"

const apiKey = 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'
const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
const minPrDoor = 3
const kmPrDoor = 0.025

const lineSymbol = {
  type: "simple-line", 
  color: [233, 104, 32],
  width: 4
}

export const getRoute = async (features) => {

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

  const routeParams = new RouteParameters({
    stops: new FeatureSet({
      features
    }),
    returnStops: true,
    returnDirections: false,
    travelMode: await getTravelMode()
  })

  route.solve(routeUrl, routeParams)
    .then((data)=> {
      if (data.routeResults.length > 0) {
        addRouteStats(data.routeResults[0].route)
        //addRouteStops(data.routeResults[0].stops)
        addGroupedAddressList(data.routeResults[0].stops)
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

const addRouteStats = (route) => {
  console.log('Managed to calc route')
  let mins = route.attributes['Total_WalkTime']
  let total = mins + minPrDoor * getDestinationsToFind()
  let kms = route.attributes['Total_Kilometers'] + kmPrDoor * getDestinationsToFind()

  let results = document.getElementById('result-text')
  results.innerHTML = ''

  let time = div(null, `Estimert gangtid er ${format.time(mins)}`)
  let length = div(null, `Estimert gangavstand er ${format.distance(kms)}`)
  let totalTime = div(null, `Estimert tidsbruk er ${format.time(total)} (3 min pr dør)`)
  results.append(time, length, totalTime)

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



  addFeaturesToMap([route], fields, lineSymbol, 'Rute')
  toggleProgessBar()
}

const addRouteStops = (stops) => {
  let list = document.getElementById('result-list')

  stops.forEach(stop => {
    list.appendChild(addressListItem(stop))
  })
}


const getTravelMode = async () => {
  const serviceDescription = await networkService.fetchServiceDescription(routeUrl, apiKey);
  const { supportedTravelModes } = serviceDescription;
  return supportedTravelModes.find((mode) => mode.name === "Walking Time");
}

const addGroupedAddressList = (stops) => {
  let list = document.getElementById('result-list')
  list.innerHTML = ''

  let groupedStops = Object.groupBy(stops, stop => {
    let name = JSON.parse(stop.attributes.Name)
    return name.adresse
  })

  for(let groupName in groupedStops) {
    let groupStops = groupedStops[groupName]
    if (groupStops.length > 1) {
      let group = addressListGroup(groupName)
      groupStops.forEach(s => group.appendChild(addressListItem(s, true)))
      list.appendChild(group)
    } else {
      list.appendChild(addressListItem(groupStops[0]))
    }
  }
}

const addressListGroup = (name) => {
  return element('calcite-list-item-group', {heading: name})
}

const addressListItem = (feature, grouped = false) => {
  let nr = feature.attributes.Sequence
  let min = feature.attributes.Cumul_WalkTime + nr * minPrDoor
  let dist = feature.attributes.Cumul_Kilometers + nr * kmPrDoor
  let stop = JSON.parse(feature.attributes.Name)
  let label = grouped ? stop.bruksenhet : stop.adresse
  
  let action = element('calcite-action', 
    {
      slot: 'actions-end',
      icon: `layer-zoom-to`
    }
  )
  //action.addEventListener('click', zoomToFeature(feature.geometry))
  return element('calcite-list-item', 
    {
      label,
      description: `Stopp ${nr} på ruten (${format.time(min)} ${format.distance(dist)})`
    }, 
    action
  )
}