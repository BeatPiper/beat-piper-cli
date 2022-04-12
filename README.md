<div align="center">

  # Beat Piper

  ![Logo](./assets/logo.png)

  [![GitHub Repo stars](https://img.shields.io/github/stars/D3SOX/beat-piper?style=for-the-badge)](https://github.com/D3SOX/beat-piper/stargazers)
  [![GitHub issues](https://img.shields.io/github/issues/D3SOX/beat-piper?style=for-the-badge)](https://github.com/D3SOX/beat-piper/issues)
  [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/D3SOX/beat-piper?label=pulls&style=for-the-badge)](https://github.com/D3SOX/beat-piper/pulls)
  <br>
  [![License](https://img.shields.io/github/license/D3SOX/beat-piper?style=for-the-badge)](https://github.com/D3OX/beat-piper/blob/master/LICENSE)
  [![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge)](https://github.com/prettier/prettier)
  <br>
  [![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=node.js&logoColor=fff)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)

</div>

# Motivation
I got into Beat Saber but haven't found a good way to automatically find beatmaps for songs I know. There are some similar projects, but they are either paid or I haven't had a good experience with them. 

# Retrieval methods
## Spotify API
You can use the Spotify Web API to fetch your playlists.
For that you need to copy `.env.example` to `.env` and fill in the required fields.

## Public playlists
Alternatively you can provide a link to a public playlist.
This has a limitation of only fetching the first 100 songs. [See why](https://github.com/microlinkhq/spotify-url-info/issues/69#issuecomment-802364053)

# Usage
⚠️ This tool is currently alpha quality software and is not ready for production use.

1. Run `yarn install`
2. Run `yarn start`

# Attributions

I got the name from a [reddit post](https://www.reddit.com/r/beatsaber/comments/hneox9/comment/fxbynuq) from [@PapuaNewGuinean](https://www.reddit.com/user/PapuaNewGuinean). I hope that's okay
