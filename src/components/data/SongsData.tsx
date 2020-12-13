import { apiCall } from "helpers"

// Handles cached loading of all or subsets of song data
class SongsData {
  PLAYLIST_LIMIT = 50
  SEARCH_LIMIT = 20

  userId: string
  private accessToken: string
  private onSongsLoadingStarted?: () => void
  private onSongsLoadingDone?: () => void
  private data: any[]
  private dataInitialized = false

  constructor(accessToken: string, userId: string, onSongsLoadingStarted?: () => void, onSongsLoadingDone?: () => void) {
    this.accessToken = accessToken
    this.userId = userId
    this.onSongsLoadingStarted = onSongsLoadingStarted
    this.onSongsLoadingDone = onSongsLoadingDone
    this.data = []
  }

  async total() {
    if (!this.dataInitialized) {
      await this.loadSlice()
    }

    return this.data.length
  }

  async slice(start: number, end: number) {
    return await this.loadSlice(start, end)
  }

  async all() {
    await this.loadAll()

    return this.data
  }

  async search(query: string) {
    await this.loadAll()

    // Case-insensitive search in song name
    // TODO: Add lazy evaluation for performance?
    return this.data
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, this.SEARCH_LIMIT)
  }

  async loadAll() {
    if (this.onSongsLoadingStarted) {
      this.onSongsLoadingStarted()
    }

    await this.loadSlice()

    // Get the rest of them if necessary
    for (var offset = this.PLAYLIST_LIMIT; offset < this.data.length; offset = offset + this.PLAYLIST_LIMIT) {
      await this.loadSlice(offset, offset + this.PLAYLIST_LIMIT)
    }

    if (this.onSongsLoadingDone) {
      this.onSongsLoadingDone()
    }
  }

  private async loadSlice(start = 0, end = start + this.PLAYLIST_LIMIT) {
    if (this.dataInitialized) {
      const loadedData = this.data.slice(start, end)

      if (loadedData.filter(i => !i).length === 0) {
        return loadedData
      }
    }

    const songsUrl = `https://api.spotify.com/v1/users/${this.userId}/songs?offset=${start}&limit=${end-start}`
    const songsResponse = await apiCall(songsUrl, this.accessToken)
    const songsData = songsResponse.data

    if (!this.dataInitialized) {
      this.data = Array(songsData.total).fill(null)
      this.dataInitialized = true
    }

    this.data.splice(start, songsData.items.length, ...songsData.items)

    return songsData.items
  }
}

export default SongsData
