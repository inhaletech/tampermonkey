// ==UserScript==
// @name         upwork.com
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  todo
// @author       gregory.tkach, todo
// @match        http*://www.upwork.com/nx/find-work/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var htmlButton = `
<div class="cta send" style="margin-bottom: 20px" onclick="pushToCRM()">
  <div>
    <button class="up-btn up-btn-default m-0 up-btn-block px-15">
      <span>Push to CRM</span>
    </button>
  </div>
</div>
    `;

    function addToResult(out, field, value)
    {
        if(value == "" || value == null)
        {
            return
        }

        out[field] = value
    }

    function removeWordsAndTrim(value, words)
    {
        if(value == null)
        {
            return null
        }

        var out = value;

        for(var word of words)
        {
            out = out.replaceAll(word, '')
        }

        out = out.trim()

        return out;
    }

    function addID(out)
    {
        let slug = url => new URL(url).pathname.match(/[^\/]+/g)
        var value = slug(location.href).slice(-1)[0]

        addToResult(out, "id", value)
    }

        function addOccupationName(out)
    {
        var value = $(".cfe-ui-job-breadcrumbs").text().trim()

        addToResult(out, "occupation-name", value)
    }

    function addOccupationID(out)
    {
        //todo
        //addToResult(out, "occupation-id", value)
    }

    function addPostedAt(out)
    {
        var element = $('div#posted-on > .text-muted > .inline').first()
        var fullText = element.text()
        var valueText = removeWordsAndTrim(fullText, ['ago'])

        var value = valueText

        addToResult(out, "posted-at", value)
    }


    function addTitle(out)
    {
        var value = $("header.up-card-header > h1").text().trim()

        addToResult(out, "title", value)
    }

    function addDescription(out)
    {
        var value = $("div.job-description > div").first().text()

        addToResult(out, "description", value)
    }

    function addCountry(out)
    {
        var value = $("li[data-qa='client-location'] > strong").first().text()

        addToResult(out, "country", value)
    }

    function addCity(out)
    {
        var value = $("li[data-qa='client-location'] > div.text-muted > span").first().text().trim()

        addToResult(out, "city", value)
    }

    function addRate(out)
    {
        var element = $('div.rating > span.nowrap').first()
        var fullText = element.text().trim()
        var valueText = fullText.split('of')[0]
        var value = valueText.trim()

        addToResult(out, "rate", value)
    }

    function addReviews(out)
    {
        var element = $('div.rating > span.nowrap').first()
        var fullText = element.text().trim()
        var valueText = fullText.split('of')[1]
        var value = removeWordsAndTrim(valueText, ["reviews"])

        addToResult(out, "reviews", value)
    }

    function addPaymentVerified(out)
    {
        var value = $('.payment-verified').length > 0

        addToResult(out, "payment-verified", value)
    }

    function addJobsPosted(out)
    {
        var jobsPosted = $("li[data-qa='client-job-posting-stats'] > strong").last().text().trim().split('\n')[0]

        addToResult(out, "jobs-posted", value)
    }

    function addHireRate(out)
    {
        var element = $("li[data-qa='client-job-posting-stats'] > div.text-muted").first()
        var fullText = element.text().trim()
        var valueText = fullText.split(',')[0]
        var value = removeWordsAndTrim(valueText, ['hire rate'])

        addToResult(out, "hire-rate", value)
    }

    function addOpenJobs(out)
    {
        var element = $("li[data-qa='client-job-posting-stats'] > div.text-muted").first()
        var fullText = element.text().trim()
        var valueText = fullText.split(',').slice(-1)[0]
        var value = removeWordsAndTrim(valueText, ["open", 'jobs', 'job'])

        addToResult(out, "open-jobs", value)
    }

    function addTotalSpend(out)
    {
        var value = $("strong[data-qa='client-spend'] > span").first().text().trim()

        addToResult(out, "total-spend", value)
    }

    function addCompanySize(out)
    {
        var value = $("strong[data-qa='client-company-profile-size'] > span").first().text().trim()

        addToResult(out, "company-size", value)
    }



    function addMemberSince(out)
    {
        var element = $("li[data-qa='client-contract-date'] > small.text-muted").first()
        var fullText = element.text().trim()
        var value = removeWordsAndTrim(fullText, ['Member since'])

        addToResult(out, "member-since", value)
    }


    window.pushToCRM = function()
    {
        var out = {}

        addID(out)

        addOccupationName(out)
        addOccupationID(out)

        addPostedAt(out)

        addTitle(out)
        addDescription(out)

        addCountry(out)
        addCity(out)

        addRate(out)
        addReviews(out)

        addPaymentVerified(out)
        addHireRate(out)
        addOpenJobs(out)
        addTotalSpend(out)

        addCompanySize(out)

        addMemberSince(out)

        console.log(out)
    }


    function addButtonPushToCRM()
    {
        $(".cta-row").prepend(htmlButton)
    }

    function renewEventListeners()
    {
        $(".job-tile-title").off('click');
        $(".job-tile-title").on("click", function() { setTimeout(addButtonPushToCRM, 2000) });
    }

    setInterval(renewEventListeners, 2000);

    //todo: check via API is job post already pushed
    //todo: test script on job post page
    //todo: upload scriupt to github
})();
