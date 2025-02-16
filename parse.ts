import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { marked } from 'marked';

async function generateIndex(outputDir: string) {
    try {
        const files = fs.readdirSync(outputDir)
            .filter(file => file.endsWith(".html"));

        const indexFile = path.join(outputDir, "index.json");
        fs.writeJsonSync(indexFile, files, { spaces: 2 });

        console.log(`Index generated: ${indexFile}`);
    } catch (error) {
        console.error("Error generating index:", error);
    }
}

const inputFile = process.argv[2];
if (!inputFile) {
    console.error('Usage: tsx parser.tsx <path-to-chat.html>');
    process.exit(1);
}

const outputDir = 'chats';
fs.ensureDirSync(outputDir);
const tempJsonFile = path.join(os.tmpdir(), 'extracted_json.json');

// Read input file
const rawData = fs.readFileSync(inputFile, 'utf-8');

// Define delimiters
const startJsonDelimiter = 'var jsonData = [';
const endJsonDelimiter = 'var assetsJson = {"file-service';

const startJsonIndex = rawData.indexOf(startJsonDelimiter);
const endJsonIndex = rawData.indexOf(endJsonDelimiter, startJsonIndex);

if (startJsonIndex === -1 || endJsonIndex === -1) {
    console.error('Error: Could not locate jsonData block in chat.html.');
    process.exit(1);
}

const snippetA = rawData.substring(0, startJsonIndex + startJsonDelimiter.length);
const snippetB = rawData.substring(endJsonIndex);

let jsonContent = rawData.substring(startJsonIndex + startJsonDelimiter.length, endJsonIndex).trim();
if (!jsonContent.startsWith('[')) jsonContent = '[' + jsonContent;
if (!jsonContent.endsWith(']')) jsonContent += ']';

jsonContent = jsonContent.replace(/;\s*$/, '');
fs.writeFileSync(tempJsonFile, jsonContent, 'utf-8');

console.log(`Extracted JSON saved temporarily to: ${tempJsonFile}`);

let conversations: any[] = [];
try {
    conversations = JSON.parse(jsonContent);
} catch (error) {
    console.error('JSON parsing error:', error.message);
    process.exit(1);
}

conversations.forEach((conv, index) => {
    if (!conv.title) {
        console.warn(`Skipping conversation ${index} (missing title)`);
        return;
    }

    const baseFileName = conv.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 100);
    const jsonFilePath = path.join(outputDir, `${baseFileName}.json`);
    const htmlFilePath = path.join(outputDir, `${baseFileName}.html`);

    // Save JSON for each conversation
    try {
        fs.writeJsonSync(jsonFilePath, conv, { spaces: 2 });
        console.log(`📁 Saved JSON: ${jsonFilePath}`);
    } catch (writeError) {
        console.error(`Error writing JSON file ${jsonFilePath}:`, writeError.message);
    }

    let htmlBody = `<div class="chat-container">\n`;

    for (const messageId in conv.mapping) {
        const messageData = conv.mapping[messageId]?.message;
        if (!messageData || !messageData.content?.parts) continue;

        const role = messageData.author.role;

        // Extract only text parts & ignore objects (like image references)
        let content = messageData.content.parts
            .map(part => typeof part === "string" ? part : "")
            .join("\n")
            .trim();

        // Check if the message has an image attachment
        let imageHtml = "";
        if (messageData.metadata?.attachments) {
            messageData.metadata.attachments.forEach(attachment => {
                if (attachment.mime_type && attachment.mime_type.startsWith("image/")) {
                    imageHtml += `
                <div class="attachment">
                    <img src="file-service://${attachment.id}" alt="${attachment.name}" width="300">
                    <p><i>${attachment.name} (${Math.round(attachment.size / 1024)} KB)</i></p>
                </div>`;
                }
            });
        }

        // **Skip irrelevant messages**
        if (role === "system" && content === "" && imageHtml === "") continue;
        if (content === "" && (role === "assistant" || role === "tool")) continue;
        if (messageData.metadata?.is_visually_hidden_from_conversation) continue;
        if (role === "tool") continue;

        // Convert markdown
        content = marked(content);

        htmlBody += `
    <div class="message ${role}">
        <div class="author">${role}</div>
        <div class="content">${content}${imageHtml}</div>
    </div>\n`;
    }

    htmlBody += `</div>\n`;

    const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${conv.title}</title>
    <style>
        :root {    --bg-color: #f9f9f9;    --text-color: #000;    --message-bg-user: #fff3e0;    --message-bg-assistant: #e3f2fd;    --highlight-pink: pink;    --highlight-green: lightgreen; }
        .dark-mode {    --bg-color: #1e1e1e;    --text-color: #ffffff;    --message-bg-user: #5a5a5a;    --message-bg-assistant: #2a2a2a;    --highlight-pink: #ff79c6;    --highlight-green: #50fa7b; }
        body {    font-family: Inter, Arial, Helvetica, sans-serif;    background-color: var(--bg-color);    color: var(--text-color);    padding: 5px; }
        h1 {    text-align: center; }
        .chat-container {    max-width: 800px;    margin: auto;    padding: 5px;    background: var(--bg-color);    border-radius: 8px;    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
        .message {    padding: 5px;    margin: 5px 0;    border-radius: 8px; }
        .author {    font-weight: bold;    margin-bottom: 5px; }
        .content {    white-space: pre-wrap; }
        .user {    background: var(--message-bg-user);    padding: 5px;    border-radius: 8px; }
        .assistant {    background: var(--message-bg-assistant);    padding: 5px;    border-radius: 8px; }
        #darkModeToggle {    position: fixed;    top: 10px;    right: 10px;    padding: 8px 12px;    font-size: 14px;    background: #007bff;    color: white;    border: none;    border-radius: 5px;    cursor: pointer; }
        #darkModeToggle:hover {    background: #0056b3; }    
        .highlight-pink {    background-color: pink;    color: black;    font-weight: bold;    padding: 2px;    border-radius: 3px; }
        .highlight-green {    background-color: lightgreen;    color: black;    font-weight: bold;    padding: 2px;    border-radius: 3px; }
    </style>
</head>
<body>
    <h1>${conv.title}</h1>
    <button id="darkModeToggle">🌙 Dark Mode</button>
    ${htmlBody}
    <script src="../conversation.js"></script> <!-- Ensures conversation.js is loaded -->
</body>
</html>`;


    try {
        fs.writeFileSync(htmlFilePath, finalHtml, 'utf-8');
        console.log(`📄 Saved HTML: ${htmlFilePath}`);
    } catch (writeError) {
        console.error(`Error writing HTML file ${htmlFilePath}:`, writeError.message);
    }
});

fs.unlinkSync(tempJsonFile);
console.log(`🗑️ Deleted temporary file: ${tempJsonFile}`);
generateIndex(outputDir);
console.log('🎉 Export completed.');
