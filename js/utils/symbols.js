export const textSymbol = () => {
  return {
    type: "text",
    color: "white",
    font: {
      family: "Playfair Display",
      size: 10,
      weight: "bold"
    }
  }
}

export const labelClass = (labelField, placement = 'center-center') => {
  let symbol = textSymbol()
  return {
    symbol,
    labelPlacement: placement,
    labelExpressionInfo: {
      expression: `Round($feature.${labelField},2)`
    }
  }
}

export const routeLineSymbol = () => {
  return {
    type: "simple-line", 
    color: [233, 104, 32],
    width: 4
  }
}

export const odLineSymbol = () => {
  return {
    type: "simple-line", 
    color: [0, 255, 0],
    width: 4
  }
}

export const candidatePointSymbol = () => {
  return {
    type: "simple-marker", 
    color: [0, 0, 255, 64],
    style: "circle",
    size: 22,
    outline: { 
      color: [ 0, 0, 139 ],
      width: 1
    }
  }
}
export const odInPointSymbol = () => {
  return {
    type: "simple-marker", 
    color: [0, 255, 0, 64],
    style: "circle",
    size: 18,
    outline: { 
      color: [ 0, 164, 0 ],
      width: 1
    }
  }
}

export const odPointSymbol = () => {
  return {
    type: "simple-marker", 
    color: [0, 255, 0, 64],
    style: "circle",
    size: 14,
    outline: { 
      color: [ 0, 139, 0 ],
      width: 1
    }
  }
}

export const routePointSymbol = () => {
  return {
    type: "simple-marker", 
    color: [233, 104, 32],
    style: "circle",
    size: 12,
    outline: { 
      color: [ 255, 255, 255 ],
      width: 1
    }
  }
}