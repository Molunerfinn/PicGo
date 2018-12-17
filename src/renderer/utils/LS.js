class LS {
  get (name) {
    if (localStorage.getItem(name)) {
      return JSON.parse(localStorage.getItem(name))
    } else {
      return {}
    }
  }

  set (name, value) {
    return localStorage.setItem(name, JSON.stringify(value))
  }
}

export default new LS()
