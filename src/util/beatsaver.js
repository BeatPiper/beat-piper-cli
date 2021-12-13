import puppeteer from 'puppeteer';

export default class BeatSaverClient {
  browser = null;

  constructor(browser) {
    this.browser = browser;
  }

  static async init() {
    return new BeatSaverClient(await puppeteer.launch());
  }

  async destroy() {
    await this.browser.close();
  }

  async search(track) {
    const page = await this.browser.newPage();
    await page.goto(`https://beatsaver.com/?q=${encodeURI(track.search)}`);
    await page.waitForSelector('.search-results > .beatmap > .info');
    // TODO: why do we need this timeout?
    await page.waitForTimeout(2500);
    const maps = await page.$$eval('.search-results > .beatmap', results =>
      results.map(result => ({
        title: result.querySelector('.info > a').textContent.trim(),
        downloadUrl: result.querySelector('.links > a:last-child').href,
        // TODO: add up and down votes
        // TODO: add difficulties
      }))
    );
    // title has to include artist & track name (maybe also add some kind of regex matching)
    return {
      track,
      maps: maps.filter(({ title }) => title.includes(track.name) && title.includes(track.artist)),
    };
  }
}
