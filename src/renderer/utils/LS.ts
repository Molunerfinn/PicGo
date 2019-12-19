class LS {
  get (name: string) {
    if (localStorage.getItem(name)) {
      return JSON.parse(localStorage.getItem(name) as string)
    } else {
      return {}
    }
  }

  set (name: string, value: any) {
    return localStorage.setItem(name, JSON.stringify(value))
  }
}

export default new LS()
