import Bookmarks from '@arcgis/core/widgets/Bookmarks.js'
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery.js'
import LayerList from '@arcgis/core/widgets/LayerList.js'
import Legend from '@arcgis/core/widgets/Legend.js'
import Print from '@arcgis/core/widgets/Print.js'
import Fullscreen from "@arcgis/core/widgets/Fullscreen.js"
import Search from "@arcgis/core/widgets/Search.js"
import Extent from "@arcgis/core/geometry/Extent.js"
import { setOrigin, createRoute } from '../createRoute.js'
import { clearReservations } from '../bookReservations.js'

export default class ActionBar {
  constructor(view, defaultActiveWidgetId = null) {
    this.view = view
    this.activeWidget = defaultActiveWidgetId
    this.widgets = {
      basemaps: new BasemapGallery({
        view,
        container: "basemaps-container"
      }),
      bookmarks: new Bookmarks({
        view,
        container: "bookmarks-container"
      }),
      layerList: new LayerList({
        view,
        selectionEnabled: true,
        container: "layers-container"
      }),
      legend: new Legend({
        view,
        container: "legend-container"
      }),
      print: new Print({
        view,
        container: "print-container"
      }),
      fullscreen: new Fullscreen({
        view: view
      }),
      search: new Search({
        view: view, 
        container: 'search-widget',
        includeDefaultSources: false,
        sources: [
          {
          name: "Esri locator",
          placeholder: "Skriv inn adressen din",
          apiKey: "AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL",
          url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
          filter: { 
            geometry: new Extent(({
              xmin: 328168.512, 
              ymin: 7149736.065,
              xmax: 337525.355, 
              ymax: 7156301.755,
              spatialReference: {
                wkid: 25833
              }
            }))
          }
        }]
      })
    }
    view.ui.move("zoom", "bottom-right")
    view.ui.add(this.widgets.fullscreen, "bottom-right")

    //this.widgets.search.on('select-result', results => setOrigin(results))
    this.widgets.search.on('select-result', results => createRoute(results))
    this.widgets.search.on('search-clear', e => clearReservations())

    document.querySelector("calcite-action-bar").addEventListener("click", this.handleActionBarClick)
    //document.getElementById('create-route-btn').addEventListener('click', createRoute)
  }

  handleActionBarClick = ({ target }) => { // Use fat arrow function or this will point at the clicked html element
    if (target.tagName !== "CALCITE-ACTION") return
    if (this.activeWidget) this.toggleActionBarItem(this.activeWidget, false)
    
    const nextWidget = target.dataset.actionId
    
    if (nextWidget !== this.activeWidget) {
      this.toggleActionBarItem(nextWidget, true)
      this.activeWidget = nextWidget
    } else {
      this.activeWidget = null
    }
  }

  toggleActionBarItem = (id, visible) => {
    document.querySelector(`[data-action-id=${id}]`).active = visible
    document.querySelector(`[data-panel-id=${id}]`).hidden = !visible
    let widget = this.widgets[id]
    if (widget) widget.visible = visible
  }
}

