1. Get data export from ChatGPT and unpack locally. Let's assume exported `.zip ` file contents are under `/tmp/CHATGPT`. There should be a file in there `chat.html`.
2. Run the parser to split this `chat.html` into multiple files.
```
npx tsx parse.ts /tmp/CHATGPT/chat.html
```
This will generate one HTML and one JSON file per conversation under `chats/` . The filename is the title of the conversation.

3. Start a local HTTP server
```
python3 -m http.server 8000
```
4. Open browser at `http://localhost:8000/search.html`. Type a search text. You'll get as search results links to files that contain the text.