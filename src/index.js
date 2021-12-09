import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';
import BeastSaberClient from "./util/beastsaber.js";
import * as fs from 'fs';
import download from 'download';

// TODO: add inquirer and ask if they want to use their own playlist or a link or saved tracks or recently played tracks or top tracks
// TODO: error handling
// TODO: convert to typescript
// TODO: add BeatSaver as alternative source

// register .env
dotenv.config();

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

// fetch user's playlists
const me = await spotifyApi.getMe();

const playlists = await spotifyApi.getUserPlaylists(me.id);
console.log(playlists.body.items);
const playlist = playlists.body.items.find(playlist => playlist.name === 'test'); // TODO: selection

const playlistTracks = await spotifyApi.getPlaylistTracks(playlist.id);

const tracks = playlistTracks.body.items.map(({ track }) => ({
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
}

// download all maps
await Promise.all(foundMaps.map(({ maps }) => download(maps[0].downloadUrl, 'output')));


// cleanup
await beastSaberClient.destroy();
