
import * as geoprocessor from "@arcgis/core/rest/geoprocessor.js"
import { getTravelMode } from "./routeUtils.js"

const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
const gpUrl = 'https://logistics.arcgis.com/arcgis/rest/services/World/OriginDestinationCostMatrix/GPServer/GenerateOriginDestinationCostMatrix'
const travelModeName = 'Walking Time'
const apiKey = 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'


export const solveODMatrix = async (origins, destinations, destinationsToFind) => {
  const travelMode = await getTravelMode(routeUrl, apiKey, travelModeName)
  travelMode.useHierarchy = false
  const params = {
    origins: JSON.stringify(origins),
    destinations: JSON.stringify(destinations),
    number_of_destinations_to_find: destinationsToFind,
    origin_destination_line_shape: 'Straight Line',
    outSR: {wkid: 25833},
    travel_mode: travelMode,
    apiKey
  }

  try {
    let jobInfo = await geoprocessor.submitJob(gpUrl, params)
    const options = {statusCallback: jobStatus => logJobStatus(jobStatus)}
  
    let result = await jobInfo.waitForJobCompletion(options)
    let data = await result.fetchResultData("output_origin_destination_lines")
    return data.value
  } catch (error) {
    console.error(`Failed to solve the OD Matrix. Message: ${error}`)
    return null
  }  
}

const logJobStatus = (jobInfo) => {
  console.log(`OD Matrix job status: ${jobInfo.jobStatus}`)
}
