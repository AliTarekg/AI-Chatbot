📝 Full Prompt (Offline-Only)

Build me a Node.js project that runs an AI chatbot using the deepseek-r1:8b model locally (via Ollama) with RAG for company data.

🔹 Requirements
1. Model Setup (Offline with Ollama)

Use Ollama to run deepseek-r1:8b locally.

Ensure it runs fully offline.

Model should be queried via ollama Node.js bindings or HTTP API.

2. Server (Node.js + Express)

Create an Express server (server.js) exposing a /chat endpoint.

The endpoint should:

Take user input.

Search RAG knowledge base for relevant info.

Inject retrieved chunks into DeepSeek prompt.

Return the model’s answer as JSON.

3. RAG (Retrieval Augmented Generation)

Store company documents inside a /data folder:

company_overview.txt

products.txt

services.txt

policies.txt

faqs.txt

contacts.txt

courses.txt

Implement a pipeline using LangChain or LlamaIndex with Ollama embeddings.

Save embeddings in a local vector DB (ChromaDB or FAISS).

On each query:

Retrieve top-k relevant chunks.

Inject them into the system prompt before asking DeepSeek.

4. Frontend (HTML + JS UI)

Create index.html with:

A text input for user queries.

A "Send" button.

A chat area showing user messages + bot responses.

Use fetch('/chat') to send user queries and render responses dynamically.

Keep design simple but clean (basic CSS).

5. Conversation Flow

User asks a question.

Bot searches company data (RAG).

If found → answer directly from data.

If not found → fallback to model’s general knowledge.

Responses must sound professional and contextual.

6. Project Structure
/chatbot
  ├── server.js
  ├── rag.js
  ├── index.html
  ├── package.json
  └── data/
      ├── company_overview.txt
      ├── products.txt
      ├── services.txt
      ├── policies.txt
      ├── faqs.txt
      ├── contacts.txt
      └── courses.txt

7. Example Interactions

Q: “What’s the refund policy?”
→ Answer from policies.txt.

Q: “What courses do you offer and their prices?”
→ Answer from courses.txt.

Q: “What services does the company provide?”
→ Answer from services.txt.

8. Technical Notes

Use dotenv for configuration.

Use modular code:

rag.js for RAG logic.

server.js for API and DeepSeek integration.

Ensure all dependencies are in package.json.
