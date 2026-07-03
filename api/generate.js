export default async function handler(req, res) {
    // 1. Only allow POST requests for this endpoint
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    // 2. Validate that a prompt was sent
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // 3. Access the secure API key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is not configured on the server.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        // 4. Make the secure fetch call from the server
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Gemini API request failed.");
        }

        if (!data.candidates || !data.candidates.length || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error("No response received from Gemini.");
        }

        // 5. Send just the text back to the frontend
        const text = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
