function appendChildren(el, children) {
  if (typeof children === 'string' || typeof children === 'number') {
    el.appendChild(document.createTextNode(children));
  } else if (children instanceof Array) {
        for (let child of children) {
          if (typeof child === 'string' || typeof child === 'number') {
              el.appendChild(document.createTextNode(child));
          } else if (child instanceof Node){
              el.appendChild(child);
          }
      }
  } else if (children instanceof Node){
      el.appendChild(children)
  }
  return el;
} 

export function element(tagName, attributes, children) {
  let el = document.createElement(tagName || 'div');
    
  if (attributes) {
    if (typeof attributes === 'string') {
      el.setAttribute('class', attributes)
    } else {
      for (let name in attributes) {
        el.setAttribute(name, attributes[name]);
      }
    }    
  }
  if (!children) return el;
  return appendChildren(el, children)
}

export const div = (attributes, children) => {
  return element('div', attributes, children)
}