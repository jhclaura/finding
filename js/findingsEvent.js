export default class FindingsEvent {
  constructor() {
    //
  }

  hasEvent(eventName) {
    return this.hasOwnProperty(eventName)
  }

  fire(eventName, eventData) {
    this[eventName](eventData)
  }
}
