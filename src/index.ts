import SpotifyWebApi from 'spotify-web-api-node';
import BeastSaberClient from './util/beastsaber';
import BeatSaverClient from './util/beatsaver';
import fs from 'fs';
import download from 'download';
import { Track } from './types';

// TODO: add inquirer and ask if they want to use their own playlist or a link or saved tracks or recently played tracks or top tracks
// TODO: error handling
// TODO: add BeatSaver as alternative source
// TODO: add option to download map with best rating / given difficulty
// TODO: download progress
// TODO: add dependabot, eslint and ci workflow

// create output folder
if (!(await fs.existsSync('output'))) {
  await fs.mkdirSync('output');
}

// register Spotify
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN, // TODO: auth flow
});

// register BeastSaber
const beastSaberClient = await BeastSaberClient.init();
// register BeatSaver
const beatSaverClient = await BeatSaverClient.init();

// fetch user's playlists
const me = await spotifyApi.getMe();

const playlists = await spotifyApi.getUserPlaylists(me.body.id);
console.log(playlists.body.items);
const playlist = playlists.body.items.find(playlist => playlist.name === 'test')!; // TODO: selection

const playlistTracks = await spotifyApi.getPlaylistTracks(playlist.id);

const tracks: Track[] = playlistTracks.body.items.map(({ track }) => ({
  name: track.name,
  artist: track.artists[0].name,
  id: track.id,
  search: `${track.name} ${track.artists[0].name}`,
}));

console.log(`now searching playlist ${playlist.name} for ${tracks.length} tracks`);

// get BeastSaber maps from tracks
const mapResults = await Promise.all(tracks.map(track => beastSaberClient.search(track)));

const foundMaps = mapResults.filter(({ maps }) => maps.length > 0);
const notFoundMaps = mapResults.filter(({ maps }) => maps.length === 0);

// print found maps
for (const { track, maps } of foundMaps) {
  console.log(`Found ${track.name} by ${track.artist} on BeastSaber: ${maps[0].title}`);
}
// print not found maps
for (const { track } of notFoundMaps) {
  console.log(`Could not find ${track.name} by ${track.artist} on BeastSaber`);
  // TODO: fallback to BeatSaver
}

// download all maps
console.log(`now downloading ${foundMaps.length} maps`);
await Promise.all(foundMaps.map(({ maps }) => download(maps[0].downloadUrl, 'output')));

// cleanup
await beastSaberClient.destroy();
await beatSaverClient.destroy();
