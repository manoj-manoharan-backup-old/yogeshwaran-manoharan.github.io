require('dotenv').config({path: './.env'});

const fileSystem = require('fs');
const crypto = require('crypto');
const moment = require('moment');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const axios = require('axios');
const KnexDb = require('./db').knex;


const BlogSourceJson = require('./blog-url-source.json');

// const BLOGS_FEED_XML_PATH = "./blog-url-source.xml";
const TECH_BLOG_TABLE = "tech_blog";

class Aggregator {

    _rssLinks = Array.isArray(BlogSourceJson) ? BlogSourceJson : [];

    /** */
    async runAggregation() {

        await this.fetchContentFromRSSFeedsAndSaveToDb();

        await this.fetchDatesFromDbAndWriteToJson();

        await this.fetchCompaniesFromDbAndWriteToJson();

        await this.fetchArticleLinksFromDbByDatesAndWriteToJson();

        return true;
    }

    // /** Fetch Rss links from XML file and set on @param _rssLinks */
    // async fetchAndSetRssLinks() {
    //
    //     let err = "";
    //
    //     try {
    //
    //         const xmlFromFile = fileSystem.readFileSync(BLOGS_FEED_XML_PATH).toString();
    //         const xmlDomDocument = new Dom().parseFromString(xmlFromFile);
    //         const rssFeedUrls = xpath.select("//outline/@xmlUrl", xmlDomDocument);
    //         const owners = xpath.select("//outline/@title", xmlDomDocument);
    //
    //         rssFeedUrls.forEach((rssNodes, index) => {
    //             this._rssLinks.push({
    //                 url: rssNodes.value,
    //                 owner: owners[index].value
    //             })
    //         });
    //
    //     } catch (e) {
    //         err = e.toString();
    //     }
    //
    //     if (this._rssLinks.length > 0) {
    //         return;
    //     }
    //
    //     throw new Error("fetchAndSetRssLinks : RSS Feed link not set. " + err);
    // }

    /** */
    async fetchContentFromRSSFeedsAndSaveToDb() {

        const self = this;
        //
        // for (let i = 0; i < this._rssLinks.length; i++) {
        //
        //     const rssUrl = this._rssLinks[i];
        //
        //     try {
        //         const articleItems = await self.getArticleItemsFromFeed(rssUrl);
        //         for (let i = 0; i < articleItems.length; i++) {
        //             await self.writeArticleItemToDb(articleItems[i]);
        //         }
        //     } catch (e) {
        //         // console.log(e);
        //     }
        // }
        //
        // return true;

        const promises = [];

        this._rssLinks.forEach(rssItem => {

            const rssOwner = rssItem.owner;
            const rssUrl = rssItem.url;

            promises.push(
                new Promise(async (resolve, reject) => {
                    try {
                        const articleItems = await self.getArticleItemsFromFeed(rssUrl, rssOwner);
                        for (let i = 0; i < articleItems.length; i++) {
                            await self.writeArticleItemToDb(articleItems[i]);
                        }
                    } catch (e) {
                        console.log(e);
                    }

                    resolve(true);
                })
            );
        });

        return await Promise.all(promises);
    }

    /** */
    async getArticleItemsFromFeed(feedURL, feedOwner) {

        let err = "";

        try {
            let feedsXml = (await axios.get(feedURL))
                .data
                .replace('\n', '');

            feedsXml = this.replaceAll(feedsXml, '\\<\\!\\[CDATA\\[', '');
            feedsXml = this.replaceAll(feedsXml, ']]>', '');


            const xmlDomDocument = new Dom().parseFromString(feedsXml);

            const titleArr = xpath.select("//item/title", xmlDomDocument) || [];
            const descriptionArr = xpath.select("//item/description", xmlDomDocument) || [];
            const linkArr = xpath.select("//item/link", xmlDomDocument) || [];
            const pubDateArr = xpath.select("//item/pubDate", xmlDomDocument) || [];

            const linkArrLength = titleArr.length;

            const result = [];

            for (let i = 0; i < linkArrLength; i++) {

                const linkText = this.getValueFromNode(linkArr[i]);

                if (linkText) {

                    result.push({
                        owner: feedOwner,
                        link: linkText,
                        title: this.getValueFromNode(titleArr[i]),
                        description: this.getValueFromNode(descriptionArr[i]),
                        pubDate: this.getValueFromNode(pubDateArr[i])
                    });
                }
            }

            return result;
        } catch (e) {
            // console.log(e)
            err = e.toString();
        }

        throw new Error("getArticleItemsFromFeed not fetched for " + feedURL + " : " + err);
    }

    /** */
    replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    /** Get value from nodes */
    getValueFromNode(node) {

        let res = "";

        try {
            res = node.firstChild.data;
        } catch (e) {

        }

        return res;
    }

    /** */
    async writeArticleItemToDb(articleItem) {

        try {

            if (typeof articleItem === "object" &&
                this.isValidString(articleItem.link)) {

                const articleObj = {
                    title: articleItem.title || "",
                    description: articleItem.description,
                    link: articleItem.link,
                    link_hash: this.sha256(articleItem.link),
                    published_date: articleItem.pubDate,
                    owner: articleItem.owner,
                    article_created_at: this.getTimestamp(articleItem.pubDate),
                }

                return KnexDb(TECH_BLOG_TABLE).insert(articleObj);
            }

            throw new Error("writeArticleItemToDb - Article item not saved." + JSON.stringify(articleItem))
        } catch (e) {
            // console.log(e);
        }
    }

    /** */
    isValidString(val) {

        return (
            typeof val === "string" &&
            val.length > 0
        )
    }

    /** */
    sha256(stringValue) {
        return crypto.createHash('sha256').update(stringValue).digest('base64');
    }

    /** */
    getTimestamp(dateIsoString) {
        return this.isValidString(dateIsoString) ? moment(dateIsoString).format('YYYY-MM-DD 00:00:00') : '2006-01-01 00:00:00';
    }

    /** */
    async fetchDatesFromDbAndWriteToJson() {

        let err = null;

        try {

            const datesRow = await this.getArticleDates();

            if (datesRow && Array.isArray(datesRow)) {

                this._dates = datesRow.map(row => {
                    return row.article_created_at.replace(' 00:00:00', '');
                });

                fileSystem.writeFileSync('../api/dates.json', JSON.stringify(this._dates), 'utf-8');

                return true;
            }
        } catch (e) {
            err = e.toString();
        }

        throw new Error("fetchDatesFromDbAndWriteToJson - dates are not created : " + err);
    }

    /** */
    getArticleDates(limit) {

        let query = KnexDb(TECH_BLOG_TABLE)
            .distinct()
            .select({
                article_created_at: "article_created_at"
            })
            .orderBy('article_created_at', 'desc')

        if (limit) {
            query = query.limit(limit);
        }

        return query;
    }


    /** */
    async fetchCompaniesFromDbAndWriteToJson() {

        let err = null;

        try {

            let companyRows = await this.getCompanyRows();

            if (companyRows && Array.isArray(companyRows)) {

                companyRows = companyRows.map(row => {
                    return row.owner;
                });

                fileSystem.writeFileSync('../api/companies.json', JSON.stringify(companyRows), 'utf-8');

                return true;
            }
        } catch (e) {
            err = e.toString();
        }

        throw new Error("fetchCompaniesFromDbAndWriteToJson - companies list is not created : " + err);
    }

    /** */
    getCompanyRows(limit) {

        let query = KnexDb(TECH_BLOG_TABLE)
            .distinct()
            .select({
                owner: "owner"
            })
            .orderBy('owner', 'asc')

        if (limit) {
            query = query.limit(limit);
        }

        return query;
    }

    /** */
    async fetchArticleLinksFromDbByDatesAndWriteToJson() {

        let error = null;

        try {

            // const allDates = await this.getArticleDates();
            const allDates = this._dates;

            if (allDates && Array.isArray(allDates)) {

                for (let i = 0; i < allDates.length; i++) {

                    let articles = await KnexDb(TECH_BLOG_TABLE)
                        .distinct()
                        .select({
                            title: "title",
                            description: "description",
                            link: "link",
                            owner: "owner",
                        })
                        .where("article_created_at", allDates[i])
                        .orderBy('title', 'asc');

                    articles = articles.map(item => {
                        return {
                            ...item,
                            description: this.isValidString(item.description) ? item.description.slice(0, 1000) : item.description
                        }
                    })

                    fileSystem.writeFileSync('../api/dates/' + allDates[i] + ".json", JSON.stringify(articles), 'utf-8');
                }

                return true;
            }

        } catch (e) {
            error = e.toString();
        }

        throw new Error("fetchArticleLinksFromDbByDatesAndWriteToJson - article links not created : " + error);
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