import { MapDetail } from 'beatsaver-api/lib/models/MapDetail.js';

export interface Track {
  name: string;
  artist: string;
  id: string;
  search: string;
}

export type Maps = MapDetail[];

export interface TrackWithMaps {
  track: Track;
  maps: Maps;
}

export interface BeatSaberPlaylist {
  playlistTitle: string;
  playlistAuthor: string;
  playlistDescription: string;
  syncURL?: string;
  image: string | null;
  songs: BeatSaberPlaylistSong[];
}

export interface BeatSaberPlaylistSong {
  uploader: string;
  name: string;
  key: string;
  hash: string;
}

export interface SavedToken {
  accessToken: string;
  refreshToken: string;
  expiredAt: number;
}
