import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { getSpotifyAccessToken, getSpotifyPlaylistFull, getSpotifyIdFromUrl, StrippedTrack } from './helpers'
import { SpotifyApi } from '@spotify/web-api-ts-sdk'

dotenv.config({ path: 'secrets/.env' })

const CLIENT_ID = process.env.CLIENT_ID || ''
const CLIENT_SECRET = process.env.CLIENT_SECRET || ''


//just a test
// async function main() {
//   const [playlist1Url] = process.argv.slice(2)
//   if (!playlist1Url) {
//     console.error('Usage: node dist/index.js <playlist_url_1>')
//     process.exit(1)
//   }

//   const sdk = SpotifyApi.withClientCredentials(CLIENT_ID, CLIENT_SECRET);

//   const playlist = await getSpotifyPlaylistFull(playlist1Url, sdk)
//   // console.log(playlist)
// }


async function main2() {
  const [playlist1Url, playlist2Url] = process.argv.slice(2)
  if (!playlist1Url || !playlist2Url) {
    console.error('Usage: node dist/index.js <playlist_url_1> <playlist_url_2>')
    process.exit(1)
  }

  const sdk = SpotifyApi.withClientCredentials(CLIENT_ID, CLIENT_SECRET);


  const id1 = getSpotifyIdFromUrl(playlist1Url)
  const id2 = getSpotifyIdFromUrl(playlist2Url)

  // Prepare outputs directory
  const outDir = path.resolve(process.cwd(), 'results')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const writeJson = (file: string, data: any) => {
    fs.writeFileSync(path.join(outDir, file), JSON.stringify(data, null, 2), 'utf-8')
  }

  const readJsonIfExists = (file: string): any | undefined => {
    const fullPath = path.join(outDir, file)
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf-8')
      try {
        return JSON.parse(raw)
      } catch {
        return undefined
      }
    }
    return undefined
  }

  const loadPlaylist = async (id: string, url: string): Promise<StrippedTrack[]> => {
    const cacheFile = `${id}.json`
    const cached = readJsonIfExists(cacheFile) as StrippedTrack[] | undefined
    if (cached && Array.isArray(cached)) {
      console.log(`Loaded cached playlist from ${cacheFile}`)
      return cached
    }
    const fresh = await getSpotifyPlaylistFull(url, sdk)
    writeJson(cacheFile, fresh)
    console.log(`Wrote fresh playlist to ${cacheFile}`)
    return fresh
  }

  const [playlist1, playlist2] = await Promise.all([
    loadPlaylist(id1, playlist1Url),
    loadPlaylist(id2, playlist2Url)
  ])

  // Build unique track maps keyed by normalized "name|artist"
  const playlist1Tracks = (playlist1 || [])
    .filter((t): t is StrippedTrack => !!t && !!t.name && !!t.artist && t.artist.length > 0)
  const playlist2Tracks = (playlist2 || [])
    .filter((t): t is StrippedTrack => !!t && !!t.name && !!t.artist && t.artist.length > 0)

  const makeKey = (t: StrippedTrack) => `${t.name.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}`

  const toKeyedMap = (tracks: StrippedTrack[]) => {
    const m = new Map<string, StrippedTrack>()
    for (const t of tracks) {
      const key = makeKey(t)
      if (!m.has(key)) m.set(key, t)
    }
    return m
  }

  const map1 = toKeyedMap(playlist1Tracks)
  const map2 = toKeyedMap(playlist2Tracks)

  const unique1 = new Set<string>([...map1.keys()])
  const unique2 = new Set<string>([...map2.keys()])

  const intersectionKeys = new Set([...unique1].filter(t => unique2.has(t)))

  // Write only the intersection file, suffixed with the two playlist ids
  writeJson(
    `intersection_${id1}_${id2}.json`,
    Array.from(intersectionKeys)
      .map(k => map1.get(k) || map2.get(k))
      .filter((t): t is StrippedTrack => !!t)
  )

  console.log(`Wrote results/intersection_${id1}_${id2}.json. Cached playlists at results/${id1}.json and results/${id2}.json`)
}

main2()
