import * as route from "https://js.arcgis.com/4.28/@arcgis/core/rest/route.js"
import * as networkService from "https://js.arcgis.com/4.28/@arcgis/core/rest/networkService.js"
import RouteParameters from "https://js.arcgis.com/4.28/@arcgis/core/rest/support/RouteParameters.js"
import FeatureSet from "https://js.arcgis.com/4.28/@arcgis/core/rest/support/FeatureSet.js"
import Graphic from "https://js.arcgis.com/4.28/@arcgis/core/Graphic.js"
import { toggleProgessBar } from "./Utils.js"
import { div } from "./html.js"
import { element } from "./html.js"
import { addFeaturesToMap, zoomToFeature } from "./main.js"
import { getDestinationsToFind } from "./ODMatrix.js"
import { formatDistance, formatTime } from "./Utils.js"

const apiKey = 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'
const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
const minPrDoor = 3
const kmPrDoor = 0.025

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
        groupedAddressList(data.routeResults[0].stops)
      }
    })
    .catch((error)=>{
      console.log(error);
    })
}

export const removeRouteStats = () => {
  let results = document.getElementById('result-text')
  results.innerHTML = ''
}

const addRouteStats = (route) => {
  console.log('Managed to calc route')
  let mins = route.attributes['Total_WalkTime']
  let total = mins + minPrDoor * getDestinationsToFind()
  let kms = route.attributes['Total_Kilometers'] + kmPrDoor * getDestinationsToFind()

  let results = document.getElementById('result-text')
  let time = div(null, `Estimert gangtid er ${formatTime(mins)}`)
  let length = div(null, `Estimert gangavstand er ${formatDistance(kms)}`)
  let totalTime = div(null, `Estimert tidsbruk er ${formatTime(total)} (3 min pr dør)`)
  results.append(time, length, totalTime)

  addFeaturesToMap([route], '', '', 'Rute')
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

const groupedAddressList = (stops) => {
  let list = document.getElementById('result-list')
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
      description: `Stopp ${nr} på ruten (${formatTime(min)} ${formatDistance(dist)})`
    }, 
    action
  )
}