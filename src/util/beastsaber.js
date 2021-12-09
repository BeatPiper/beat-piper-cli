import puppeteer from 'puppeteer';

export default class BeastSaberClient {
    browser = null;

    constructor(browser) {
        this.browser = browser;
    }

    static async init() {
        return new BeastSaberClient(await puppeteer.launch());
    }

    async destroy() {
        await this.browser.close();
    }

    async search(track) {
        const page = await this.browser.newPage();
        await page.goto(`https://bsaber.com/?s=${encodeURI(track.search)}`);
        const maps = await page.$$eval('article.post > div.row > div.medium-8', results =>
            results.map(result => ({
                title: result.querySelector('header.post-title').textContent.trim(),
                downloadUrl: result.querySelector('a.-download-zip').href,
                // TODO: add up and down votes
            }))
        );
        // title has to include artist & track name (maybe also add some kind of regex matching)
        return {
            track,
            maps: maps.filter(({ title }) => title.includes(track.name) && title.includes(track.artist))
        };
    }

}
