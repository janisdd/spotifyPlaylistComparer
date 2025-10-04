# Spotify Playlist Comparer

Compares two Spotify Playlists and outputs intersecting tracks

## Requirements

- node
- the playlists must be set to plublic

## Install & Usage

```bash
yarn install
yarn build
node dist/index.js <playlist url 1> <playlist url 2>
```

## Comparison

The comparison is done by comparing the track names and (first) artist names

## Caching

The playlists are cached in the `results` directory

## Results

The intersection is stored in `results` as `intersection_{playlist Id 1}_{playlist Id 2}.json`

