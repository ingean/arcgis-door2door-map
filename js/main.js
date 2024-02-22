import esriConfig from "@arcgis/core/config.js";
import WebMapWrap from './components/WebMap.js'
import ActionBar from './components/ActionBar.js'
import MapTheme from './components/MapTheme.js'
//import { authenticate } from './utils/OAuth2.js'
import { setDestinationLayerView } from './createRoute.js'
import { setDestinationLayer } from './Booking.js'

//const appId = 'xG2kkVesAXGRx5t1'
//const portal = await authenticate(appId) // ArcGIS Identity authentication

esriConfig.apiKey = "AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL"

const webMapId = 'fa870b3d27b743cbb444445bf244b839' // Shared public
const webmap = new WebMapWrap(webMapId)

const actionBar = new ActionBar(webmap.view, 'route')
const theme = new MapTheme(webmap.view) 

let resultLayer = null

webmap.map.when(() => {
  const destinationLayer = webmap.map.layers.getItemAt(0)
  destinationLayer.outFields = ['OBJECTID', 'Status', 'adresse', 'bruksenhetsnr']
  webmap.view.whenLayerView(destinationLayer).then((layerView) => {setDestinationLayerView(layerView)})
  setDestinationLayer(destinationLayer)
})

export const addFeaturesToMap = (features, fields, symbol, title) => {
  resultLayer = webmap.addFeatures({features, fields, symbol, title, zoomTo: true})
}

export const resetMap = () => {
  if (!webmap) return 
  webmap.map.remove(resultLayer)
  resultLayer = null
}

export const zoomToLayer = (layer) => {
  webmap.zoomToLayer(layer)
}

export const zoomToFeature = (geometry) => {
  webmap.zoomToFeature(geometry)
}
