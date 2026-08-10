(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  // Default to family-shoot so the root URL loads it automatically
  const DEFAULT_GALLERY = "family-shoot";

  async function fetchFolderPhotos(folderName) {
    try {
      const apiUrl = https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/images/galleries/${folderName};
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error(GitHub API Error: ${response.status});
        return null;
      }

      const files = await response.json();
      if (!Array.isArray(files)) return null;

      const imageFiles = files.filter(file => file.name && file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));

      return imageFiles.map((file, index) => ({
        id: ${folderName}-${index + 1},
        url: file.download_url || https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/images/galleries/${folderName}/${file.name}
      }));
    } catch (err) {
      console.error("Failed to fetch gallery folder:", err);
      return null;
    }
  }

  async function loadGallery() {
    const params = new URLSearchParams(window.location.search);
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY;

    const photos = await fetchFolderPhotos(galleryKey);

    if (photos && photos.length > 0) {
      const formattedTitle = galleryKey.replace(/-/g, " ").toUpperCase();
      renderGallery({
        title: formattedTitle,
        scene: "Client Session",
        photos: photos
      });
    } else {
      // Fallback display if GitHub API is temporarily rate-limited
      const titleEl = document.querySelector("h1, .gallery-title, #gallery-title");
      if (titleEl) {
        titleEl.textContent = "FAMILY SHOOT";
      }
    }
  }

  function renderGallery(gallery) {
    const count = gallery.photos.length;

    // Update Title
    const titleEl = document.querySelector("h1, .gallery-title, #gallery-title");
    if (titleEl) titleEl.textContent = gallery.title;

    // Update Subtitle & Frame Counts across all elements
    const subtitleEls = document.querySelectorAll("p, span, .frame-count, .gallery-subtitle");
    subtitleEls.forEach(el => {
      if (el.textContent.includes("frames") || el.textContent.includes("Scene")) {
        el.textContent = ${gallery.scene} • ${count} frames;
      }
      if (el.textContent.includes("01 /") || el.textContent.includes("12")) {
        el.textContent = 01 / ${count};
      }
    });

    // Inject Photos into Swiper Container
    const wrapper = document.querySelector(".swiper-wrapper, .slides-wrapper, #photos-container");
    if (wrapper) {
      wrapper.innerHTML = gallery.photos.map((photo, i) => `
        <div class="swiper-slide">
          <img src="${photo.url}" alt="${gallery.title} - Frame ${i + 1}" style="width:100%; border-radius:12px;" loading="lazy" />
        </div>
      `).join("");
    }

    if (window.swiper && typeof window.swiper.update === "function") {
      window.swiper.update();
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();