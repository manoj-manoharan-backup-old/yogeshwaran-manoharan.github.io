/** */
function RssAggregator() {

    this._dateIndex = 0;
    this._previousFilteredArtlicesCount = 0;
    this._articles = [];

    this._newArticlesFound = false;

    this.LOCAL_STORAGE_KEY = "favouriteCompanies"

    this._filterText = "";

    this.fetchAndSetAlreadyChosenCompanies();
}

/** */
RssAggregator.prototype.fetchAndSetAlreadyChosenCompanies = function () {
    this._favouriteCompanies = JSON.parse(window.localStorage.getItem(this.LOCAL_STORAGE_KEY) ?? '[]');
    return this;
}

/** */
RssAggregator.prototype.setAvailableCompanies = function (companies) {
    this._availableCompanies = companies;
    return this;
}

/** */
RssAggregator.prototype.setAvailableDates = function (dates) {
    this._availableDates = dates;
    return this;
}

/** */
RssAggregator.prototype.regenerateAndSetCompaniesHtml = function () {

    this.favouriteCompaniesListUpdateOnHtml();

    this.availableCompaniesUpdateOnHtml();
}

/** */
RssAggregator.prototype.favouriteCompaniesListUpdateOnHtml = function () {

    let html = '';

    this._favouriteCompanies
        .forEach((company) => {
            html += `
                     <li class="date-nav-selection">
                         <input 
                         type="checkbox" 
                         id="removeFavCompany"
                         checked 
                         value="${company}"
                         /> ${company}
                      </li>
            `;
        });


    $("#fav-companies-navbar").html(html);

}


/** */
RssAggregator.prototype.removeFromFavourites = function (company) {

    if (typeof company === "string" && company.length > 0) {

        // remove from list
        const companyIndex = this._favouriteCompanies.indexOf(company);

        if (companyIndex > -1) {

            this._favouriteCompanies.splice(companyIndex, 1);

            // update list on localstorage
            window.localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this._favouriteCompanies))

            // Update html
            this.regenerateAndSetCompaniesHtml();
        }
    }
}


/** */
RssAggregator.prototype.availableCompaniesUpdateOnHtml = function () {

    // Add filter text box
    let html = "";

    // Generate html for showing available companies list
    this._availableCompanies
        .filter(item => {

            // If filter text string is valid
            if (
                typeof this._filterText === "string" &&
                this._filterText.length > 0
            ) {

                // Check if filter text is same as company
                return (
                    item.slice(0, this._filterText.length).toLowerCase()
                    === this._filterText.toLowerCase()
                )
            }

            return true;
        })

        .forEach((company) => {

            if (!this._favouriteCompanies.includes(company)) {
                html += `
                     <li class="date-nav-selection">
                         <input 
                         id="addFavCompany"
                         type="checkbox" 
                         value="${company}"
                         /> ${company}
                      </li>
            `;
            }
        });

    $("#available-companies-navbar").html(html);
}

/** */
RssAggregator.prototype.addToFavourites = function (company) {

    if (typeof company === "string" && company.length > 0) {

        this._favouriteCompanies.push(company);

        this._favouriteCompanies.sort();

        // update list on localstorage
        window.localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this._favouriteCompanies));

        // Update html
        this.regenerateAndSetCompaniesHtml();
    }
}

/** */
RssAggregator.prototype.filterAvailableCompanies = function (text) {
    this._filterText = text;
    this.regenerateAndSetCompaniesHtml();
}

/** */
RssAggregator.prototype.returnValidArticles = function (articles) {

    this._articles.push(...articles);

    const filteredArticles = this._articles
        .filter(function ({link}) {

            const key = `${link}`;

            return !this.has(key) && this.add(key);

        }, new Set)
        .filter(article => {
            return (this._favouriteCompanies.includes(article.owner));
        })

    if (this._previousFilteredArtlicesCount < filteredArticles.length) {
        this._previousFilteredArtlicesCount = filteredArticles.length;
        this._newArticlesFound = true;
    }

    return filteredArticles;
}

/** */
RssAggregator.prototype.didNewArticlesShowUp = function () {
    return this._newArticlesFound;
}

/** */
RssAggregator.prototype.resetNewArticlesFoundStatus = function () {
    this._newArticlesFound = false;
}

/** */

/** */
RssAggregator.prototype.returnArticleHtml = function (articles) {

    let html = '';

    articles
        .forEach(article => {
            html += `
                        <div class="card">
                            <a href="${article.link}" target="_blank">
                             <small>${article.owner || ""}</small>
                                <h2>${article.title || ""}</h2>
                              <small>${this.fetchDescription(article.description) || ""}</small>
                            </a>
                        </div>
                         <br>
            `;
        });

    return html;
}

/** */
RssAggregator.prototype.getCurrentDateFromList = function () {

    let date = false;

    try {
        date = this._availableDates[this._dateIndex];
        this._dateIndex++;
    } catch (e) {
        console.log(e);
    }

    return date;
}

/** */
RssAggregator.prototype.fetchDescription = function (description) {

    let res = "";
    try {
        if (description) {
            res = description.length > 990 || description.includes("<img") ? "" : description
        }
    } catch (e) {
        console.log(e);
    }

    return res;
}