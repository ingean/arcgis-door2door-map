import WebMap from 'https://js.arcgis.com/4.28/@arcgis/core/WebMap.js'
import MapView from 'https://js.arcgis.com/4.28/@arcgis/core/views/MapView.js'
import FeatureLayer from "https://js.arcgis.com/4.28/@arcgis/core/layers/FeatureLayer.js"
import Graphic from "https://js.arcgis.com/4.28/@arcgis/core/Graphic.js"
import ActionBar from './ActionBar.js'
import MapTheme from './MapTheme.js'
import * as OAuth2 from './OAuth2.js'
import { setDestinationLayerView } from './ODMatrix.js'
import { setDestinationLayer } from './Booking.js'
import { displayAddress } from './ODMatrix.js'

const portal = await OAuth2.authenticate() // ArcGIS Identity authentication
const webmapId = 'fa870b3d27b743cbb444445bf244b839'
const theme = new MapTheme() // Contains light and dark basemap

const map = new WebMap({
  portalItem: {
    id: webmapId
  }
});

const view = new MapView({
  map,
  container: "viewDiv",
  padding: {
    left: 49
  }
});

let resultLayer = null


theme.view = view

const actionBar = new ActionBar(view, 'route')

map.when(() => {
  const { title, description, thumbnailUrl, avgRating } = map.portalItem
  document.querySelector("#header-title").textContent = title
  document.querySelector("calcite-shell").hidden = false
  document.querySelector("calcite-loader").hidden = true

  const destinationLayer = map.layers.getItemAt(0)
  destinationLayer.outFields = ['OBJECTID', 'Status', 'adresse', 'bruksenhetsnr']
  view.whenLayerView(destinationLayer).then((layerView) => {setDestinationLayerView(layerView)})
  setDestinationLayer(destinationLayer)
})

export const addFeaturesToMap = (features, fields, symbol, title) => {
  let graphics = features.map(f => {
    return new Graphic({
      geometry: f.geometry,
      attributes: f.attributes,
      symbol
    })
  })

  resultLayer = new FeatureLayer({ 
    title,
    source: graphics,
    objectIdField: "ObjectID",
    fields
  })

  map.add(resultLayer)
  //zoomToLayer(resultLayer)
}

export const resetMap = () => {
  map.remove(resultLayer)
  resultLayer = null
}

export const zoomToLayer = (layer) => {
  view.goTo(layer.fullExtent)
}

export const zoomToFeature = (geometry) => {
  view.goTo(geometry)
}

document.getElementById('clear-address-btn')
.addEventListener('click', event => {
  displayAddress()
})
