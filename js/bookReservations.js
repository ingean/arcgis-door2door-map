
import { removeResults } from "./Routing.js"
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
  setBookingStatus()
}

export const clearReservations = () => {
  reservedDestinations = null

  setBookingStatus(false) // Disable booking buttons
  removeResults() // Remove results from sidebar
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

  console.log(`Start booking ${editFeatures.length} units...`)
  destinationLayer.applyEdits(edits)
  .then(results => {
    console.log('Booking succeeded')
  })
  .catch(error => console.error(`Editing failed with error: ${error}`))
}

const setBookingStatus = (status = false) => {
  let btns = document.querySelectorAll('.booking-btn')
  btns.forEach(btn => btn.disabled = status)
}