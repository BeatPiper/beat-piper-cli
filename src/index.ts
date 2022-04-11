import SpotifyClient from './util/spotify';
import BeatSaverClient from './util/beatsaver.js';
import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import download from 'download';
import { Track } from './types';

// TODO: ask if they want to use their own playlist or a link or saved tracks or recently played tracks or top tracks
// TODO: error handling
// TODO: add BeastSaber as alternative source
// TODO: add option to download map with best rating / given difficulty
// TODO: download progress

console.log(chalk.underline.magenta('Welcome to Beat Piper!'));

// create output folder
if (!(await fs.existsSync('output'))) {
  await fs.mkdirSync('output');
}

// register Spotify
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.log(
    chalk.red(`Please set the Spotify environment variables (See ${chalk.italic('README.md')})`)
  );
  process.exit(0);
}
const spotifyClient = new SpotifyClient(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET);

// required Spotify API scopes to read playlists
const scopes = ['playlist-read-private', 'playlist-read-collaborative'];
// authorize Spotify user
try {
  const token = await spotifyClient.authorize(scopes);
  spotifyClient.setToken(token.access_token, token.refresh_token);
} catch (err) {
  console.log(chalk.red(`Failed to authorize: ${err}`));
  process.exit(0);
}

// register BeatSaver
const beatSaverClient = new BeatSaverClient();

// fetch user's playlists
const playlists = await spotifyClient.getPlaylists();
console.log(chalk.green(`Found ${chalk.bold(playlists.total)} playlists!`));

const answers = await inquirer.prompt<{
  playlist: string;
}>([
  {
    type: 'list',
    name: 'playlist',
    message: chalk.italic('Which playlist do you want to download'),
    choices: playlists.items.map(playlist => playlist.name),
    loop: false,
  },
]);
const playlist = playlists.items.find(playlist => playlist.name === answers.playlist)!;

const playlistTracks = await spotifyClient.getPlaylistTracks(playlist.id); // TODO: this is paginated with 100 tracks per page

const tracks: Track[] = playlistTracks.items.map(({ track }) => ({
  name: track.name,
  artist: track.artists[0].name,
  id: track.id,
  search: `${track.name} ${track.artists[0].name}`, // TODO: is this good as a search query?
}));

console.log(
  chalk.blue(
    `Now searching for maps for playlist ${chalk.bold(playlist.name)} (${chalk.bold(
      tracks.length
    )} tracks)…`
  )
);

// get BeatSaver maps from tracks
const mapResults = await beatSaverClient.searchInBatches(tracks);

const foundMaps = mapResults.filter(({ maps }) => maps.length > 0);
const notFoundMaps = mapResults.filter(({ maps }) => maps.length === 0);

// print found maps
if (foundMaps.length) {
  console.log(
    chalk.green(`Found ${chalk.bold(foundMaps.map(({ track }) => track.name).join(', '))} on BeatSaver`)
  );
}
// print not found maps
if (notFoundMaps.length) {
  console.log(
    chalk.red(
      `Could not find ${chalk.bold(notFoundMaps.map(({ track }) => track.name).join(', '))} on BeatSaver`
    )
  );
}

// download all maps
console.log(chalk.blue(`Now downloading ${chalk.bold(foundMaps.length)} maps…`));
await Promise.all(
  foundMaps.map(({ maps }) => download(BeatSaverClient.getLatestVersion(maps[0]).downloadURL, 'output'))
);
