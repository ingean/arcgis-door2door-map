import WebMap from '@arcgis/core/WebMap.js'
import MapView from '@arcgis/core/views/MapView.js'
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js"
import Graphic from "@arcgis/core/Graphic.js"

export default class WebMapWrap {
  constructor(webMapItemId) {
    
    this.map = new WebMap({
      portalItem: { id: webMapItemId }
    })

    this.view =new MapView({
      map: this.map,
      container: "viewDiv",
      padding: { left: 49 }
    })

    this.map.when(() => {
      /*const { title, description, thumbnailUrl, avgRating } = this.map.portalItem
      document.querySelector("#header-title").textContent = title*/
      document.querySelector("calcite-shell").hidden = false
      document.querySelector("calcite-loader").hidden = true
    })  
  }

  zoomToLayer = (layer) => {
    layer.queryExtent()
    .then(response => {
       this.view.goTo(response.extent);
    })
  }

  zoomToFeature = (geometry) => {
    this.view.goTo(geometry)
  }

  addFeatures = (params) => {
    let graphics = params.features.map(f => {
      return new Graphic({
        geometry: f.geometry,
        attributes: f.attributes,
      })
    })
  
    let layer = new FeatureLayer({ 
      title: params.title,
      source: graphics,
      objectIdField: "ObjectID",
      fields: params.fields,
      renderer: {
        type: "simple",
        symbol: params.symbol
      }
    })
  
    this.map.add(layer)

    if (params?.zoomTo) this.zoomToLayer(layer)
    return layer
  }
}






