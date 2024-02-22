import { element, div } from "../utils/html.js"

export default class Alert {
  constructor(params) {
    this.title = params.title
    this.message = params.message
    this.containerId = params?.containerId || 'alert-container'
    this.container = document.getElementById(this.containerId)
    this.alert = element('calcite-alert', {
      kind: params?.kind || 'info',
      icon: params?.icon || 'information',
      placement: params?.placement || 'bottom-end',
      active: true
    }, 
    [
      div({slot: 'title'}, params.title),
      div({slot: 'message'}, params.message)
    ])
    this.container.appendChild(this.alert)
    this.alert.autoClose = params?.dissmiss || true,
    this.alert.open = true

    this.alert.addEventListener('calciteAlertClose', e => this.container.innerHTML = '')
  }
}

export class ErrorAlert extends Alert {
  constructor(params) {
    params.kind = 'danger'
    params.icon = params?.icon || 'exclamation-mark-circle'
    super(params)
  }
}

export class WarningAlert extends Alert {
  constructor(params) {
    params.kind = 'warning'
    params.icon = params?.icon || 'exclamation-mark-triangle'
    super(params)
  }
}

export class InfoAlert extends Alert {
  constructor(params) {
    params.kind = 'info'
    params.icon = params?.icon || 'information'
    super(params)
  }
}

export class ConfirmationAlert extends Alert {
  constructor(params) {
    params.kind = 'success'
    params.icon = params?.icon || 'check-circle'
    super(params)
  }
}