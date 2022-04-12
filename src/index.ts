import SpotifyClient, { getPlaylistUnauthenticated } from './util/spotify';
import BeatSaverClient from './util/beatsaver.js';
import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import download from 'download';
import { Track } from './types';

// register autocomplete prompt
inquirer.registerPrompt('autocomplete', AutocompletePrompt);

console.log(chalk.underline.magenta('Welcome to Beat Piper!'));

// create output folder
if (!(await fs.existsSync('output'))) {
  await fs.mkdirSync('output');
}

enum PlaylistRetrievalMethod {
  LOGIN = 'Login with Spotify',
  LINK = 'Use a link to a playlist (limited to 100 first songs)', // Link method uses embed which is always limited
}
const { type } = await inquirer.prompt<{
  type: PlaylistRetrievalMethod;
}>([
  {
    type: 'list',
    name: 'type',
    message: chalk.italic('Which method would you like to use to retrieve your playlist?'),
    choices: Object.values(PlaylistRetrievalMethod),
    loop: false,
  },
]);

let playlistName: string;
let playlistDescription: string;
let playlistImageUrl: string;
let tracks: Track[];

switch (type) {
  case PlaylistRetrievalMethod.LOGIN: {
    // register Spotify
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.log(
        chalk.red(`Please set the Spotify environment variables (See ${chalk.italic('README.md')})`)
      );
      process.exit(0);
    }
    const spotifyClient = new SpotifyClient(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET);

    try {
      if (spotifyClient.areCredentialsSaved()) {
        await spotifyClient.loadSavedCredentials();
      } else {
        await spotifyClient.authorize();
      }
    } catch (err) {
      console.log(chalk.red(`Failed to authorize: ${err}`));
      process.exit(0);
    }

    // fetch user's playlists
    const playlists = await spotifyClient.getAllPlaylists();
    console.log(chalk.green(`Found ${chalk.bold(playlists.total)} playlists!`));

    const answers = await inquirer.prompt<{
      playlist: string;
    }>([
      {
        type: 'autocomplete',
        name: 'playlist',
        message: chalk.italic('Which playlist do you want to download'),
        source: (answersSoFar: Array<never>, input?: string) => {
          return input
            ? playlists.items.filter(playlist =>
                playlist.name.toLowerCase().includes(input.toLowerCase())
              )
            : playlists.items;
        },
        loop: false,
      },
    ]);
    const playlist = playlists.items.find(playlist => playlist.name === answers.playlist)!;
    playlistName = playlist.name;
    playlistDescription = playlist.description || 'No description';
    playlistImageUrl = playlist.images.length ? playlist.images[0].url : '';

    const playlistTracks = await spotifyClient.getAllPlaylistTracks(playlist.id);

    tracks = playlistTracks.items.map(({ track }) => ({
      name: track.name,
      artist: track.artists[0].name,
      id: track.id,
      search: `${track.name} ${track.artists[0].name}`,
    }));

    break;
  }
  case PlaylistRetrievalMethod.LINK: {
    const { link } = await inquirer.prompt<{
      link: string;
    }>([
      {
        type: 'input',
        name: 'link',
        message: chalk.italic('Please enter the link to your playlist'),
        validate: (input: string) =>
          input.startsWith('https://open.spotify.com/playlist/')
            ? true
            : 'Please enter a valid Spotify playlist link',
      },
    ]);

    const playlist = await getPlaylistUnauthenticated(link);
    playlistName = playlist.preview.title;
    playlistDescription = playlist.preview.description || 'No description';
    playlistImageUrl = playlist.preview.image;

    tracks = playlist.tracks.map(track => ({
      name: track.name,
      artist: track.artists![0].name,
      id: track.id,
      search: `${track.name} ${track.artists![0].name}`,
    }));
    break;
  }
}

// register BeatSaver
const beatSaverClient = new BeatSaverClient();

console.log(
  chalk.blue(
    `Now searching for maps for playlist ${chalk.bold(playlistName)} (${chalk.bold(
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

enum SaveType {
  DOWNLOAD = 'Download all maps',
  BPLIST = 'Save a .bplist file',
}
const { saveType } = await inquirer.prompt<{
  saveType: SaveType;
}>([
  {
    type: 'list',
    name: 'saveType',
    message: chalk.italic('How would you like to export the maps?'),
    choices: Object.values(SaveType),
    loop: false,
  },
]);

switch (saveType) {
  case SaveType.DOWNLOAD: {
    // download all maps
    console.log(chalk.blue(`Now downloading ${chalk.bold(foundMaps.length)} maps…`));
    await Promise.all(
      foundMaps.map(({ maps }) =>
        download(BeatSaverClient.getLatestVersion(maps[0]).downloadURL, 'output')
      )
    );
    break;
  }
  case SaveType.BPLIST: {
    // save beat saber playlist
    console.log(chalk.blue(`Now saving Beat Saber playlist with ${chalk.bold(foundMaps.length)} maps…`));
    const beatSaberPlaylist = await beatSaverClient.createPlaylist(
      playlistName,
      playlistDescription,
      playlistImageUrl,
      foundMaps.map(({ maps }) => maps[0])
    );
    fs.writeFileSync(`output/${playlistName}.bplist`, JSON.stringify(beatSaberPlaylist, null, 4));
    break;
  }
}
