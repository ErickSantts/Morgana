console.log("Backgound rodando")
/* chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab, status){
    console.log('passando url updated')
    buttonClicked()
}) */

/* chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
    chrome.local.storage.get('URLs', function(URL's) {
            // Iterate through this list here and match with tab.url, if the match is found, just return.
            if (url is there in list) {return;}
            else {
                alert("tab load complete");
                chrome.local.set({URLs: [tab.url]}); 
            }
        });
  }) */


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.title != -1 && changeInfo.status == 'complete' && tab != -1 && tab.status == 'complete') {
        buttonClicked() 
    }
  })

chrome.tabs.onCreated.addListener(function(tab, changeInfo) {     
        buttonClicked() 
        console.log('passando url created')

})

function buttonClicked(tabs){
    let params = {
         active: true,
         currentWindow: true
    }
    chrome.tabs.query(params, gotTabs)
    console.log('passando url')
    function gotTabs(tabs){
        console.log(tabs[0].url)
        let msg ={
            txt: tabs[0].url
        }
        chrome.tabs.sendMessage(tabs[0].id, msg)
    } 
}

window.addEventListener('popstate', function(e) {
    console.log('A pagina foi atualizada')
 })