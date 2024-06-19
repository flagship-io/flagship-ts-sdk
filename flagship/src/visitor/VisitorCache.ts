export const CLIENT_CACHE_KEY = 'FS_CLIENT_VISITOR'

export type VisitorProfile={
    visitorId:string,
    anonymousId: string|null
}

export const cacheVisitor = {
  saveVisitorProfile (visitorProfile:VisitorProfile):void {
    try {
      localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(visitorProfile))
    } catch (error) {

    }
  },

  loadVisitorProfile ():VisitorProfile|null {
    let data = null
    try {
      data = localStorage.getItem(CLIENT_CACHE_KEY)
    } catch (error) {
    }
    return data ? JSON.parse(data) : null
  }
}
