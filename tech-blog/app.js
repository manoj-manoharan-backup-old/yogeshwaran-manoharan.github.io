/** */
function RssAggregator() {

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
RssAggregator.prototype.regenerateAndSetCompaniesHtml = function () {

    this._companiesHtml = "";

    this.favouriteCompaniesListUpdateOnHtml();

    if (this._companiesHtml.length > 0) {
        this._companiesHtml += "<br><hr>"
    }

    this.availableCompaniesUpdateOnHtml();

    this._companiesHtml = (this._companiesHtml.length > 0) ? this._companiesHtml : "No articles available.";

    $('#companies-navbar').html(this._companiesHtml);
}

/** */
RssAggregator.prototype.favouriteCompaniesListUpdateOnHtml = function () {

    this._favouriteCompanies
        .filter(item => {

            // If filter text string is valid
            if (
                typeof this._filterText === "string" &&
                this._filterText.length > 0
            ) {

                // Check if filter text is same as company
                return (
                    item.slice(0, this._filterText.length) === this._filterText
                )
            }

            return true;
        })
        .forEach((company) => {
            this._companiesHtml += `
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

    // Generate html for showing available companies list
    this._availableCompanies.forEach((company) => {

        if (!this._favouriteCompanies.includes(company)) {
            this._companiesHtml += `
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