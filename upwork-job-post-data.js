// ==UserScript==
// @name         test_upwork.com
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  todo
// @author       gregory.tkach, todo
// @match        http*://www.upwork.com/nx/jobs/*
// @match        http*://www.upwork.com/nx/find-work/*
// @match        http*://www.upwork.com/jobs/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    ////
   var htmlButton = ``;

   /* var htmlButton = `
<div class="cta send" style="margin-bottom: 20px" onclick="pushToCRM()">
  <div>
    <button class="up-btn up-btn-default m-0 up-btn-block px-15">
      <span>Push to CRM</span>
    </button>
  </div>
</div>
    `;*/

 // /////get request for id
    function getHtmlButton()

    {
        var htmlButtonFirst = `
                            <div class="cta send" style="margin-bottom: 20px" onclick="pushToCRM()">
                               <div>
                                  <button class="up-btn up-btn-default m-0 up-btn-block px-15">
                                    <span>Push to CRM</span>
                                  </button>
                               </div>
                            </div>
                            `;

        var htmlButtonWasPushed = `
                            <div class="cta send" style="margin-bottom: 20px" >
                              <div>
                                 <button class="up-btn up-btn-default m-0 up-btn-block px-15" disabled = "true">
                                        <span>Was Pushed</span>
                                </button>
                              </div>
                            </div>
                                 `;

        let slug = url => new URL(url).pathname.match(/[^\/]+/g)
        var value = slug(location.href).slice(-1)[0]
        value = value.split('~').slice(-1)[0]
        value = '~'+value
        var ID = value

        var appScriptUrl = "https://script.google.com/macros/s/AKfycbwWIJueECMDeMrLfrYGk6XRDWKErko4UN_upfel7fZq852yln0jdpH1hb9LOgcJAbYc/exec?action=CHECK_JOB_POST&id="+ID+""

        var objResponce
        var TextResponce
        var PostEx_resp = false

        try
        {
            var GetRequest = new XMLHttpRequest()
            GetRequest.open('GET',appScriptUrl,false)// якщо синхроний -false , асинхронний видає помилку
            GetRequest.send(null)

            if(GetRequest.status === 200)
            {
                console.log(GetRequest.responseText)
                TextResponce= GetRequest.responseText
                objResponce = JSON.parse(TextResponce)
                PostEx_resp = objResponce.job_post_exists
            }

            if (PostEx_resp)
            {
                return htmlButtonWasPushed
                //  console.log('ButtonWasPushed')
            }
            else
            {
                return htmlButtonFirst
              //  console.log('ButtonPrepare')

            }
        }
        catch (error)
        {
            console.log('!!!!have error in your request!!!')
            console.log(error)

            return htmlButtonFirst
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

    function addOccupationID(out) // not done
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
       
        var test_Date = Date.now()

        var dateArray = valueText.split(' ')

        var TextNumber = Number.parseInt(dateArray[0])

        var TextDate = dateArray[1]

        var MinuteText = TextDate.split('minute')
        var HourText = TextDate.split('hour')
        var DayText = TextDate.split('day')

        var MonthText = TextDate.split('month')
        var YearText = TextDate.split('year')

        if (MinuteText.length>1)
        {
            TextNumber = TextNumber*60*1000
            test_Date = test_Date - TextNumber
        }

        if (HourText.length>1)
        {
            TextNumber = TextNumber*60*60*1000
            test_Date = test_Date - TextNumber
        }

        if (DayText.length>1)
        {
            TextNumber = TextNumber*24*60*60*1000
            test_Date = test_Date - TextNumber
        }
        if (MonthText.length>1)
        {
            TextNumber = TextNumber*30*24*60*60*1000
            test_Date = test_Date - TextNumber
        }
        if (YearText.length>1)
        {
            TextNumber = TextNumber*365*24*60*60*1000
            test_Date = test_Date - TextNumber
        }

        value = Number.parseInt((test_Date/1000))

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
        value = value/100

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

   /* function addCompanySize(out)
    {
        var value = $("strong[data-qa='client-company-profile-size'] > span").first().text().trim()

        addToResult(out, "company-size", value)
    }*/

    function addMemberSince(out)
    {
        var element = $("li[data-qa='client-contract-date'] > small.text-muted").first()

        var fullText = element.text().trim()
        var valueDate = removeWordsAndTrim(fullText, ['Member since'])
        var value = new Date(valueDate)

        addToResult(out, "member-since", value)
    } 

     function addRatePaid(out) // avg hourly rate paid
    {
        var value = $("strong[data-qa='client-hourly-rate']")
        var valueText =''

        if (value.length>0)
        {
           valueText = $("strong[data-qa='client-hourly-rate']").first().text().split('\n')[1].trim()
        }

        addToResult(out, "client-hourly-rate", valueText)
     }

     function addHourlyRatePaid(out) // avg hourly rate paid- houers
    {
        var value = $("div[data-qa='client-hours'].text-muted").first().text()
        var hourlyRate=0

        if (value.length>0)
        {
            var valueText = value.split('\n')
            var hourlyRateText = valueText[1].trim()
            hourlyRate = Number.parseInt(hourlyRateText)
         }
         addToResult(out, "hourlyRate", hourlyRate)
    }   

     function addPriceTypeTimeLog(out) // hour price
    {
        var timelog = $("div[data-cy='clock-timelog']")
        var minPrice = ''

        if (timelog.length>0)
        {

            var fullText = $($("div[data-cy='clock-timelog']")[0].nextElementSibling)
            var valueStrong = fullText.first().text().trim()

             minPrice = valueStrong.split('-').slice()[0].split('$')[1]

         }

        addToResult(out, "min-Price", minPrice)

    }

    function addPriceTypeTimeLogMax(out) // hour price
    {
        var timelog = $("div[data-cy='clock-timelog']")
        var maxPrice = ''

        if (timelog.length>0)
        {
            var fullText = $($("div[data-cy='clock-timelog']")[0].nextElementSibling)
            var valueStrong = fullText.first().text().trim()

            maxPrice = valueStrong.split('$').slice(-1)[0]

         }
        addToResult(out, "max-Price", maxPrice)
    }

    function addFixedPrice(out) // fixed  price
    {
        var timelog = $("div[data-cy='fixed-price']")
        var fixedPrice =''

        if (timelog.length>0)
        {
            var fullText = $($("div[data-cy='fixed-price']")[0].nextElementSibling)
            var valueStrong = fullText.first().text().trim()
            fixedPrice = valueStrong.split('$')[1]

         }

        addToResult(out, "fixedPrice", fixedPrice)
    }

    function addHourInWeek(out) // Less than nn hrs/week
    {
        var valueStrong =''
        var timeHour = $("div[data-cy='clock-hourly']")

        if (timeHour.length>0)
        {
            var fullText = $($("div[data-cy='clock-hourly']")[0].nextElementSibling)
            valueStrong = fullText.first().text().trim()
        }

        addToResult(out, "hour-in-week", valueStrong)
    }

    function addProjectLength(out)
    {
        var fullText = $("ul[class='cfe-ui-job-features p-0']>li>div>strong>span[class='d-lg-none']")
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
       var Massvalue =$("ul.list-unstyled>li[data-v-3c15e380]")
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
        var MasArray = $("span[slot='reference']>a")
        var skillName
        var skillsTextName =""

      if (MasArray.length>0)
        {
            for (var i=0; i<= MasArray.length-1;i++)
            {
                skillName = MasArray[i].innerText

                if (i<MasArray.length-1)
                {
                    skillsTextName = skillsTextName +""+ skillName+","
                }
                else
                {
                    skillsTextName = skillsTextName +""+ skillName
                }
            }
        }

        addToResult(out, "skills", skillsTextName)
    }

    function addAttachment(out)
    {
        var attachmMass= $("ul.list-unstyled>li>a")
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

        var valueMass = $("div[class='d-lg-none mt-10']>div")
        var valueText

        if(valueMass.length>0)
        {
           valueText = valueMass.first().text().trim().split('Send a proposal for:')[1].split('Connects')[0].trim()
        }


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


    function addButtonPushToCRM()
    {
        //
         var htmlButton_ = getHtmlButton()
        $(".cta-row").prepend(htmlButton_)

      //  $(".cta-row").prepend(htmlButton)
    }

    function renewEventListeners()
    {
        $(".job-tile-title").off('click');
        $(".job-tile-title").on("click", function() { setTimeout(addButtonPushToCRM, 2000) });
    }


    setInterval(renewEventListeners, 2000);
    setTimeout(addButtonPushToCRM, 3000);

    //todo: check via API is job post already pushed
    //todo: test script on job post page
    //todo: upload scriupt to github
})();
