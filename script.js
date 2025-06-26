AWS.config.update({
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    region: 'us-east-1',
});

const HF_API_TOKEN = 'YOUR_HF_API_TOKEN';

async function generateDocumentWithHuggingFace() {
    const input = document.getElementById('doc-input').value;
    const outputDiv = document.getElementById('doc-output');
    outputDiv.innerText = 'Generating document... Please wait.';

    if (!input.trim()) {
        outputDiv.innerText = 'Please enter details to generate a document.';
        return;
    }

    const promptMessage = `
Generate a formal legal document based on the following details:
${input}

Please generate a formal legal document including relevant sections.
`;

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: promptMessage, parameters: { max_new_tokens: 500 } }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            outputDiv.innerText = `API Error: ${errorData.error || response.statusText}`;
            return;
        }

        const data = await response.json();

        if (data && data[0] && data[0].generated_text) {
            let generatedText = data[0].generated_text;
            if (generatedText.startsWith(promptMessage.trim())) {
                generatedText = generatedText.substring(promptMessage.trim().length).trim();
            }
            outputDiv.innerText = generatedText;
        } else {
            outputDiv.innerText = "Failed to generate document: Unexpected API response format.";
        }

    } catch (error) {
        outputDiv.innerText = `Failed to generate document. Error: ${error.message}`;
    }
}

async function simplifyLanguage() {
    const input = document.getElementById('simplify-input').value;
    const outputDiv = document.getElementById('simplify-output');
    outputDiv.innerText = 'Extracting key phrases... Please wait.';

    if (!input.trim()) {
        outputDiv.innerText = 'Please enter text to extract key phrases.';
        return;
    }

    const comprehend = new AWS.Comprehend();

    try {
        const langParams = { TextList: [input.substring(0, Math.min(input.length, 1000))] };
        const langData = await comprehend.batchDetectDominantLanguage(langParams).promise();

        let detectedLanguage = 'en';
        const supportedLanguages = ['ar', 'hi', 'ko', 'zh-TW', 'ja', 'zh', 'de', 'fr', 'en', 'es', 'it', 'pt', 'ru'];
        let langDetected = false;

        if (langData.ResultList && langData.ResultList.length > 0 && langData.ResultList[0].Languages && langData.ResultList[0].Languages.length > 0) {
            const primaryLanguage = langData.ResultList[0].Languages[0].LanguageCode;
            if (supportedLanguages.includes(primaryLanguage)) {
                detectedLanguage = primaryLanguage;
                langDetected = true;
            }
        }

        if (!langDetected && input.trim().length > 0 && !supportedLanguages.includes(detectedLanguage)) {
            outputDiv.innerText = `Detected language is not supported for key phrase extraction.`;
            return;
        }

        const phraseParams = {
            Text: input.substring(0, Math.min(input.length, 5000)),
            LanguageCode: detectedLanguage
        };

        const phrasesData = await comprehend.detectKeyPhrases(phraseParams).promise();

        if (phrasesData.KeyPhrases && phrasesData.KeyPhrases.length > 0) {
            const keyPhrases = phrasesData.KeyPhrases.map(phrase => phrase.Text).join(', ');
            outputDiv.innerText = `Key phrases: ${keyPhrases}`;
        } else {
            outputDiv.innerText = 'No key phrases detected.';
        }

    } catch (error) {
        outputDiv.innerText = `Failed to extract key phrases. Error: ${error.message}`;
    }
}

async function translateText() {
    const input = document.getElementById('translate-input').value;
    const targetLanguage = document.getElementById('language-dropdown').value;
    const outputDiv = document.getElementById('translate-output');
    outputDiv.innerText = `Translating to ${targetLanguage}... Please wait.`;

    if (!input.trim()) {
        outputDiv.innerText = 'Please enter text to translate.';
        return;
    }

    const translate = new AWS.Translate();

    try {
        const params = {
            Text: input.substring(0, Math.min(input.length, 5000)),
            SourceLanguageCode: 'auto',
            TargetLanguageCode: targetLanguage,
        };

        const data = await translate.translateText(params).promise();

        if (data && data.TranslatedText) {
            outputDiv.innerText = data.TranslatedText;
        } else {
            outputDiv.innerText = "Failed to translate text: Unexpected API response.";
        }

    } catch (error) {
        outputDiv.innerText = `Failed to translate text. Error: ${error.message}`;
    }
}

async function textToSpeechPolly() {
    const input = document.getElementById('tts-input').value;

    if (!input.trim()) {
        alert('Please enter text to speak.');
        return;
    }

    const polly = new AWS.Polly();
    const voiceId = 'Joanna';

    const params = {
        Text: input.substring(0, Math.min(input.length, 1500)),
        OutputFormat: 'mp3',
        VoiceId: voiceId,
    };

    try {
        const data = await polly.synthesizeSpeech(params).promise();

        if (data && data.AudioStream) {
            const audioBlob = new Blob([data.AudioStream], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
        } else {
            alert("Failed to get audio stream from Polly.");
        }

    } catch (error) {
        alert(`Failed to synthesize speech. Error: ${error.message}`);
    }
}

function initializeParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;

    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#ffffff" },
            "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } },
            "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } },
            "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } },
            "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
            "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "source": {}, "sync": false } }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
            "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } }
        },
        "retina_detect": true
    });
}

function activateTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.classList.remove('text-secondary', 'border-secondary');
        button.classList.add('text-gray-400', 'border-transparent');
    });
    tabPanels.forEach(panel => {
        panel.classList.add('hidden');
    });

    const activeButton = document.querySelector(`.tab-button[data-target-tab="${tabId}"]`);
    const activePanel = document.querySelector(tabId);

    if (activeButton && activePanel) {
        activeButton.classList.add('text-secondary', 'border-secondary');
        activeButton.classList.remove('text-gray-400', 'border-transparent');
        activePanel.classList.remove('hidden');
    } else {
        if (tabButtons.length > 0 && tabPanels.length > 0) {
            activateTab(tabButtons[0].getAttribute('data-target-tab'));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.getAttribute('data-target-tab');
            if (targetTabId) {
                activateTab(targetTabId);
            }
        });
    });

    const initialHash = window.location.hash;
    const validToolHashes = Array.from(tabButtons).map(btn => btn.getAttribute('data-target-tab'));

    if (initialHash && validToolHashes.includes(initialHash)) {
        activateTab(initialHash);
        document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
    } else {
        if (tabButtons.length > 0) {
            activateTab(tabButtons[0].getAttribute('data-target-tab'));
        }
    }

    initializeParticles();

    const aboutCardTriggers = document.querySelectorAll('.tab-trigger');
    aboutCardTriggers.forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault();
            const targetTabId = card.getAttribute('data-target-tab');
            if (targetTabId) {
                activateTab(targetTabId);
                document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

window.addEventListener('hashchange', () => {
    const newHash = window.location.hash;
    const validToolHashes = Array.from(document.querySelectorAll('.tab-button')).map(btn => btn.getAttribute('data-target-tab'));
    if (newHash && validToolHashes.includes(newHash)) {
        activateTab(newHash);
        document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
    }
});
