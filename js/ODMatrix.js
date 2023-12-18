
import * as geoprocessor from "https://js.arcgis.com/4.28/@arcgis/core/rest/geoprocessor.js"
import FeatureSet from "https://js.arcgis.com/4.28/@arcgis/core/rest/support/FeatureSet.js"
import { addFeaturesToMap, zoomToFeature } from "./main.js"
import { getRoute } from "./Routing.js"
import { setReservedDestinations } from "./Booking.js"
import { toggleProgessBar } from "./Utils.js"

let destinationLayerView = null

const gpUrl = 'https://logistics.arcgis.com/arcgis/rest/services/World/OriginDestinationCostMatrix/GPServer/GenerateOriginDestinationCostMatrix'

const lineSymbol = {
  type: "simple-line",  // autocasts as SimpleLineSymbol()
  color: [226, 119, 40],
  width: 6
}

export const getDestinationsToFind = () => {
  let element = document.getElementById("unit-count")
  return element.value
}

export const setDestinationLayerView = (layerView) => {
  destinationLayerView = layerView
}

export const GetClosestWalkTime = async (result) => {
  toggleProgessBar()

  let origin = result.result.feature
  displayAddress(result.result.name)

  const origins = new FeatureSet();
  origins.features = [origin];

  let d = await getClosestDestinationsEulidean(origin.geometry, 0.1)
  d = d.slice(0, 1000) // Maximum 1000 destinations allowed
  const destinations = new FeatureSet()
  destinations.features = d

  const params = {
    origins: JSON.stringify(origins),
    destinations: JSON.stringify(destinations),
    number_of_destinations_to_find: getDestinationsToFind(),
    origin_destination_line_shape: 'Straight Line',
    outSR: {wkid: 25833},
    apiKey: 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'
  }

  const options = {
    outSpatialReference: {
      wkid: 25833
    }
  }

  geoprocessor.submitJob(gpUrl, params).then((jobInfo) => {
    const options = {
      statusCallback: (jobInfo1) => {
        logJobStatus(jobInfo1);
      }
    };
    jobInfo.waitForJobCompletion(options).then((jobInfo2) => {
      showResults(jobInfo2);
    });
  })
  .catch((error) => {
    console.error(`Failed to find closest, message: ${error}`)
  });
}

const showResults = (job) => {
  job.fetchResultData("output_origin_destination_lines").then(async data => {
    console.log(`Got the od lines`)
    
    const maxDCount = getDestinationsToFind()
    const features = data.value.features.slice(0, maxDCount)

    addFeaturesToMap(features, data.value.fields, lineSymbol, 'Linjer')
    const destinations = await getSelectedDestinations(features)
    getRoute(destinations.features)
    setReservedDestinations(destinations.features)
  })
}

const getClosestDestinationsEulidean = async (origin, distance) => {
  const query = destinationLayerView.layer.createQuery()
  query.geometry = origin
  query.distance = distance
  query.units = "kilometers"
  query.where = `Status = 'Ledig'`

  let result = await destinationLayerView.queryFeatures(query)
  const maxDCount = getDestinationsToFind()

  if (result.features.length < maxDCount * 3) {
    return await getClosestDestinationsEulidean(origin, distance * 2)
  } else {
    return result.features
  }
}

const logJobStatus = (jobInfo) => {
 console.log(`Job status: ${jobInfo.jobStatus}`)
}

const getSelectedDestinations = (odLineFeatures) => {
  const destinationIds = odLineFeatures.map(f => f.attributes.DestinationOID)

  const query = destinationLayerView.layer.createQuery()
  query.where = `ObjectID in (${destinationIds.toString()})`
  query.outFields = ['OBJECTID', 'Status', 'adresse', 'bruksenhetsnr']

  return destinationLayerView.queryFeatures(query)
}

export const displayAddress = (name) => {
  let text = document.getElementById('address-txt')
  text.value = name
}

