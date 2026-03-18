
import { removeResults } from "./Routing.js"
import { resetMap } from "./main.js"

let destinationLayer = null
let reservedDestinations = null

export const setDestinationLayer = (layer) => {
  destinationLayer = layer
  
  let bookBtn = document.getElementById("book-reservations-btn")
  bookBtn.addEventListener('click',() => bookReservations('ReservationConfirmed'))

  let clearBookingBtn = document.getElementById("clear-reservations-btn")
  clearBookingBtn.addEventListener('click', clearReservations)
}

export const setReservedDestinations = (features) => {
  reservedDestinations = features
  setBookingStatus()
}

export const clearReservations = () => {
  setBookingStatus(false) // Disable booking buttons
  removeResults() // Remove results from sidebar
  resetMap() // Remove results from map
  if (reservedDestinations) bookReservations('Available')
  reservedDestinations = null
}

export const bookReservations = (status) => {
  const uuid = self.crypto.randomUUID()

  const editFeatures = reservedDestinations.map(f => {
    f.attributes.Status = status
    f.attributes['LastUpdatedAt'] = Date.now()
    f.attributes['BookingID'] = uuid
    return f
  })

  const edits = {
    updateFeatures: editFeatures
  }

  console.log(`Setting status of ${editFeatures.length} units to: ${status}...`)
  destinationLayer.applyEdits(edits)
  .then(results => {
    console.log('Status update succeeded')
  })
  .catch(error => console.error(`Status update failed with error: ${error}`))
}

const setBookingStatus = (status = false) => {
  let btns = document.querySelectorAll('.booking-btn')
  btns.forEach(btn => btn.disabled = status)
}