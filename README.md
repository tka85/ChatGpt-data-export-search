# Search all your ChatGPT conversations

ChatGPT search is notoriously poor. The monolithic `chat.html` of a ChatGPT data export becomes impossible to handle when the file gets too large.

This is a webapp you can run locally and do text searches on your ChatGPT data export. 

It does pre-processing that breaks down the monolithic `chat.html` into one file per conversation. 

Then you get a locally served page that offers a simple text search over all conversations.

## Requirements

Installed `npm` and a a websrever running 

## How to run

1. Get a data export from ChatGPT Settings and unpack the `.zip` locally. Let's assume ZIP contents are under `/tmp/CHATGPT`. There should be a file in there `chat.html`.
   
2. Run the parser to split this `chat.html` into multiple files.
```
npx tsx parse.ts /tmp/CHATGPT/chat.html
```

This will generate one HTML and one JSON file per conversation under `chats/` . The file name is the title of the conversation.

3. Start a local HTTP server that can serve the project folder's files locall:
   
```
python3 -m http.server 8000
```

4. Open browser at `http://localhost:8000/search.html`.

You can also load directly a search e.g. `http://localhost:8000/search.html?q=lion+battery` and browser will populate the search field and show the results.