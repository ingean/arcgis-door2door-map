
export const toggleProgessBar = () => {
  let pb = document.getElementById("progress")
  pb.hidden = !pb.hidden
}

export const formatTime = (mins) => {
  if (mins < 60) return `${Math.round(mins)} min`
  const hrs = Math.floor(mins/60)
  const m = mins % 60
  
  return `${hrs} t ${Math.round(m)} m`
}

export const formatDistance = (kms) => {
  return (kms >= 1000) ? `${Math.round(kms * 10) / 10} km` : `${Math.round(kms * 1000)} m`
}