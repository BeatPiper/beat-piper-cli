import { Track, TrackWithMaps } from '../types';
import BeatSaverAPI from 'beatsaver-api';
import { SortOrder } from 'beatsaver-api/lib/api/search.js';
import { MapDetail } from 'beatsaver-api/lib/models/MapDetail.js';
import { MapVersion } from 'beatsaver-api/lib/models/MapVersion.js';

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
    // create chunks of 100 track
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
}
