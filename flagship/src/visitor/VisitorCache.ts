export const CLIENT_CACHE_KEY = 'FS_CLIENT_VISITOR'

export type VisitorProfil={
    visitorId:string,
    anonymousId: string|null
}

export const cacheVisitor = {
  saveVisitorProfile (visitorProfile:VisitorProfil):void {
    try {
      localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(visitorProfile))
    } catch (error) {

    }
  },

  loadVisitorProfile ():VisitorProfil|null {
    let data = null
    try {
      data = localStorage.getItem(CLIENT_CACHE_KEY)
    } catch (error) {
    }
    return data ? JSON.parse(data) : null
  }
}
