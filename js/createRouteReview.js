import * as geoprocessor from '@arcgis/core/rest/geoprocessor'
import * as networkService from '@arcgis/core/rest/networkService'
import * as route from '@arcgis/core/rest/route'
import FeatureSet from '@arcgis/core/rest/support/FeatureSet'
import Graphic from '@arcgis/core/Graphic'
import RouteParameters from '@arcgis/core/rest/support/RouteParameters'

const GEOPROCESSOR_URL = 'https://logistics.arcgis.com/arcgis/rest/services/World/OriginDestinationCostMatrix/GPServer/GenerateOriginDestinationCostMatrix'
const ROUTE_URL = 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World'

// is starting at 1KM a good assumption?
const STARTING_STREET_DISTANCE = 1 // km
const MAX_SEARCH_DISTANCE = 8 // km
const MAX_ROUTABLE_STOPS = 150
const DEFAULT_OUT_FIELDS = [
  'objectId',
  'OBJECTID',
  'Status',
  'adresse',
  'bruksenhetsnr',
  'bruksenhetid'
]
const TRAVEL_MODE_NAME = 'Walking Time'
const STATUS_QUERY_FRAGMENT = "(Status IS NULL OR Status = 'Available')"

export default class RouteCreator {
  constructor (
    webMap,
    searchResult,
    apiKey,
    debugMode = false,
    tracker = null
  ) {
    this.webMap = webMap
    this.searchResult = searchResult
    this.apiKey = apiKey
    this.debugMode = debugMode
    this.tracker = tracker || window?.ahoy
    this.desiredStopCount = webMap.stopCount

    this.resultFeature = searchResult.result.feature
  }

  async createRoute () {
    if (this.debugMode) {
      console.debug('starting-route-creation')
    }

    this.webMap.setOrigin(
      this.resultFeature
    )

    // used for routing, but should we instead take a destination from
    // the odmatrix results?
    this.origins = new FeatureSet({ features: [this.resultFeature] })

    const streetName = this.#getStreetNameFromResults()

    // first look on the given street
    let candidateDestinations = await this.#getDestinationsOnStreet(
      streetName
    )

    if (candidateDestinations.length < this.desiredStopCount) {
      candidateDestinations = await this.#getClosestDestinations(
        candidateDestinations
      )
    }

    // we can't build a route
    if (candidateDestinations.length < 2) {
      this.#broadcastEvent('noResidences', {
        streetName
      })

      return false
    }

    if (candidateDestinations.length > MAX_ROUTABLE_STOPS) {
      if (this.debugMode) {
        console.debug('trimming-candidate-list')
      }

      // needs to be done after sorting
      candidateDestinations = candidateDestinations.slice(
        0,
        MAX_ROUTABLE_STOPS
      )
    }

    const destinations = new FeatureSet({
      features: candidateDestinations
    })

    const odData = await this.#solveODMatrix(destinations)

    // we can't build a route
    if (odData === null || odData.features.length < 2) {
      this.#broadcastEvent('noResidences', {
        streetName
      })

      return false
    }

    // not sure why this is necessary, maybe to set the layer on the features?
    const selectedDestinations = await this.#getSelectedDestinations(
      odData.features
    )

    // we can't build a route
    if (selectedDestinations.features.length < 2) {
      if (this.debugMode) {
        console.debug('insufficient-selected-destinations', {
          featureCount: selectedDestinations.features.length
        })
      }

      this.#broadcastEvent('noResidences', {
        streetName
      })

      return false
    }

    this.webMap.reservedDestinations = selectedDestinations.features

    this.#routeStops(selectedDestinations.features)
  }

  async #getDestinationsOnStreet (
    streetName,
    distance = STARTING_STREET_DISTANCE,
    previousFeatureCount = null
  ) {
    if (this.debugMode) {
      console.debug('getting-destinations-on-street', {
        streetName,
        distance,
        previousFeatureCount
      })
    }

    // this is a fuzzy search on `adresse`, not `adressenavn`
    // not sure what is better
    const where = `${STATUS_QUERY_FRAGMENT} AND UPPER(adresse) LIKE '%${streetName.toUpperCase()}%'`

    const queryResult = await this.#queryDestinationLayer(where, distance)
    const featureCount = queryResult.features.length

    if (this.debugMode) {
      console.debug('address-query-complete', { featureCount })
    }

    this.#trackEvent('d2d.address-matches-found', { featureCount })

    // check if we had a previous query, and if so got the same count
    // as last time
    if (previousFeatureCount !== null &&
      previousFeatureCount === featureCount) {
      if (this.debugMode) {
        console.debug('stopping-expansion-same-count-as-before')
      }

      this.#trackEvent('d2d.stopping-expansion', {
        previousFeatureCount,
        featureCount
      })

      // we're done
      return queryResult.features
    }

    // handle the case where we have a decent-sized list
    if (featureCount >= this.desiredStopCount) {
      this.#trackEvent('d2d.hit-feature-count', {
        featureCount
      })

      // we're done
      return queryResult.features
    }

    // handle the case where we shouldn't expand
    if (distance * 2 > MAX_SEARCH_DISTANCE) {
      this.#trackEvent('d2d.new-search-would-exceed-max-distance', {
        newDistance: distance * 2,
        featureCount
      })

      // we're done
      return queryResult.features
    }

    // if we get here, expand the search
    if (this.debugMode) {
      console.debug('expanding-search', { newDistance: distance * 2 })
    }

    this.#trackEvent(
      'd2d.expanding-street-search',
      { newDistance: distance * 2 }
    )

    return await this.#getDestinationsOnStreet(
      streetName,
      distance * 2,
      featureCount
    )
  }

  async #getClosestDestinations (
    streetDestinations,
    // should this be different for closest?
    distance = STARTING_STREET_DISTANCE,
    previousFeatureCount = null
  ) {
    const streetObjectIds = streetDestinations.map(f => {
      return f.attributes.OBJECTID
    })

    const streetDestinationCount = streetDestinations.length

    if (this.debugMode) {
      console.debug('getting-closest-destinations', {
        streetDestinationCount,
        distance,
        previousFeatureCount
      })
    }

    const where = `${STATUS_QUERY_FRAGMENT} AND OBJECTID NOT IN (${streetObjectIds.toString()})`

    const queryResult = await this.#queryDestinationLayer(where, distance)
    const featureCount = queryResult.features.length
    const totalCount = streetDestinationCount + featureCount

    // check if we had a previous query, and if so got the same count
    // as last time
    if (previousFeatureCount !== null &&
      previousFeatureCount === featureCount) {
      if (this.debugMode) {
        console.debug('stopping-expansion-same-count-as-before')
      }

      this.#trackEvent('d2d.stopping-expansion', {
        previousFeatureCount,
        featureCount
      })

      // we're done
      return [...streetDestinations, ...queryResult.features]
    }

    // handle the case where we have a decent-sized list
    if (totalCount >= this.desiredStopCount) {
      this.#trackEvent('d2d.hit-feature-count', {
        totalCount
      })

      // we're done
      return [...streetDestinations, ...queryResult.features]
    }

    // handle the case where we shouldn't expand
    if (distance * 2 > MAX_SEARCH_DISTANCE) {
      this.#trackEvent('d2d.new-search-would-exceed-max-distance', {
        newDistance: distance * 2,
        totalFeatureCount: totalCount
      })

      // we're done
      return [...streetDestinations, ...queryResult.features]
    }

    // if we get here, expand the search
    if (this.debugMode) {
      console.debug('expanding-search', { newDistance: distance * 2 })
    }

    this.#trackEvent(
      'd2d.expanding-closest-search',
      { newDistance: distance * 2 }
    )

    return await this.#getClosestDestinations(
      streetDestinations,
      distance * 2,
      featureCount
    )
  }

  async #queryDestinationLayer (where, distance = null) {
    if (this.debugMode) {
      console.debug('querying-destination-layer', { where, distance })
    }

    const layer = this.webMap.destinationLayerView.layer

    const query = layer.createQuery()
    query.geometry = this.resultFeature.geometry
    query.where = where
    query.outFields = DEFAULT_OUT_FIELDS
    query.orderByDistance = {
      geometry: this.resultFeature.geometry,
      direction: 'ASC'
    }

    if (distance !== null) {
      query.distance = distance
      query.units = 'kilometers'
    }

    return layer.queryFeatures(query)
  }

  async #solveODMatrix (destinations) {
    const params = {
      origins: JSON.stringify(this.origins),
      destinations: JSON.stringify(destinations),
      // should this be the destination length instead?
      number_of_destinations_to_find: this.desiredStopCount,
      // are there other options for this? Like a loop starting
      // and ending at the origin?
      origin_destination_line_shape: 'Straight Line',
      outSR: { wkid: 25833 },
      apiKey: this.apiKey
    }

    // if (this.debugMode) {
    //   console.debug('od-matrix-params', params.destinations)
    //   return
    // }

    try {
      const jobInfo = await geoprocessor.submitJob(GEOPROCESSOR_URL, params)

      const options = {
        statusCallback: (jobInfo) => {
          if (this.debugMode) {
            console.debug('od-matrix-job-status', {
              status: jobInfo.jobStatus
            })
          }
        }
      }

      const result = await jobInfo.waitForJobCompletion(options)

      const data = await result.fetchResultData(
        'output_origin_destination_lines'
      )

      if (this.debugMode) {
        console.debug('od-matrix-solved', {
          featureCount: data.value.features.length
        })
      }

      this.#trackEvent('d2d.od-matrix-solved', {
        featureCount: data.value.features.length
      })

      return data.value
    } catch (error) {
      if (this.debugMode) {
        console.debug('failed-to-solve-the-od-matrix', { error })
      }

      this.#trackEvent(
        'd2d.od-matrix-failed',
        { error }
      )

      throw error
    }
  }

  async #routeStops (features) {
    // this seems like a bit of a hack to add address information to the
    // stop list? Is there any other way we can do this other than
    // adding a json-encoded attribute?
    features = features.map(f => {
      const name = {
        adresse: f.attributes.adresse,
        bruksenhet: f.attributes.bruksenhetsnr
      }

      return new Graphic({
        geometry: f.geometry,
        attributes: { Name: JSON.stringify(name) }
      })
    })

    if (this.debugMode) {
      console.debug('generating-route-for-features', {
        featureCount: features.length
      })
    }

    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features
      }),
      returnStops: true,
      returnDirections: false,
      travelMode: await this.#getTravelMode(),
      findBestSequence: true
    })

    route.solve(ROUTE_URL, routeParams)
      .then((data) => {
        if (data.routeResults.length > 0) {
          const routeResult = data.routeResults[0]

          if (window.debugMode) {
            console.debug('route-solved', {
              stopCount: routeResult.stops.length
            })
          }

          this.#trackEvent('d2d.route-solved', {
            origin: this.resultFeature,
            route: routeResult.route
          })

          this.#broadcastEvent('routeSolved', {
            origin: this.resultFeature,
            route: routeResult.route,
            stops: routeResult.stops
          })

          return true
        } else {
          if (window.debugMode) {
            console.debug('no-route-results')
          }

          this.#trackEvent('d2d.no-route-results', {
            origin: this.resultFeature
          })

          this.#broadcastEvent('noRouteResults', {
            origin: this.resultFeature
          })

          return false
        }
      })
      .catch((error) => {
        this.#trackEvent('d2d.route-error', {
          messages: error.details.messages
        })

        this.#broadcastEvent('routingError', {
          messages: error.details.messages
        })

        if (window.debugMode) {
          console.debug('routing-error', error)
        }

        return false
      })
  }

  // It seems like doing the query in this method could change the ordering
  // returned by the OD Matrix?
  //
  // In addition, for some queries we see a large change
  // in originalCount vs postQueryCount - i.e. we drop features/destinations here
  async #getSelectedDestinations (features) {
    const originalCount = features.length
    const destinationLayerView = this.webMap.destinationLayerView
    const destinationIds = features.map(f => f.attributes.DestinationOID)

    if (this.debugMode) {
      console.debug({ destinationIDs: destinationIds })
    }

    const query = destinationLayerView.layer.createQuery()
    query.where = `OBJECTID in (${destinationIds.toString()})`
    query.outFields = DEFAULT_OUT_FIELDS

    const result = await destinationLayerView.layer.queryFeatures(query)
    const postQueryCount = result.features.length

    if (this.debugMode) {
      console.debug('got-selected-destinations', {
        originalCount,
        postQueryCount,
        result
      })
    }

    return result
  }

  #getStreetNameFromResults () {
    let streetName = null

    const parsedStreetName = this.#extractStreetNameForResult(
      this.searchResult.result.name
    )

    streetName = this.searchResult.result.feature.attributes.StName

    if (this.debugMode) {
      console.debug({
        resultText: this.searchResult.result.name,
        streetName,
        parsedStreetName
      })
    }

    if (!streetName && parsedStreetName) {
      if (this.debugMode) {
        console.debug('using-parsed-street-name-instead-of-street-name')
      }
      streetName = parsedStreetName
    }

    if (streetName) {
      // Replace single quotes with double single quotes to escape them
      streetName = streetName.replace(/'/g, "''")
    }

    return (streetName)
  }

  #extractStreetNameForResult (textResult) {
    let parts = textResult.split(',')

    if (parts.length === 0) {
      return null
    }

    parts = parts[0].split(' ')

    if (parts.length === 0) {
      return null
    }

    if (parts.length === 1) {
      return parts[0].trim()
    }

    return parts.slice(0, -1).join(' ').trim()
  }

  async #getTravelMode () {
    const serviceDescription = await networkService.fetchServiceDescription(
      ROUTE_URL,
      this.apiKey
    )
    const { supportedTravelModes } = serviceDescription
    return supportedTravelModes.find((mode) => mode.name === TRAVEL_MODE_NAME)
  }

  #trackEvent (name, properties) {
    if (this.tracker === null) {
      return
    }

    this.tracker.track(name, properties)
  }

  #broadcastEvent (name, details) {
    window.dispatchEvent(new CustomEvent(name, {
      detail: details
    }))
  }
}