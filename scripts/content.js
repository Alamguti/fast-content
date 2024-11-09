chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractText') {
        const mainContentSelectors = [
            'article',  
            'main',     
            '.content',
            '#content'  
        ];
        
        let bodyText = '';
        
        mainContentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                bodyText += element.innerText + '\n';
            });
        });
        
        if (bodyText.trim() === '') {
            bodyText = document.body.innerText;
        }
        
        sendResponse({ text: bodyText });
    } else if (request.action === 'getSelectedText') {
        const selectedText = window.getSelection().toString();
        sendResponse({ text: selectedText });
    }
});
