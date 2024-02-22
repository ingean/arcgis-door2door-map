
export const toggleProgessBar = (id) => {
  id = id || 'progress'
  let pb = document.getElementById(id)
  pb.hidden = !pb.hidden
}