import esriConfig from 'https://js.arcgis.com/4.22/@arcgis/core/config.js'
import WebMap from 'https://js.arcgis.com/4.22/@arcgis/core/WebMap.js'
import MapView from 'https://js.arcgis.com/4.22/@arcgis/core/views/MapView.js'
import ActionBar from './ActionBar.js'
import MapTheme from './MapTheme.js'
import * as OAuth2 from './OAuth2.js'

//esriConfig.apiKey = 'AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL'
const portal = await OAuth2.authenticate() //Authenticate with named user using OAuth2

const webmapId = 'ed9c982d0d4d4dcf8415d3c46e20c4c7' // Publicly available webmap

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

theme.view = view

const actionBar = new ActionBar(view)

map.when(() => {
  const { title, description, thumbnailUrl, avgRating } = map.portalItem
  document.querySelector("#header-title").textContent = title
  document.querySelector("calcite-shell").hidden = false
  document.querySelector("calcite-loader").hidden = true
})
