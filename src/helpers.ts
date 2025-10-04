import { PlaylistedTrack, SpotifyApi, Track } from '@spotify/web-api-ts-sdk'
export type StrippedTrack = {
	name: string
	artist: string
}

// http://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
// the id is the part after the /track/, so 6rqhFgbbKwnb9MLmUQDhG6
export function getSpotifyIdFromUrl(url: string) {
	// Extract the last path segment and strip any query string
	try {
		const u = new URL(url)
		const segments = u.pathname.split('/').filter(Boolean)
		const last = segments.pop() || ''
		return last.split('?')[0]
	} catch {
		const last = (url.split('/').pop() || '')
		return last.split('?')[0]
	}
}

// obsolete
export async function getSpotifyAccessToken(clientId: string, clientSecret: string) {
  const tokenUrl = 'https://accounts.spotify.com/api/token'
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
 
  const body = new URLSearchParams()
  body.set('grant_type', 'client_credentials')
 
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
 
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to obtain access token: ${response.status} ${errorText}`)
  }
 
  const json = await response.json() as {
    access_token: string
    token_type: 'Bearer'
    expires_in: number
  }
 
  return json.access_token
}

export function toStripped (tracks: Track[]): StrippedTrack[] {
	return tracks.map(t => ({
		// id: t.id as string,
		name: t.name,
		artist: t.artists?.[0]?.name || ''
	}))
}

export async function getAllPages(sdk: SpotifyApi, playlistId: string) {
	const pageSize = 20
	const allPages: PlaylistedTrack<Track>[] = []
	let page = await sdk.playlists.getPlaylistItems(playlistId, undefined, "total,limit,offset,items(track(name,artists(name)))", pageSize, 0)
	allPages.push(...page.items)
	let currCount = page.items.length
	while (currCount < page.total) {
		console.log(`Progress: ${currCount} / ${page.total} (${Math.round(currCount / page.total * 100)}%)`)
		const nextPage = await sdk.playlists.getPlaylistItems(
			playlistId, 
			undefined, 
			"total,limit,offset,items(track(name,artists(name)))",
			 pageSize, 
			 currCount
			)
		allPages.push(...nextPage.items)
		page = nextPage
		currCount += nextPage.items.length
	}
	return allPages
}

export async function getSpotifyPlaylistFull(playListUrl: string, sdk: SpotifyApi) {
  const playlistId = getSpotifyIdFromUrl(playListUrl)
  if (!playlistId) {
    throw new Error('Invalid playlist URL')
  }

	console.log(`Getting playlist ${playlistId}`)

	// const playlist = await sdk.playlists.getPlaylistItems(
	// 	playlistId, 
	// 	undefined, 
	// 	"items(track(name,artists(name)))"
	// )
	// const stripped = toStripped(playlist.items.map(item => item.track))
	//get all pages
	const allPages = await getAllPages(sdk, playlistId)
	const stripped = toStripped(allPages.map(item => item.track))
	
	console.log(stripped)
	console.log(stripped.length)
	
  return stripped
}