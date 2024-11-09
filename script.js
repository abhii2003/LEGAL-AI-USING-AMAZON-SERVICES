// AWS and OpenAI Configuration
AWS.config.update({
    accessKeyId: 'your id',
    secretAccessKey: 'your access key',
    region: 'us-east-1', // Use the region where Polly and Comprehend are available
});

async function generateDocumentWithHuggingFace() {
    const input = document.getElementById('doc-input').value;
    const promptMessage = `
    Generate a formal legal document based on the following details:
    ${input}

    Please generate a formal legal document for filing a lawsuit for fraud, including all necessary legal sections such as the introduction, allegations, claim, and remedies.
    `;

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
            method: "POST",
            headers: {
                "Authorization": `Bearer your_secret_key`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: promptMessage }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error}`);
        }

        const data = await response.json();
        document.getElementById('doc-output').innerText = data[0].generated_text;
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('doc-output').innerText = "Failed to generate document.";
    }
}



//key phrases extractor using amazon comprehend 
async function simplifyLanguage() {
    const input = document.getElementById('simplify-input').value;
    const comprehend = new AWS.Comprehend();

    try {
        // Remove LanguageCode from `batchDetectDominantLanguage` params
        const params = { TextList: [input] };
        const langData = await comprehend.batchDetectDominantLanguage(params).promise();

        // Retrieve detected language code
        const detectedLanguage = langData.ResultList[0].Languages[0].LanguageCode;

        // Now detect key phrases using the detected language
        const phraseParams = { Text: input, LanguageCode: detectedLanguage };
        const phrasesData = await comprehend.detectKeyPhrases(phraseParams).promise();
        const keyPhrases = phrasesData.KeyPhrases.map(phrase => phrase.Text).join(', ');

        document.getElementById('simplify-output').innerText = `Key phrases: ${keyPhrases}`;
    } catch (error) {
        console.error('Comprehend error:', error);
    }
}


// Language Translation using Amazon Translate
async function translateText() {
    const input = document.getElementById('translate-input').value;
    const targetLanguage = document.getElementById('language-dropdown').value; // e.g., 'es' for Spanish, 'fr' for French, etc.

    const translate = new AWS.Translate();

    try {
        const params = {
            Text: input,
            SourceLanguageCode: 'auto', // Automatically detect the source language
            TargetLanguageCode: targetLanguage, // Target language code (e.g., 'es' for Spanish, 'fr' for French)
        };

        const data = await translate.translateText(params).promise();
        document.getElementById('translate-output').innerText = data.TranslatedText;
    } catch (error) {
        console.error('Amazon Translate error:', error);
    }
}


// Text-to-Speech using Amazon Polly
async function textToSpeechPolly() {
    const input = document.getElementById('tts-input').value;
    const polly = new AWS.Polly();
    const params = {
        Text: input,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna', // Available Polly voices: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
    };

    try {
        const data = await polly.synthesizeSpeech(params).promise();
        const audioBlob = new Blob([data.AudioStream], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error('Polly error:', error);
    }
}