class Router {
  private router = new Map<string, routeHandler>()

  get (url: string, callback: routeHandler): void {
    this.router.set(url, callback)
  }

  post (url: string, callback: routeHandler): void {
    this.router.set(url, callback)
  }

  getHandler (url: string) {
    if (this.router.has(url)) {
      return this.router.get(url)
    } else {
      return null
    }
  }
}

export default new Router()
