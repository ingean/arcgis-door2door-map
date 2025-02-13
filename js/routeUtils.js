import * as networkService from "@arcgis/core/rest/networkService.js"

export const getTravelMode = async (routeUrl, token, travelModeName) => {
  let serviceDescription = await networkService.fetchServiceDescription(routeUrl, token)
  const { supportedTravelModes } = serviceDescription;
  return supportedTravelModes.find((mode) => mode.name === travelModeName);
}