/*
Async version of the background script
*/
const urlsList = [
  "https://medium.com/*",
  "https://towardsdatascience.com/*",
  "https://hackernoon.com/*",
  "https://medium.freecodecamp.org/*",
  "https://psiloveyou.xyz/*",
  "https://betterhumans.coach.me/*",
  "https://codeburst.io/*",
  "https://theascent.pub/*",
  "https://*.medium.com/*",
  "https://medium.mybridge.co/*",
  "https://uxdesign.cc/*",
  "https://levelup.gitconnected.com/*",
  "https://itnext.io/*",
  "https://entrepreneurshandbook.co/*",
  "https://proandroiddev.com/*",
  "https://blog.prototypr.io/*",
  "https://thebolditalic.com/*",
  "https://blog.usejournal.com/*",
  "https://blog.angularindepth.com/*",
  "https://blog.bitsrc.io/*",
  "https://blog.devartis.com/*",
  "https://blog.maddevs.io/*",
  "https://blog.getambassador.io/*",
  "https://uxplanet.org/*",
  "https://instagram-engineering.com/*",
  "https://calia.me/*",
  "https://productcoalition.com/*",
  "https://engineering.opsgenie.com/*",
  "https://android.jlelse.eu/*",
  "https://robinhood.engineering/*",
  "https://blog.hipolabs.com/*",
  "https://ux.shopify.com/*",
  "https://engineering.talkdesk.com/*",
  "https://blog.codegiant.io/*",
  "https://tech.olx.com/*",
  "https://netflixtechblog.com/*",
  "https://hackingandslacking.com/*",
  "https://blog.kotlin-academy.com/*",
  "https://blog.securityevaluators.com/*",
  "https://blog.kubernauts.io/*",
  "https://blog.coffeeapplied.com/*",
  "https://unbounded.io/*",
  "https://writingcooperative.com/*",
  "https://*.plainenglish.io/*",
  "https://*.betterprogramming.pub/*",
  "https://blog.doit-intl.com/*",
  "https://eand.co/*",
  "https://techuisite.com/*",
  "https://levelupprogramming.net/*",
  "https://betterhumans.pub/*",
  "https://betterprogramming.pub/*",
  "https://pub.towardsai.net/*",
  "https://bettermarketing.pub/*",
  "https://themakingofamillionaire.com/*",
  "https://medium.datadriveninvestor.com/*",
  "https://bootcamp.uxdesign.cc/*",
  "https://*.baos.pub/*",
  "https://www.inbitcoinwetrust.net/*",
  "https://blog.prototypr.io/*",
  "https://blog.devgenius.io/*",
];

// List url and mirrors:
const mirrors = [
  "https://freedium.cfd/",
  "https://freedium-mirror.vercel.app/",
  "https://freedium-miror-saqg.vercel.app/",
];

// Create a promisified version of the asynchronous operation
function checkUrl(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false); // synchronous
    // Add cor headers
    xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        resolve({ url: url, status: xhr.status }); // Resolve with the URL and its status
      }
    };
    xhr.send();
  });
}

async function checkAllUrls(details) {
  const statusArray = await Promise.all(
    mirrors.map(async (mirror) => {
      const redirectUrl = mirror + details.url.replace("https://", "https:/");
      return checkUrl(redirectUrl);
      // return status;
    })
  );
}

// Event handler for onBeforeRequest and onUpdated
function requestHandler(details) {
  if (details.method !== "GET") {
    return { cancel: false }; // Don't redirect
  }
  let statusArray = [];
  checkAllUrls(details).then((results) => {
    statusArray = results;
  });
  // Example logging the status array
  console.log(statusArray);

  // Now you can process the statusArray as needed

  // For example, checking if any mirror responded with status 200
  const isFound = statusArray.some(({ status }) => status === 200);
  console.log(isFound);
  if (isFound) {
    let redirectUrl = statusArray.find(({ status }) => status === 200).url;
    // console.log(redirectUrl);
    return {
      redirectUrl,
    }; // Redirect to the first mirror that responded with status 200
  } else {
    return { cancel: false }; // Don't redirect
  }
}

// Add event listener for onBeforeRequest
chrome.webRequest.onBeforeRequest.addListener(
  requestHandler,
  {
    urls: urlsList,
    types: ["main_frame"],
  },
  ["blocking"]
);
function urlMatchesPattern(url, pattern) {
  const regexPattern = pattern
    .replace(/\./g, "\\.") // Escape dots
    .replace(/\*/g, ".*"); // Replace wildcard with regex pattern

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  const url = changeInfo.url;

  const matches = urlsList.some((pattern) => urlMatchesPattern(url, pattern));

  if (!matches) {
    return;
  }

  // Check each mirror asynchronously
  const isFound = await Promise.all(
    mirrors.map(async (mirror) => {
      const redirectUrl =
        mirror + changeInfo.url.replace("https://", "https:/");
      return await checkUrl(redirectUrl);
    })
  ).then((results) => results.some((result) => result));

  if (isFound) {
    chrome.tabs.reload(tabId);
  }
});
