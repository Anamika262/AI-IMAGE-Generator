const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const modelSelect = document.querySelector("#model-select");
const ratioSelect = document.querySelector("#ratio-select");
const countSelect = document.querySelector("#count-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against the red mountain"
];

// Calculate valid image dimensions
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [w, h] = aspectRatio.split("/").map(Number);
  const scale = baseSize / Math.max(w, h);
  const width = Math.round((w * scale) / 16) * 16;
  const height = Math.round((h * scale) / 16) * 16;
  return { width, height };
};

// Generate images using Hugging Face API
const generateImages = async (model, count, ratio, promptText) => {
  const MODEL_URL = `https://api-inference.huggingface.co/models/${model}`;
  const { width, height } = getImageDimensions(ratio);

  const imageTasks = Array.from({ length: count }).map(async (_, i) => {
    const imgCard = document.getElementById(`img-card-${i}`);
    try {
      const res = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: { width, height },
          options: { wait_for_model: true, use_cache: false }
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Unknown API error");
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      imgCard.innerHTML = `
        <img class="result-img" src="${imageUrl}" alt="Generated Image" />
        <div class="img-overlay">
          <a href="${imageUrl}" class="img-download-btn" download="image-${Date.now()}.png">
            <i class="fa-solid fa-download"></i>
          </a>
        </div>
      `;
      imgCard.classList.remove("loading");
    } catch (err) {
      imgCard.innerHTML = `
        <div class="status-container">
          <p class="status-text">⚠️ ${err.message}</p>
        </div>
      `;
      imgCard.classList.remove("loading");
      imgCard.classList.add("error");
    }
  });

  await Promise.allSettled(imageTasks);
};

// Render loading image cards
const createImageCards = (model, count, ratio, prompt) => {
  gridGallery.innerHTML = "";
  for (let i = 0; i < count; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${ratio}">
        <div class="status-container">
          <div class="spinner"></div>
          <p class="status-text">Generating...</p>
        </div>
      </div>
    `;
  }
  generateImages(model, count, ratio, prompt);
};

// Handle form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  const model = modelSelect.value || "stabilityai/stable-diffusion-xl-base-1.0";
  const count = parseInt(countSelect.value) || 1;
  const ratio = ratioSelect.value || "1/1";
  const prompt = promptInput.value.trim();

  if (!prompt || !model) return alert("Please enter a prompt and select a model.");

  createImageCards(model, count, ratio, prompt);
};

// Toggle dark/light theme
const toggleTheme = () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Load saved theme
const setTheme = () => {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved === "dark" || (!saved && prefersDark);
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Fill random prompt
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

// Event bindings
promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);

// Initialize theme on load
setTheme();

