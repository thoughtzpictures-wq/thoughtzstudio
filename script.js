(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";

  const DEFAULT_GALLERY_KEY = "family-shoot";

  async function fetchFolderPhotos(folderName) {
    try {
      const response = await fetch(https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/images/galleries/${folderName});
      if (!response.ok) throw new Error(GitHub API returned ${response.status});
      const files = await response.json();
      
      const imageFiles = files.filter(file => file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
      
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
      const formattedTitle = galleryKey.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      renderGallery({
        title: formattedTitle,
        scene: "Client Session",
        photos: photos
      });
    } else {
      console.warn("No photos found in folder:", galleryKey);
    }
  }

  function renderGallery(gallery) {
    // Update Header Text
    const titleEl = document.querySelector("h1, .gallery-title, #gallery-title");
    const countEl = document.querySelector(".frame-count, .gallery-subtitle, #gallery-subtitle");

    if (titleEl) titleEl.textContent = gallery.title;
    if (countEl) countEl.textContent = ${gallery.scene} • ${gallery.photos.length} frames;

    // Populate Photos into Grid / Swiper / Container
    const gridEl = document.querySelector(".gallery-grid, .swiper-wrapper, #photos-container, main");
    if (gridEl && gallery.photos.length > 0) {
      gridEl.innerHTML = gallery.photos.map(photo => `
        <div class="photo-card" style="margin-bottom: 24px;">
          <img src="${photo.url}" alt="${gallery.title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" loading="lazy" />
        </div>
      `).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();