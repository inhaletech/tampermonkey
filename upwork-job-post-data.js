// ==UserScript==
// @name         upwork.com
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  todo
// @author       gregory.tkach, nataliia.kupich
// @match        http*://www.upwork.com/nx/jobs/*
// @match        http*://www.upwork.com/nx/find-work/*
// @match        http*://www.upwork.com/jobs/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    function getHtmlButton(isPushed)
    {
        var out = `
        <div id="button_push_to_crm" class="cta send" style="margin-bottom: 20px" onclick="{ONCLICK}">
           <div>
              <button class="up-btn up-btn-default m-0 up-btn-block px-15" {DISABLED}>
                <span>{TEXT}</span>
              </button>
           </div>
        </div>
        `;

        out = out.replaceAll("{DISABLED}", isPushed ? "disabled" : "")
        out = out.replaceAll("{ONCLICK}", isPushed ? "" : "pushToCRM()")
        out = out.replaceAll("{TEXT}", isPushed ? "✅ Was Pushed" : "Push to CRM")

        return out;
    }



    function addButtonPushToCRM(jobPostExists)
    {
        var htmlButton = getHtmlButton(jobPostExists)
        $(".cta-row").prepend(htmlButton)
    }

    function removeButtonPushToCRM()
    {
        $("#button_push_to_crm").remove()
    }

    function onXHRError(error)
    {

        console.log('HTTP REQUEST ERROR ' + JSON.stringify(error))
    }


    //TODO:REVIEW
    // /////get request for id
    function checkIsJobPostAddedAndAddButton()
    {
        debugger
       // addButtonPushToCRM(false)
       // return

        var data = {}
        addID(data)
        data.id = data.id.replace('~','%7E')
        var error = null

        try
        {
            var url = "https://script.google.com/macros/s/AKfycbwZembv1EZTUNJSb0TCl116g2iK2FybCQhPNsDMREvl-P21EQvvw6DmUaEWGQw3SAcn/exec?action=CHECK_JOB_POST&id=" + data.id + ""
            var request = new XMLHttpRequest()
            request.open('GET', url, true)
            request.ontimeout = onXHRError
            request.onerror = onXHRError

            request.onreadystatechange = function(e)
            {
                if (request.readyState != 4) return

                if (request.status === 200)
                {
                    console.log(request.responseText)

                    var response = request.responseText
                    response = JSON.parse(response)
                    addButtonPushToCRM(response.job_post_exists)
                }
                else
                {
                   onXHRError(request.responseText)
                }
            }

            request.send()
        }
        catch (e)
        {
            onXHRError(e.stack)
        }
    }

    //
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
        value = value.split('~').slice(-1)[0]
        value = '~'+value

        addToResult(out, "id", value)
    }


    function addOccupationName(out)
    {
        var value = $(".cfe-ui-job-breadcrumbs").text().trim()

        addToResult(out, "occupation-name", value)
    }

    //TODO: implement

    function addOccupationID(out)
    {
        //addToResult(out, "occupation-id", value)
        var element = $(".cfe-ui-job-breadcrumbs > span >a")
        var value = element[0].href.split('uid=')[1]

        addToResult(out, "occupation-id", value)
    }

    function addPostedAt(out)
    {
        var element = $('div#posted-on > .text-muted > .inline').first()
        var fullText = element.text()
        var valueText = removeWordsAndTrim(fullText, ['ago'])

        var todayDate = Date.now()

        var dateArray = valueText.split(' ')

        var durationAgoNumber = Number.parseInt(dateArray[0])

        if (valueText.indexOf("year") != -1)
        {
            durationAgoNumber = durationAgoNumber * 365 * 24 * 60 * 60 * 1000
        }
        else if (valueText.indexOf("month") != -1)
        {
            durationAgoNumber = durationAgoNumber * 30 * 24 * 60 * 60 * 1000
        }
        else if (valueText.indexOf("day") != -1)
        {
            durationAgoNumber = durationAgoNumber * 24 * 60 * 60 * 1000
        }
        else if (valueText.indexOf("hour") != -1)
        {
            durationAgoNumber = durationAgoNumber * 60 * 60 * 1000
        }
        else if (valueText.indexOf("minute") != -1)
        {
            durationAgoNumber = durationAgoNumber * 60 * 1000
        }

        todayDate = todayDate - durationAgoNumber
        var value = Number.parseInt((todayDate/1000))

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

    // rating
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
        var jobsPosted
        //= $("li[data-qa='client-job-posting-stats'] > strong").last().text().trim().split('\n')[0]
        var tags = $("li[data-qa='client-job-posting-stats'] > strong").last()

        if (tags.length == 0) return

        for (var tag of tags)
        {
            if(tag.innerText.indexOf("jobs") == -1) continue

            jobsPosted = tag.innerText.split('jobs')[0].trim()

            break
        }

        addToResult(out, "jobs-posted", jobsPosted)
    }

    function addHireRate(out)
    {
        var element = $("li[data-qa='client-job-posting-stats'] > div.text-muted").first()
        var fullText = element.text().trim()
        var valueText = fullText.split(',')[0]
        var rateValue = removeWordsAndTrim(valueText, ['hire rate'])
        var value = rateValue.split('%')[0]
        value = value / 100

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
        var value = $("strong[data-qa='client-spend'] > span").first()
        value = value[0].innerText.replace('total spent','').trim()
        value = value.replace('$','')
        value = value.replace('M+','000000')
        value = value.replace('k+','000')
        value = value.replace('+','')

        addToResult(out, "total-spend", value)
    }

    function addMemberSince(out)
    {
        var element = $("li[data-qa='client-contract-date'] > small.text-muted").first()

        var fullText = element.text().trim()
        var valueDate = removeWordsAndTrim(fullText, ['Member since'])
        var value = new Date(valueDate)
        value = value.toISOString()

        addToResult(out, "member-since", value)
    }

    // avg hourly rate paid
    function addRatePaid(out)
    {
        var tags = $("strong[data-qa='client-hourly-rate']")

        if (tags.length == 0) return

        var value = tags.first().text().split('\n')[1].trim()
        value = value.replace('$','')

        addToResult(out, "client-hourly-rate", value)
     }

    // avg hourly rate paid- houers
    function addHourlyRatePaid(out)
    {
        var tags = $("div[data-qa='client-hours'].text-muted").first().text()

        if (tags.length == 0) return

        var valueText = tags.split('\n')[1].trim()

        var value = Number.parseInt(valueText)

        addToResult(out, "hourlyRate", value)
    }

    // hour price MIN
    function addPriceTypeTimeLog(out)
    {
        var tags = $("div[data-cy='clock-timelog']")

        if (tags.length == 0) return

        var fullText = $(tags[0].nextElementSibling)
        //var fullText = $(tags.first().get().nextElementSibling)
        var valueStrong = fullText.first().text().trim()

        var value = valueStrong.split('-').slice()[0].split('$')[1]

        addToResult(out, "min-Price", value)
    }

    function addClockHourly(out)
    {
        var tags = $("div[data-cy='clock-hourly']")
        if (tags.length == 0) return

        var fullText = $(tags[0].nextElementSibling)
        var value = fullText.first().text().trim()

        addToResult(out, "clock-hourly", value)

    }
    // hour price max
    function addPriceTypeTimeLogMax(out)
    {
        var tags = $("div[data-cy='clock-timelog']")

        if (tags.length == 0) return

        var fullText = $(tags[0].nextElementSibling)
        //var fullText = $(tags.first().get().nextElementSibling)
        var valueStrong = fullText.first().text().trim()

        var value = valueStrong.split('$').slice(-1)[0]

        addToResult(out, "max-Price", value)
    }

    // fixed  price
    function addFixedPrice(out)
    {
        var tags = $("div[data-cy='fixed-price']")

        if (tags.length == 0) return

        var fullText = $(tags[0].nextElementSibling)
       // var fullText = $(tags.first().get().nextElementSibling)
        var valueStrong = fullText.first().text().trim()

        var value = valueStrong.split('$')[1]
        value = value.replaceAll(',','')

        addToResult(out, "fixedPrice", value)
    }

    function addExpertise(out)
    {

        var tags = $("div[data-cy='expertise']")

        if (tags.length == 0) return

        var fullText = $(tags[0].nextElementSibling)
       // var fullText = $(tags.first().get().nextElementSibling)
        var value = fullText.first().text().trim()

        addToResult(out, "expertise", value)
    }
    // Less than nn hrs/week
    function addHourInWeek(out)
    {
        var tags = $("div[data-cy='clock-hourly']")

        if (tags.length == 0) return

        var value =''

        var fullText = $(tags.first().get().nextElementSibling)
        value = fullText.first().text().trim()

        addToResult(out, "hour-in-week", value)
    }

    function addProjectLength(out)
    {
        var element = $("ul[class='cfe-ui-job-features p-0'] > li > div > strong > span[class='d-lg-none']")
        var value = element.first().text().trim()

        addToResult(out, "project-lengh", value)
    }

    function addProjectType(out)
    {
        var element = $("ul[class ='list-unstyled segmentations'] > li > span")
        var value = element.first().text()

        addToResult(out, "project-type", value)
     }

    function addActivityJobHires(out)
    {
       var tags =$("ul.list-unstyled > li[data-v-3c15e380]")

       var value = ""

       if (tags.length == 0) return

       for (var tag of tags)
       {
           if (tag.innerText.indexOf("Hires") == -1) continue

           value = tag.innerText.split('Hires:')[1].trim()

           break
       }

       addToResult(out, "activity-job-hires", value)
    }

    function addSkills(out)
    {
        var tags = $("span[slot='reference'] > a")

        var skillsNames = []

        for (var tag of tags)
        {
            skillsNames.push(tag.innerText)
        }

        addToResult(out, "skills", skillsNames.join(","))
    }

    function addAttachment(out)
    {
        var tags = $("ul.list-unstyled > li > a")

        var attachments = []

        for (var tag of tags)
        {
            attachments.push(tag.href)
        }

        addToResult(out, "attachment", attachments.join(","))
    }

    function addCompanySize(out)
    {
      var element = $("div[data-qa='client-company-profile-size']").first().text().trim()
      var value = element.split('\n')[0]

      addToResult(out, "company-size", value)
    }

    function addConnectsToSubmit(out)
    {
        //var value = $("div[class='d-none d-lg-block']>div").textContent.trim().split('Send a proposal for: ')[1].split('Connect')[0].trim()

        var element = $("div[class='d-lg-none mt-10'] > div")

        if (element.length == 0) return

        var value = element.first().text().trim().split('Send a proposal for:')[1]

        value = value.split('Connect')[0].trim()

        addToResult(out, "connect-to-submit", value)
    }

    function addActivityJobProposals(out)
    {
        var tags =$("ul.list-unstyled>li[data-v-3c15e380]")

        var value = ""

        if (tags.length == 0) return

        for (var tag of tags)
        {
            if(tag.innerText.indexOf("Proposals:") == -1) continue

            value = tag.innerText.split('Proposals:')[1].trim()

            break
        }

        addToResult(out, "activity-job-proposals", value)
    }

    function addQuestions(out)
    {
        var tags = $("section[class='up-card-section']>div>ol>li")
        var value = []

        for (var tag of tags)
        {
            value.push(tag.innerText)
        }
         addToResult (out, "questions", value.join("\n\n"))
    }

    window.pushToCRM = function()
    {
        var out = {}

        //////

        addClockHourly(out)
        addExpertise(out)

        addRatePaid(out)
        addHourlyRatePaid(out)

        addPriceTypeTimeLog(out)
        addPriceTypeTimeLogMax(out)

        addFixedPrice(out)

        addHourInWeek(out)

        addProjectLength(out)
        addProjectType(out)

        addActivityJobHires(out)
        addActivityJobProposals(out)

        addSkills(out)

        addAttachment(out)

        addConnectsToSubmit(out)

        addQuestions(out)

        ////////.

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

        addJobsPosted(out)

        addHireRate(out)
        addOpenJobs(out)
        addTotalSpend(out)

        addCompanySize(out)

        addMemberSince(out)

        console.log(out)

        // push to make.com

        var error = null
        var url = "https://hook.eu1.make.com/elb021vtg3yydenqy2qzoviaj2b6lma9"
        //var url = "https://hook.eu1.make.com/e2y4v4rwxqt49bmovbv26ilpkgjrqfc9" // test for ragic

        try
        {
            var request = new XMLHttpRequest()
            var dataFormated = JSON.stringify(out)

            console.log(dataFormated)


            request.open('POST', url, true)

            request.setRequestHeader("Content-Type", "application/json; charset=utf-8");

            request.ontimeout = onXHRError
            request.onerror = onXHRError

            request.onreadystatechange = function(e)
            {
                if (request.readyState != 4) return

                if (request.status === 200)
                {
                    console.log(request.responseText)

                    var response = request.responseText

                    removeButtonPushToCRM();

                    addButtonPushToCRM(true)

                }
                else
                {
                    onXHRError(request.responseText)
                }
            }

            request.send(dataFormated)
        }
        catch (e)
        {
            onXHRError(e.stack)
        }
    }

    function renewButtonPushToCRM()
    {

        removeButtonPushToCRM()
        checkIsJobPostAddedAndAddButton()
    }

    function renewEventListeners()
    {
        $(".job-tile-title").off('click');
        $(".job-tile-title").on("click", function() { setTimeout(renewButtonPushToCRM, 2000) });
    }

    setInterval(renewEventListeners, 2000);
    setTimeout(renewButtonPushToCRM, 3000);
})();
