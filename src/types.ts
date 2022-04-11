import { MapDetail } from 'beatsaver-api/lib/models/MapDetail.js';

export interface Track {
  name: string;
  artist: string;
  id: string;
  search: string;
}

export interface TrackWithMaps {
  track: Track;
  maps: MapDetail[];
}

export interface AuthorizationCodeGrantResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}
