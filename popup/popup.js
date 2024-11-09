document.addEventListener('DOMContentLoaded', () => {
    const extractButton = document.getElementById('extract');
    const selectedTextButton = document.getElementById('selectedTextButton');
    const outputField = document.getElementById('output');
    const generateButton = document.getElementById('generate');
    const loadingScreen = document.getElementById('loading');
    const copyButton = document.getElementById('copyButton');

    const languageSelect = document.getElementById('language');
    const contentTypeSelect = document.getElementById('contentType');

    const imageContainer = document.getElementById('imageContainer');

    let geminiApiKey, googleApiKey, searchEngineId;

    fetch('./../config.json')
        .then(response => response.json())
        .then(config => {
            geminiApiKey = config.GEMINI_API_KEY;
            googleApiKey = config.GOOGLE_API_KEY;
            searchEngineId = config.CUSTOM_SEARCH_ENGINE_ID;

            chrome.storage.local.set({
                GEMINI_API_KEY: geminiApiKey,
                GOOGLE_API_KEY: googleApiKey,
                CUSTOM_SEARCH_ENGINE_ID: searchEngineId
            }, () => {
                console.log('Claves almacenadas en storage');
            });
        })
        .catch(error => {
            console.error('Error cargando el archivo JSON:', error);
        });

    const showLoading = () => {
        loadingScreen.style.display = 'flex';
    }

    const hideLoading = () => {
        loadingScreen.style.display = 'none';
    }

    extractButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'extractText' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.text) {
                    outputField.value = response.text;
                } else {
                    console.error('No response or text found.');
                }
            });
        });
    });

    selectedTextButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.text) {
                    outputField.value = response.text;
                } else {
                    console.error('No response or text found.');
                }
            });
        });
    });

    generateButton.addEventListener('click', async () => {
        const inputText = outputField.value;

        const language = languageSelect.value;
        const contentType = contentTypeSelect.value;
        
        if (inputText) {
           
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
            
            const instruction = `Genera un ${contentType} en ${language} sobre el siguiente tema. Asegúrate de que el contenido sea informativo, fluido y natural, como si fuera escrito por una persona real. No incluyas etiquetas HTML y no menciones que es un hilo. Aquí está el tema:`;

            showLoading(); 

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: `${instruction} ${inputText}` },
                                ]
                            }
                        ]
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const contentFiltered = data.candidates[0].content.parts[0].text;
                    outputField.value = contentFiltered;

                    const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(inputText)}&searchType=image&key=${googleApiKey}&cx=${searchEngineId}&num=5`;

                    const googleResponse = await fetch(googleSearchUrl);

                    if (googleResponse.ok) {
                        const googleData = await googleResponse.json();
                        console.log(googleData);    
                        if (googleData.items && googleData.items.length > 0) {
                            const imageUrls = googleData.items.map(item => item.link);
                            showImageGallery(imageUrls);  
                        } else {
                            console.error('No se encontraron imágenes.');
                        }
                    } else {
                        console.error('Error en la búsqueda de Google:', googleResponse.status);
                    }

                } else {
                    console.error('Error:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                hideLoading(); 
            }
        }
    });

    const showImageGallery = (imageUrls) => {
        imageContainer.innerHTML = '';
    
        imageUrls.forEach((imageUrl) => {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = 'Imagen relacionada';
            imageContainer.appendChild(imgElement);
        });
    };

    copyButton.addEventListener('click', () => {
        outputField.select();
        document.execCommand('copy');
        alert('Texto copiado ');
    });
});
