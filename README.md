### Backend

1. Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install the Python dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```
3. Ensure your Ollama/LLM service is running (default expects `http://localhost:11434`).
4. Start the Flask server:

   ```bash
   python backend/app.py
   ```
   The API will be available on [http://localhost:5050](http://localhost:5050). A local SQLite database (`lifeXP.db`) is created automatically.

### Frontend

1. Install npm packages:

   ```bash
   npm install
   ```
2. Launch the development server:

   ```bash
   npm run dev
   ```
   Vite serves the React app on [http://localhost:4000](http://localhost:4000).
