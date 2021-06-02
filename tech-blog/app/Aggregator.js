const fileSystem = require('fs');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;

class Aggregator {

    _rssLinks = [];

    /** */
    async runAggregation() {

        await this.fetchAndSetRssLinks();

        // await this.fetchContentFromRSSFeedsAndSaveToDb();
        //
        // await this.fetchDatesFromDbAndWriteToJson();
        //
        // await this.fetchArticleLinksFromDbByDatesAndWriteToJson();

        return true;
    }

    /** Fetch Rss links from XML file and set on @param _rssLinks */
    async fetchAndSetRssLinks() {

        let err = null;

        try {

            const xmlFromFile = fileSystem.readFileSync("./blog-url-source.xml").toString();
            const xmlDomDocument = new Dom().parseFromString(xmlFromFile);
            const rssFeedUrls = xpath.select("//outline/@htmlUrl", xmlDomDocument);

            rssFeedUrls.forEach(rssNodes => {
                this._rssLinks.push(rssNodes.value)
            });

        } catch (e) {
            err = e.toString();
        }

        if (this._rssLinks.length > 0) {
            return;
        }

        throw new Error("fetchAndSetRssLinks : RSS Feed link not set. " + err);
    }
}

(new Aggregator())
    .runAggregation()
    .then(res => {
        console.log(res);
        process.exit(0);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    })