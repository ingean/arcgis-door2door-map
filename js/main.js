import esriConfig from "@arcgis/core/config.js";
import WebMapWrap from './components/WebMap.js'
import ActionBar from './components/ActionBar.js'
import MapTheme from './components/MapTheme.js'
//import { authenticate } from './utils/OAuth2.js'
import { setDestinationLayerView } from './createRoute.js'
import { setDestinationLayer } from './bookReservations.js'

//const appId = 'xG2kkVesAXGRx5t1'
//const portal = await authenticate(appId) // ArcGIS Identity authentication

esriConfig.apiKey = 'AAPTxy8BH1VEsoebNVZXo8HurA8dyxjSj4XNI3Hw_8XE0kaDhPagbQJovEVugPhlDQgIL5Of4jbDy00bwYlcVZ0wDODocm2Jlf6MF62hfkvTqukbwEmgMdV6ZjlNBZM0KM2DEEVZYX1jqZo14YcAxwVEdlrDtiyYD5Q1ERhlCYLb_yVrG-diu-jwOxs74kuJpq8SHEn-DrPcrv6ii3-nYA3qYsRrEjiHfOb7WRVC1P_-8A603yVVW7Cc6z29MMWJFFj2qMpGk2IgD_4bTcrI9wSRXA..AT1_6g0I0jYk'
//esriConfig.apiKey = "AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL"

const webMapId = 'fa870b3d27b743cbb444445bf244b839' // Shared public
const webmap = new WebMapWrap(webMapId)

const actionBar = new ActionBar(webmap.view, 'route')
const theme = new MapTheme(webmap.view) 

let resultLayer = null

webmap.map.when(() => {
  const destinationLayer = webmap.map.layers.getItemAt(0)
  destinationLayer.outFields = ['OBJECTID', 'Name', 'ServiceTime', 'Status', 'adresse', 'bruksenhetsnr', 'adressenavn']
  webmap.view.whenLayerView(destinationLayer).then((layerView) => {setDestinationLayerView(layerView)})
  setDestinationLayer(destinationLayer)
})

export const addFeaturesToMap = (features, fields, ObjectIDField, symbol, labelClass = null, title) => {
  resultLayer = webmap.addFeatures({features, fields, ObjectIDField, symbol, labelClass, title, zoomTo: true})
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
