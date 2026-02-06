# #1 
```curl
curl --request POST \
  --url http://localhost:3002/docs/upload \
  --header 'content-type: multipart/form-data' \
  --header 'x-employee-id: emp_9' \
  --header 'x-org-id: org_1' \
  --header 'x-proxy-secret: devsecret' \
  --header 'x-roles: employee' \
  --form file=@/run/user/1000/doc/9e524938/news-article-doc.docx \
  --form kind=cv
```
# #2
```curl
curl --request GET \
  --url 'http://localhost:3002/ai/chat/stream?text=What%20skills%20should%20I%20build%20to%20move%20toward%20Solutions%20Architect%3F' \
  --header 'x-employee-id: emp_9' \
  --header 'x-org-id: org_1' \
  --header 'x-proxy-secret: devsecret' \
  --header 'x-roles: employee'
```


`.env`
```
PORT=3002
NODE_ENV=development
LOG_LEVEL=debug

# Mongo
MONGO_URL=mongodb://localhost:27017
MONGO_DB=bigbrain

# Local LLM (https://lmstudio.ai/download?os=linux, i chose whatever model was available, your mileage mat vary)
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=google/gemma-3-4b
LLM_EMBED_MODEL=google/gemma-3-4b

# LLM auth/config requirements (whatever sonfigs i'll need later on, they always sneak up on me )
LLM_USERNAME=localuser
LLM_PASSWORD=localpass
LLM_API_KEY=localkey
LLM_API_VERSION=2026-01-01

# Proxy trust (SHHHHHHHHHHHHHHHHHHHH lol)
PROXY_SHARED_SECRET=devsecret

# Uploads
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=20

# RAG (For testing locally, this is false to avoid needing a vector DB and LLM responses)
# (In production, you would set this to true and ensure your RetrieverService is properly implemented to fetch relevant context)
# (Local LLM required though for testing :p - you can set up something like Gemma or Mistral locally and point LLM_BASE_URL to it)
RAG_ENABLED=false
```
