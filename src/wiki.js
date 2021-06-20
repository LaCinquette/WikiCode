const axios = require('axios').default;
const stripHtml = require("string-strip-html").stripHtml;
const scrape = require('website-scraper');
const nodePath = require('path');

const wikiURL = "https://en.wikipedia.org/w/api.php";

//////////////////////////////////////////////////////////////////////////////////////
function formRequestURL(params){
    var requestURL = wikiURL + "?";
    Object.keys(params).forEach(function(key){requestURL += key + "=" + encodeURI(params[key]) + "&";});
    requestURL = requestURL.substring(0, requestURL.length - 1)
    return requestURL;
}

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

//////////////////////////////////////////////////////////////////////////////////////
async function requestSearch(params){
    var requestURL = formRequestURL(params)

    let result = await axios.get(requestURL)

    var resultsList = []

    result.data['query']['search'].forEach(article => {
        article['snippet'] = stripHtml(article['snippet']).result //.replace(/{\s*\\\s*displaystyle(?:[^}]|\\})*}/g, ""); // strip html, then remove (example): { \     displaystyle s\}s \} dfsdfs }
        resultsList.push({
            pageid: article['pageid'],
            title: article['title'],
            snippet: article['snippet']
        })
    })

    return resultsList
};

async function requestGetLoginToken(params){
    var requestURL = formRequestURL(params)
    
    let result = await axios.get(requestURL) 
    
    return result.data['query']['tokens']['logintoken']
};

class MyPlugin {
    apply(registerAction) {
        registerAction('afterFinish', async () => {});
        registerAction('error', async ({error}) => {console.error(error)});
    }
}

async function downloadWikiPage(page, path){
    if(validURL(page)){
        if(/\/\/.*wikipedia\.org\/wiki\/.+/){
            var wikiSavePath = nodePath.join(path, 'WikiCodeDownloads', /\/\/.*wikipedia\.org\/wiki\/(.+)/.exec(page)[1])
            wikiSavePath = wikiSavePath.replace(/\\/, "")
            wikiSavePath = wikiSavePath.replace(/\\/g, "/")
            //wikiSavePath = wikiSavePath.replace(/^([a-z])/, function(v) { return v.toUpperCase(); });
            console.log(wikiSavePath)
            var result = await scrape({
                urls: [page],
                directory: wikiSavePath 
            })
            return "Succesful"
        }
        else{
            return 'Not a wiki page'
        }
    }
}

module.exports = {
	requestSearch,
    requestGetLoginToken,
    downloadWikiPage
}