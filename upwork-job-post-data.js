// ==UserScript==
// @name         test_upwork.com
// @namespace    http://tampermonkey.net/
// @version      0.1
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
        var out =  `
        <div id="button_push_to_crm" class="cta send" style="margin-bottom: 20px" onclick="{ONCLICK}">
           <div>
              <button class="up-btn up-btn-default m-0 up-btn-block px-15" disabled = "{DISABLED}">
                <span>{TEXT}</span>
              </button>
           </div>
        </div>
        `;

        out = out.replaceAll("{DISABLED}", isPushed ? "true" : "false")
        out = out.replaceAll("{ONCLICK}", isPushed ? "" : "pushToCRM()")
        out = out.replaceAll("{TEXT}", isPushed ? "✅ Was Pushed" : "Push to CRM")

        return out;
    }

    //TODO:REVIEW
 // /////get request for id
    function checkIsJobPostAddedAndAddButton()
    {
        var objWithID = {}
        addID(objWithID)
        var id = objWithID["id"]

        var appScriptUrl = "https://script.google.com/macros/s/AKfycbwWIJueECMDeMrLfrYGk6XRDWKErko4UN_upfel7fZq852yln0jdpH1hb9LOgcJAbYc/exec?action=CHECK_JOB_POST&id=" + id + ""

        try
        {
            var request = new XMLHttpRequest()
            request.open('GET', appScriptUrl, false)// якщо синхроний -false , асинхронний видає помилку
            request.send(null)

            var jobPostExists = false

            if(request.status === 200)
            {
                console.log(request.responseText)
                var response = request.responseText
                response = JSON.parse(response)
                jobPostExists = response.job_post_exists
            }
            
            var htmlButton = getHtmlButton(jobPostExists)
            $(".cta-row").prepend(htmlButton)
        }
        catch (error)
        {
            console.log('TODO: HTTP REQUEST ERROR ' + error)
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
    function addOccupationID(out) // not done
    {
        //addToResult(out, "occupation-id", value)
    }

    function addPostedAt(out) 
    {
        var element = $('div#posted-on > .text-muted > .inline').first()
        var fullText = element.text()
        var valueText = removeWordsAndTrim(fullText, ['ago'])

        var todayDate = Date.now()

        var dateArray = valueText.split(' ')

        var durationAgoNumber = Number.parseInt(dateArray[0])

        //todo: replace split with indexOf
        if (valueText.indexOf("year") != -1)
        {
            durationAgoNumber = durationAgoNumber * 365 * 24 * 60 * 60 * 1000

        }            
        else if (valueText.indexOf("minute") != -1)
        {
            durationAgoNumber = durationAgoNumber * 60 * 1000
        }

        todayDate = todayDate - durationAgoNumber

        // var HourText = textDate.split('hour')
        if (HourText.length>1)
        {
            durationAgoNumber = durationAgoNumber * 60 * 60 * 1000
        }

        // var DayText = textDate.split('day')
        if (DayText.length > 1)
        {
            durationAgoNumber = durationAgoNumber * 24 * 60 * 60 * 1000
        }
        // var MonthText = textDate.split('month')
        if (MonthText.length > 1)
        {
            durationAgoNumber = durationAgoNumber * 30 * 24 * 60 * 60 * 1000
        }

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

    function addRate(out) // рейтинг
    {
        var element = $('div.rating > span.nowrap').first()
        var fullText = element.text().trim()
        var valueText = fullText.split('of')[0]
        var value = valueText.trim()

        addToResult(out, "rate", value)
    }

    function addReviews(out) //
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
        var value = $("strong[data-qa='client-spend'] > span").first().text().trim()
        value= value.replace('$','')
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

        addToResult(out, "member-since", value)
    } 

    // avg hourly rate paid
    function addRatePaid(out) 
    {
        var tags = $("strong[data-qa='client-hourly-rate']")

        if (tags.length == 0) return

        var valueText = tags.first().text().split('\n')[1].trim()

        addToResult(out, "client-hourly-rate", valueText)
     }

    function addHourlyRatePaid(out) // avg hourly rate paid- houers
    {
        var value = $("div[data-qa='client-hours'].text-muted").first().text()

        if (value.length == 0) return

        var valueText = value.split('\n')
        var hourlyRateText = valueText[1].trim()
        var hourlyRate = Number.parseInt(hourlyRateText)

        addToResult(out, "hourlyRate", hourlyRate)
    }   

    //TODO: test
    function addPriceTypeTimeLog(out) // hour price
    {
        var tags = $("div[data-cy='clock-timelog']")
        
        if (tags.length == 0) return

        var minPrice = ''

        // var fullText = $($("div[data-cy='clock-timelog']")[0].nextElementSibling)
        var fullText = $(tags.first().get().nextElementSibling)
        var valueStrong = fullText.first().text().trim()

        minPrice = valueStrong.split('-').slice()[0].split('$')[1]

        addToResult(out, "min-Price", minPrice)
    }

    // hour price
    function addPriceTypeTimeLogMax(out) 
    {
        var tags = $("div[data-cy='clock-timelog']")
        
        if (tags.length == 0) return

        var maxPrice = ''

        var fullText = $(tags.first().get().nextElementSibling)
        var valueStrong = fullText.first().text().trim()

        maxPrice = valueStrong.split('$').slice(-1)[0]

        addToResult(out, "max-Price", maxPrice)
    }

    // fixed  price
    function addFixedPrice(out) 
    {
        var tags = $("div[data-cy='fixed-price']")

        if (tags.length == 0) return

        var fixedPrice =''

        var fullText = $(tags.first().get().nextElementSibling)
        var valueStrong = fullText.first().text().trim()
        fixedPrice = valueStrong.split('$')[1]

        addToResult(out, "fixedPrice", fixedPrice)
    }

    // Less than nn hrs/week
    function addHourInWeek(out) 
    {
        var tags = $("div[data-cy='clock-hourly']")

        if (tags.length == 0) return

        var valueStrong =''

        var fullText = $(tags.first().get().nextElementSibling)
        valueStrong = fullText.first().text().trim()

        addToResult(out, "hour-in-week", valueStrong)
    }

    function addProjectLength(out)
    {
        var fullText = $("ul[class='cfe-ui-job-features p-0'] > li > div > strong > span[class='d-lg-none']")
        var value = fullText.first().text().trim()

        addToResult(out, "project-lengh", value)
    }
   
    function addProjectType(out)
    {
        var value = $("ul[class ='list-unstyled segmentations']>li>span")
        var valueType =value.first().text()

        addToResult(out, "project-type", valueType)
     }

     function addActivityJobHires(out) 
    {
       var Massvalue =$("ul.list-unstyled > li[data-v-3c15e380]")
       var valueText = ""
       var value = ""

       if (Massvalue.length>0)
       {
           for (var i=0;i<= Massvalue.length-1;i++)
           {
               valueText = Massvalue[i].innerText
               if(valueText.indexOf("Hires")>-1)
               {
                  // value = valueText.split('\n')[1]
                  value = valueText.split('Hires:')[1].trim()
               }
           }
       }

       addToResult(out, "activity-job-hires", value)
    }

    function addSkills(out)
    {
        var tags = $("span[slot='reference'] > a")

        var skillsNames = []

        for(var tag in tags)
        {
            skillsName.push(tag.innerText)
        }

        addToResult(out, "skills", skillsNames.join(","))
    }

    function addAttachment(out)
    {
        var tags = $("ul.list-unstyled > li > a")


        var attachHref
        var attachAll=""

        for (var i=0; i<=attachmMass.length-1;i++)
        {
           attachHref = attachmMass[i].href
            if (i<attachmMass.length-1)
            {
                attachAll = attachAll+ ''+attachHref+',\n'
            }
            else
            {
                attachAll = attachAll+ ''+attachHref
            }

        }

        addToResult(out, "attachment", attachAll)
    }

    function addCompanySize(out)
    {
      var value = $("div[data-qa='client-company-profile-size']").first().text().trim().split('\n')[0]

      addToResult(out, "company-size", value)
    }

    function addConnectsToSubmit(out)
    {
        //var value = $("div[class='d-none d-lg-block']>div").textContent.trim().split('Send a proposal for: ')[1].split('Connect')[0].trim()

        var tags = $("div[class='d-lg-none mt-10']>div")

        if(valueMass.length == 0) return

        var valueText = tags.first().text().trim().split('Send a proposal for:')[1].split('Connects')[0].trim()

        addToResult(out, "connect-to-submit", valueText)
    }

    function addActivityJobProposals(out)
    {
       var Massvalue =$("ul.list-unstyled>li[data-v-3c15e380]")
       var valueText = ""
       var value = ""

       if (Massvalue.length>0)
       {
           for (var i=0;i<= Massvalue.length-1;i++)
           {
               valueText = Massvalue[i].innerText
               if(valueText.indexOf("Proposals:")>-1)
               {
                  // value = valueText.split('\n')[1]
                  value = valueText.split('Proposals:')[1].trim()
               }
           }
       }
        else
        {
            value = $("ul.list-unstyled>li[data-v-3c15e380]").innerText.split('Proposals:')[1].trim()
        }
        
       addToResult(out, "activity-job-proposals", value)
    }


    window.pushToCRM = function()
    {
        var out = {}

        ////// 

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

        // push to automation
        var request = {}
        request.type = "POST"
        request.url = "https://hook.eu1.make.com/elb021vtg3yydenqy2qzoviaj2b6lma9"
        request.contentType = "application/json; charset=utf-8"
        request.dataType = "json"
        request.data = JSON.stringify(out)
        request.success = (data) => console.log("request sent success")
        request.error = (errorMessage) => console.log("request sent error")
        $.ajax(request);

  }

    function renewButtonPushToCRM()
    {
        //TODO: remove button with #button_push_to_crm
        
    }

    function renewEventListeners()
    {
        $(".job-tile-title").off('click');
        $(".job-tile-title").on("click", function() { setTimeout(renewButtonPushToCRM, 2000) });
    }


    setInterval(renewEventListeners, 2000);
    setTimeout(renewButtonPushToCRM, 3000);
})();
