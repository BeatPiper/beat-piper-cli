import SpotifyWebApi from 'spotify-web-api-node';
import BeatSaverClient from './util/beatsaver.js';
import fs from 'fs';
import inquirer from 'inquirer';
import download from 'download';
import { Track } from './types';

// TODO: ask if they want to use their own playlist or a link or saved tracks or recently played tracks or top tracks
// TODO: error handling
// TODO: add BeastSaber as alternative source
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

// register BeatSaver
const beatSaverClient = new BeatSaverClient();

// fetch user's playlists
const me = await spotifyApi.getMe();

const playlists = await spotifyApi.getUserPlaylists(me.body.id);
console.log(`Found ${playlists.body.total} playlists`);

const answers = await inquirer.prompt<{
  playlist: string;
}>([
  {
    type: 'list',
    name: 'playlist',
    message: 'Which playlist do you want to download?',
    choices: playlists.body.items.map(playlist => playlist.name),
  },
]);
const playlist = playlists.body.items.find(playlist => playlist.name === answers.playlist)!;

const playlistTracks = await spotifyApi.getPlaylistTracks(playlist.id); // TODO: this is paginated with 100 tracks per page

const tracks: Track[] = playlistTracks.body.items.map(({ track }) => ({
  name: track.name,
  artist: track.artists[0].name,
  id: track.id,
  search: `${track.name} ${track.artists[0].name}`, // TODO: is this good as a search query?
}));

console.log(`Now searching playlist ${playlist.name} for ${tracks.length} tracks`);

// get BeatSaver maps from tracks
const mapResults = await beatSaverClient.searchInBatches(tracks);

const foundMaps = mapResults.filter(({ maps }) => maps.length > 0);
const notFoundMaps = mapResults.filter(({ maps }) => maps.length === 0);

// print found maps
if (foundMaps.length) {
  console.log(`Found ${foundMaps.map(({ track }) => track.name).join(', ')} on BeatSaver`);
}
// print not found maps
if (notFoundMaps.length) {
  console.log(`Could not find ${notFoundMaps.map(({ track }) => track.name).join(', ')} on BeatSaver`);
}

// download all maps
console.log(`Now downloading ${foundMaps.length} maps`);
await Promise.all(
  foundMaps.map(({ maps }) => download(BeatSaverClient.getLatestVersion(maps[0]).downloadURL, 'output'))
);
