import Bookmarks from 'https://js.arcgis.com/4.22/@arcgis/core/widgets/Bookmarks.js'
import BasemapGallery from 'https://js.arcgis.com/4.22/@arcgis/core/widgets/BasemapGallery.js'
import LayerList from 'https://js.arcgis.com/4.22/@arcgis/core/widgets/LayerList.js'
import Legend from 'https://js.arcgis.com/4.22/@arcgis/core/widgets/Legend.js'
import Print from 'https://js.arcgis.com/4.22/@arcgis/core/widgets/Print.js'
import Fullscreen from "https://js.arcgis.com/4.22/@arcgis/core/widgets/Fullscreen.js"

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
      })
    }
    view.ui.move("zoom", "bottom-right")
    view.ui.add(this.widgets.fullscreen, "top-right")
    document.querySelector("calcite-action-bar").addEventListener("click", this.handleActionBarClick)
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

