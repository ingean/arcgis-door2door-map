
import { removeRouteStats } from "./Routing.js"
import { resetMap } from "./main.js"

let destinationLayer = null
let reservedDestinations = null

export const setDestinationLayer = (layer) => {
  destinationLayer = layer
  
  let bookBtn = document.getElementById("book-reservations-btn")
  bookBtn.addEventListener('click', bookReservations)

  let clearBookingBtn = document.getElementById("clear-reservations-btn")
  clearBookingBtn.addEventListener('click', clearReservations)
}

export const setReservedDestinations = (features) => {
  reservedDestinations = features
  toggleBookingBtns()
}

export const clearReservations = () => {
  reservedDestinations = null

  toggleBookingBtns() // Disable booking buttons
  removeRouteStats() // Remove results from sidebar
  resetMap() // Remove results from map
}

export const bookReservations = () => {
  const uuid = self.crypto.randomUUID()

  const editFeatures = reservedDestinations.map(f => {
    f.attributes.Status = 'Booket'
    f.attributes['Sist_booket_datp'] = Date.now()
    f.attributes['BookingID'] = uuid
    return f
  })

  const edits = {
    updateFeatures: editFeatures
  }

  console.log(`Start booking ${features.length} units...`)
  destinationLayer.applyEdits(edits)
  .then(results => {
    console.log('Booking succeeded')
  })
  .catch(error => console.error(`Editing failed with error: ${error}`))
}

const toggleBookingBtns = () => {
  let bookBtn = document.getElementById("book-reservations-btn")
  let clearBookingBtn = document.getElementById("clear-reservations-btn")

  bookBtn.disabled = !bookBtn.disabled
  clearBookingBtn.disabled = !clearBookingBtn.disabled
}