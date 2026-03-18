import { element } from '../utils/html.js'
import * as format from '../utils/format.js'

export const featuresToAddressList = (features) => { 
  features = features.sort((a, b) => a.attributes.Sequence - b.attributes.Sequence)
  let list = document.getElementById('result-list')
  list.innerHTML = ''
  features.forEach(s => list.appendChild(addressListItem(s)))
}

const addressListItem = (feature, grouped = false) => {
  let sequenceNr = feature.attributes.Sequence
  let fromPrevTime = feature.attributes.FromPrevTravelTime
  let fromPrevDistance = feature.attributes.FromPrevDistance
  //let stop = JSON.parse(feature.attributes.Name)
  let label = grouped ? stop.bruksenhet : feature.attributes.Name
  
  let action = element('calcite-action', 
    {
      slot: 'actions-end',
      icon: `layer-zoom-to`
    }
  )
  //action.addEventListener('click', zoomToFeature(feature.geometry))
  return element('calcite-list-item', 
    {
      label,
      description: `Stopp ${sequenceNr} på ruten (${format.time(fromPrevTime)} ${format.distance(fromPrevDistance)})`
    }, 
    action
  )
}

/* const addressListGroup = (name) => {
  return element('calcite-list-item-group', {heading: name})
}

const addGroupedAddressList = (stops) => {
  let list = document.getElementById('result-list')
  list.innerHTML = ''

  let groupedStops = Object.groupBy(stops, stop => {
    let name = JSON.parse(stop.attributes.Name)
    return name.adresse
  })

  for(let groupName in groupedStops) {
    let groupStops = groupedStops[groupName]
    if (groupStops.length > 1) {
      let group = addressListGroup(groupName)
      groupStops.forEach(s => group.appendChild(addressListItem(s, true)))
      list.appendChild(group)
    } else {
      list.appendChild(addressListItem(groupStops[0]))
    }
  }
} */