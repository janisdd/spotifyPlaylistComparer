# Spotify Playlist Comparer

Compares two Spotify Playlists and outputs intersecting tracks

## Requirements

- node
- the playlists must be set to plublic
- a spotify account and a spotify app, see https://developer.spotify.com/documentation/web-api/tutorials/getting-started

## Install & Usage

Copy the file  `secrets/.env_example` to  `secrets/.env`

Set the `CLIENT_ID` and `CLIENT_SECRET` in the file `secrets/.env`

```bash
yarn install
yarn build
node dist/index.js <playlist url 1> <playlist url 2>
# e.g.
# dist/index.js https://open.spotify.com/playlist/3CyMjQnIQ0GuzmC4AeTCam https://open.spotify.com/playlist/28zGBd9aSkHoQqyba2u3PO
```

## Comparison

The comparison is done by comparing the track names and (first) artist names

## Caching

The playlists are cached in the `results` directory

## Results

The intersection is stored in `results` as `intersection_{playlist Id 1}_{playlist Id 2}.json`

