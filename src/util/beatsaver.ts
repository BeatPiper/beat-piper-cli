import { Maps, BeatSaberPlaylist, Track, TrackWithMaps } from '../types';
import BeatSaverAPI from 'beatsaver-api';
import { fileTypeFromBuffer } from 'file-type';
import { SortOrder } from 'beatsaver-api/lib/api/search.js';
import { MapDetail } from 'beatsaver-api/lib/models/MapDetail.js';
import { MapVersion } from 'beatsaver-api/lib/models/MapVersion.js';
import download from 'download';

export default class BeatSaverClient {
  private readonly api: BeatSaverAPI;

  constructor() {
    this.api = new BeatSaverAPI({
      AppName: 'Beat Piper',
      Version: '0.0.1',
    });
  }

  static getLatestVersion(map: MapDetail): MapVersion {
    return map.versions.sort((a, b) => b.createdAt.epochSeconds - a.createdAt.epochSeconds)[0];
  }

  async searchInBatches(tracks: Track[]): Promise<TrackWithMaps[]> {
    // create chunks of 10 tracks
    const chunks = [];
    for (let i = 0; i < tracks.length; i += 10) {
      chunks.push(tracks.slice(i, i + 10));
    }
    const results: TrackWithMaps[] = [];
    // search for each chunk
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(track => this.search(track)));
      results.push(...chunkResults);
      // wait for 1 second between each search
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results;
  }

  async search(track: Track): Promise<TrackWithMaps> {
    const results = await this.api.searchMaps({
      q: track.search,
      sortOrder: SortOrder.Relevance,
    });
    return {
      track,
      maps: results.docs.filter(map => map.name.toLowerCase().includes(track.name.toLowerCase())), // TODO: maybe use Levenshtein distance
    };
  }

  async createPlaylist(
    playlistTitle: string,
    playlistDescription: string,
    imageUrl: string,
    maps: Maps
  ): Promise<BeatSaberPlaylist> {
    const songs = maps.map(map => ({
      key: map.id,
      hash: BeatSaverClient.getLatestVersion(map).hash,
      name: map.name,
      uploader: map.uploader.name,
    }));

    let image: string | null = null;
    if (imageUrl) {
      const buffer = await download(imageUrl);
      const fileType = await fileTypeFromBuffer(buffer);
      if (fileType) {
        image = `data:${fileType.mime};base64,${buffer.toString('base64')}`;
      }
    }

    return {
      playlistTitle,
      playlistDescription,
      playlistAuthor: 'Beat Piper',
      songs,
      image,
    };
  }
}
