import http from 'http';
import SpotifyWebApi from 'spotify-web-api-node';
import chalk from 'chalk';
import { AuthorizationCodeGrantResponse } from '../types';

async function getResponseParams(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http
      .createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('You can now close this window.<script>window.close()</script>');
        res.once('finish', () => {
          server.close();
          if (req.url) {
            resolve(req.url.slice(1));
          }
          reject('Could not get response parameters');
        });
      })
      .listen(port);
  });
}

const PORT = 3000;

export default class SpotifyClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly spotifyApi: SpotifyWebApi;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri: `http://localhost:${PORT}`,
    });
  }

  setToken(accessToken: string, refreshToken: string) {
    this.spotifyApi.setAccessToken(accessToken);
    this.spotifyApi.setRefreshToken(refreshToken);
  }

  async refreshToken(): Promise<void> {
    const data = await this.spotifyApi.refreshAccessToken();
    this.spotifyApi.setAccessToken(data.body.access_token);
    if (data.body.refresh_token) {
      this.spotifyApi.setRefreshToken(data.body.refresh_token);
    }
  }

  async authorize(scopes: string[]): Promise<AuthorizationCodeGrantResponse> {
    const state = Math.random().toString(36).slice(2);

    const spotifyUrl = this.spotifyApi.createAuthorizeURL(scopes, state);

    console.info(chalk.blue(`Please click the following link to login via Spotify:\n${spotifyUrl}\n`));

    const responseParams = new URLSearchParams(await getResponseParams(PORT));
    const receivedCode = responseParams.get('code');
    const receivedState = responseParams.get('state');

    if (receivedState !== state) {
      throw new Error('Received and original state do not match');
    }

    if (!receivedCode) {
      throw new Error('No code received');
    }

    const tokenRequestBody = await this.spotifyApi.authorizationCodeGrant(receivedCode);

    console.info(chalk.green('Login successful!'));
    return tokenRequestBody.body;
  }

  async getPlaylists(): Promise<SpotifyApi.ListOfUsersPlaylistsResponse> {
    const playlists = await this.spotifyApi.getUserPlaylists();
    return playlists.body;
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyApi.PlaylistTrackResponse> {
    const tracks = await this.spotifyApi.getPlaylistTracks(playlistId);
    return tracks.body;
  }
}
