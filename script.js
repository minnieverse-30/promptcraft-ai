/* ==========================================
   PromptCraft AI
   Professional Script
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const category = document.getElementById("prompt-category");
    const goal = document.getElementById("user-goal");

    const generateBtn = document.getElementById("generate-btn");
    const copyBtn = document.getElementById("copy-btn");
    const copyOutputBtn = document.getElementById("copy-builder-btn");
    const clearBtn = document.getElementById("clear-btn");

    const metaCategory = document.getElementById("meta-category");
    const metaWords = document.getElementById("meta-words");
    const metaCharacters = document.getElementById("meta-characters");

    const goalCounter = document.getElementById("goal-counter");

    const downloadTXT = document.getElementById("download-txt-btn");
    const downloadMD = document.getElementById("download-md-btn");

    const themeToggle = document.getElementById("theme-toggle");
    const loading = document.getElementById("loading");
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    const chatContainer = document.getElementById("chat-container");

    // ===============================
    // CHAT FUNCTIONS
    // ===============================

    function addUserMessage(text) {
        const message = document.createElement("div");
        message.className = "user-message";
        message.innerHTML = `
            <div class="message-header">👤 You</div>
            <div class="message-body">${text}</div>
        `;
        chatContainer.appendChild(message);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addAIMessage(text) {
        const message = document.createElement("div");
        message.className = "ai-message";
        message.innerHTML = `
            <div class="message-header">🤖 PromptCraft AI</div>
            <div class="message-body">${marked.parse(text)}</div>
        `;
        chatContainer.appendChild(message);

        message.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightElement(block);
        });

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addTypingMessage() {
        const message = document.createElement("div");
        message.className = "ai-message";
        message.id = "typing-message";
        message.innerHTML = `
            <div class="message-header">🤖 PromptCraft AI</div>
            <div class="message-body">⏳ Typing...</div>
        `;
        chatContainer.appendChild(message);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeTypingMessage() {
        const typing = document.getElementById("typing-message");
        if (typing) {
            typing.remove();
        }
    }

    // ==========================================
    // LOCAL STORAGE
    // ==========================================

    let promptHistory = JSON.parse(localStorage.getItem("promptHistory")) || [];

    // ==========================================
    // PROMPT TEMPLATES
    // ==========================================

    const templates = {
        coding: `You are a Senior Software Engineer.\n\nTask:\n{goal}\n\nRequirements:\n• Think step by step\n• Production-ready code\n• Modern best practices\n• Responsive design\n• Error handling\n• Comments where needed\n\nOutput:\nComplete solution.`,
        writing: `You are a Professional Writer.\n\nTask:\n{goal}\n\nRequirements:\n• Engaging tone\n• Clear headings\n• Proper grammar\n• Well-structured\n• Strong conclusion\n\nOutput:\nProfessional content.`,
        study: `You are an Expert Teacher.\n\nTask:\n{goal}\n\nRequirements:\n• Easy explanation\n• Examples\n• Important points\n• Quiz\n• Summary\n\nOutput:\nComplete lesson.`,
        marketing: `You are a Marketing Strategist.\n\nTask:\n{goal}\n\nRequirements:\n• Target audience\n• Marketing strategy\n• CTA\n• SEO\n• Social media ideas\n\nOutput:\nMarketing plan.`,
        business: `You are a Business Consultant.\n\nTask:\n{goal}\n\nRequirements:\n• SWOT\n• Opportunities\n• Risks\n• Recommendations\n• Action plan\n\nOutput:\nBusiness report.`,
        email: `You are a Professional Email Writer.\n\nTask:\n{goal}\n\nRequirements:\n• Subject\n• Greeting\n• Professional tone\n• Closing\n\nOutput:\nReady-to-send email.`,
        image: `You are an AI Prompt Engineer.\n\nTask:\n{goal}\n\nRequirements:\n• Subject\n• Style\n• Lighting\n• Camera\n• Composition\n• Quality\n• Background\n\nOutput:\nDetailed image prompt.`
    };

    // ==========================================
    // WORD COUNTER
    // ==========================================

    function updateCounter() {
        const text = goal.value.trim();
        const words = text === "" ? 0 : text.split(/\s+/).length;
        const chars = goal.value.length;
        goalCounter.textContent = `${words} words • ${chars} characters`;
    }

    if (goal) goal.addEventListener("input", updateCounter);

    // ==========================================
    // TOAST & LOADING
    // ==========================================

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }

    function showLoading() {
        loading.style.display = "flex";
    }

    function hideLoading() {
        loading.style.display = "none";
    }

    // ==========================================
    // THEME
    // ==========================================

    function loadTheme() {
        const saved = localStorage.getItem("theme");
        if (saved === "light") {
            document.body.classList.add("light-theme");
            themeToggle.textContent = "☀️";
        } else {
            document.body.classList.remove("light-theme");
            themeToggle.textContent = "🌙";
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-theme");
            const light = document.body.classList.contains("light-theme");
            themeToggle.textContent = light ? "☀️" : "🌙";
            localStorage.setItem("theme", light ? "light" : "dark");
            showToast(light ? "Light mode enabled" : "Dark mode enabled");
        });
    }

    loadTheme();
    updateCounter();

    /* ==========================================
       PART 2 - Vercel API & Prompt Generator
    ========================================== */

    async function generateWithGemini(prompt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 15000);

        const url = `/api/generate`;

        try {
            const response = await fetch(url, {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt: prompt })
            });

            clearTimeout(timeout);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Backend API request failed.");
            }

            return data.text;

        } catch (error) {
            clearTimeout(timeout);
            if (error.name === "AbortError") {
                throw new Error("Request timed out. Please try again.");
            }
            throw error;
        }
    }

    async function generatePrompt(e) {
        if (e) e.preventDefault(); // Prevent form submission if inside a form

        const selectedCategory = category.value;
        const userGoal = goal.value.trim();

        if (!selectedCategory) {
            showToast("Please select a category.");
            category.focus();
            return;
        }

        if (!userGoal) {
            showToast("Please describe your goal.");
            goal.focus();
            return;
        }

        const template = templates[selectedCategory];
        const finalPrompt = template.replace("{goal}", userGoal);

        addUserMessage(userGoal);
        addTypingMessage();
        showLoading();
        
        if (generateBtn) generateBtn.disabled = true;

        try {
            const aiResponse = await generateWithGemini(finalPrompt);

            removeTypingMessage();
            addAIMessage(aiResponse);

            metaCategory.textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
            metaWords.textContent = aiResponse.trim().split(/\s+/).length;
            metaCharacters.textContent = aiResponse.length;

            if (copyBtn) copyBtn.disabled = false;
            if (copyOutputBtn) copyOutputBtn.disabled = false;
            if (downloadTXT) downloadTXT.disabled = false;
            if (downloadMD) downloadMD.disabled = false;

            promptHistory.unshift({
                category: selectedCategory,
                goal: userGoal,
                prompt: finalPrompt,
                response: aiResponse
            });

            if (promptHistory.length > 10) promptHistory.pop();
            localStorage.setItem("promptHistory", JSON.stringify(promptHistory));

            showToast("Prompt generated successfully ✨");

        } catch (error) {
            removeTypingMessage();
            addAIMessage(`**Error:** ${error.message}`);
            showToast("Failed to generate prompt.");
        } finally {
            hideLoading();
            if (generateBtn) generateBtn.disabled = false;
            goal.value = ""; 
            updateCounter();
        }
    }

    if (generateBtn) {
        generateBtn.addEventListener("click", generatePrompt);
    }

    /* ==========================================
       PART 3 - Copy, Download & Clear
    ========================================== */

    function getLatestAIResponse() {
        const messages = document.querySelectorAll(".ai-message .message-body");
        if (!messages.length) return "";
        return messages[messages.length - 1].innerText.trim();
    }

    function copyGeneratedPrompt() {
        const text = getLatestAIResponse();
        if (text === "" || text === "Your generated prompt will appear here..." || text === "⏳ Typing...") {
            showToast("Nothing to copy.");
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                showToast("Prompt copied to clipboard 📋");
            })
            .catch(() => {
                showToast("Copy failed.");
            });
    }

    if (copyBtn) copyBtn.addEventListener("click", copyGeneratedPrompt);
    if (copyOutputBtn) copyOutputBtn.addEventListener("click", copyGeneratedPrompt);

    if (downloadTXT) {
        downloadTXT.addEventListener("click", () => {
            const text = getLatestAIResponse();
            if (text === "" || text.includes("⏳ Typing...")) {
                showToast("Generate a prompt first.");
                return;
            }

            const blob = new Blob([text], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "PromptCraft-Prompt.txt";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showToast("TXT downloaded ⬇");
        });
    }

    if (downloadMD) {
        downloadMD.addEventListener("click", () => {
            const text = getLatestAIResponse();
            if (text === "" || text.includes("⏳ Typing...")) {
                showToast("Generate a prompt first.");
                return;
            }

            const blob = new Blob(["# PromptCraft AI\n\n" + text], { type: "text/markdown" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "PromptCraft-Prompt.md";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showToast("Markdown downloaded 📝");
        });
    }

    function clearAll() {
        category.selectedIndex = 0;
        goal.value = "";
        updateCounter();

        chatContainer.innerHTML = `
            <div class="ai-message">
                <div class="message-header">🤖 PromptCraft AI</div>
                <div class="message-body">Welcome! I'm PromptCraft AI. Ask me anything to get started.</div>
            </div>
        `;

        metaCategory.textContent = "—";
        metaWords.textContent = "0";
        metaCharacters.textContent = "0";
        goalCounter.textContent = "0 words • 0 characters";

        if (copyBtn) copyBtn.disabled = true;
        if (copyOutputBtn) copyOutputBtn.disabled = true;
        if (downloadTXT) downloadTXT.disabled = true;
        if (downloadMD) downloadMD.disabled = true;

        showToast("Workspace cleared 🗑");
        goal.focus();
    }

    if (clearBtn) clearBtn.addEventListener("click", clearAll);

    // Disable download initially
    if (downloadTXT) downloadTXT.disabled = true;
    if (downloadMD) downloadMD.disabled = true;

    // Welcome Toast
    setTimeout(() => {
        showToast("Welcome to PromptCraft AI 🚀");
    }, 700);

    /* ==========================================
       PART 4 - Final Enhancements
    ========================================== */

    (function restoreLastPrompt() {
        if (!promptHistory.length) return;
        const last = promptHistory[0];

        chatContainer.innerHTML = `
            <div class="user-message">
                <div class="message-header">👤 You</div>
                <div class="message-body">${last.goal}</div>
            </div>
            <div class="ai-message">
                <div class="message-header">🤖 PromptCraft AI</div>
                <div class="message-body">${marked.parse(last.response || last.prompt)}</div>
            </div>
        `;

        metaCategory.textContent = last.category.charAt(0).toUpperCase() + last.category.slice(1);
        metaWords.textContent = (last.response || last.prompt).trim().split(/\s+/).length;
        metaCharacters.textContent = (last.response || last.prompt).length;

        if (copyBtn) copyBtn.disabled = false;
        if (copyOutputBtn) copyOutputBtn.disabled = false;
        if (downloadTXT) downloadTXT.disabled = false;
        if (downloadMD) downloadMD.disabled = false;
    })();

    // Auto Resize Textarea
    if (goal) {
        goal.addEventListener("input", () => {
            goal.style.height = "auto";
            goal.style.height = goal.scrollHeight + "px";
        });

        // Prevent Empty Spaces
        goal.addEventListener("blur", () => {
            goal.value = goal.value.trim();
        });
    }

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
        // Ctrl + Enter = Generate Prompt
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            generatePrompt();
        }

        // Ctrl + L = Clear
        if (e.ctrlKey && e.key.toLowerCase() === "l") {
            e.preventDefault();
            clearAll();
        }

        // Ctrl + Shift + C = Copy
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
            e.preventDefault();
            copyGeneratedPrompt();
        }
    });

    // Smooth Button Animation
    document.querySelectorAll(".btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.animate([
                { transform: "scale(1)" },
                { transform: "scale(.96)" },
                { transform: "scale(1)" }
            ], { duration: 180 });
        });
    });

    // Footer Year
    const yearElement = document.querySelector(".footer-bottom p");
    if (yearElement) {
        yearElement.innerHTML = `© ${new Date().getFullYear()} PromptCraft AI. All rights reserved.`;
    }

    hideLoading();
    console.log("PromptCraft AI Loaded Successfully 🚀");
});
