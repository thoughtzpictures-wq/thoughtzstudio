(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  const DEFAULT_GALLERY_KEY = "family-shoot";

  async function fetchFolderPhotos(folderName) {
    try {
      const apiUrl = https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/images/galleries/${folderName};
      const response = await fetch(apiUrl);
      
      if (!response.ok) return null;

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
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY_KEY;

    const photos = await fetchFolderPhotos(galleryKey);

    if (photos && photos.length > 0) {
      const formattedTitle = galleryKey.replace(/-/g, " ").toUpperCase();
      renderGallery({
        title: formattedTitle,
        scene: "Client Session",
        photos: photos
      });
    }
  }

  function renderGallery(gallery) {
    const count = gallery.photos.length;

    // 1. Update Title & Subtitle Text
    const titleEl = document.querySelector("h1, .gallery-title, #gallery-title");
    const countEl = document.querySelector(".frame-count, .gallery-subtitle, #gallery-subtitle");
    const badgeCountEl = document.querySelector(".counter, .frame-counter, [class*='counter']");

    if (titleEl) titleEl.textContent = gallery.title;
    if (countEl) countEl.textContent = ${gallery.scene} • ${count} frames;

    // 2. Populate Swiper / Image Container
    const wrapper = document.querySelector(".swiper-wrapper, .slides-wrapper, #photos-container");
    if (wrapper) {
      wrapper.innerHTML = gallery.photos.map((photo, i) => `
        <div class="swiper-slide">
          <img src="${photo.url}" alt="${gallery.title} - Frame ${i + 1}" loading="lazy" />
        </div>
      `).join("");
    }

    // 3. Re-initialize or Update Swiper if present window object exists
    if (window.swiper) {
      if (typeof window.swiper.update === "function") window.swiper.update();
    } else if (window.Swiper) {
      try {
        new window.Swiper(".swiper", {
          loop: false,
          pagination: { el: ".swiper-pagination" },
          navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
        });
      } catch (e) {
        console.log("Swiper init info:", e);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();