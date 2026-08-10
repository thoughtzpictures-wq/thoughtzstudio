(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  const DEFAULT_GALLERY_KEY = "family-shoot";

  async function fetchFolderPhotos(folderName) {
    try {
      const apiUrl = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME + "/contents/images/galleries/" + folderName;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error("GitHub API response status:", response.status);
        return null;
      }

      const files = await response.json();
      if (!Array.isArray(files)) return null;

      const imageFiles = files.filter(function(file) {
        return file.name && file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      });

      return imageFiles.map(function(file, index) {
        const rawUrl = file.download_url || ("https://raw.githubusercontent.com/" + REPO_OWNER + "/" + REPO_NAME + "/main/images/galleries/" + folderName + "/" + file.name);
        return {
          id: folderName + "-" + (index + 1),
          url: rawUrl
        };
      });
    } catch (err) {
      console.error("Failed to fetch gallery folder:", err);
      return null;
    }
  }

  async function loadGallery() {
    const params = new URLSearchParams(window.location.search);
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY_KEY;

    console.log("Loading gallery folder:", galleryKey);

    const photos = await fetchFolderPhotos(galleryKey);

    if (photos && photos.length > 0) {
      const formattedTitle = galleryKey.replace(/-/g, " ").toUpperCase();
      renderGallery({
        title: formattedTitle,
        scene: "Client Session",
        photos: photos
      });
    } else {
      console.warn("No photos found or failed to load folder:", galleryKey);
    }
  }

  function renderGallery(gallery) {
    const titleEl = document.querySelector("h1, .gallery-title, #gallery-title");
    const countEl = document.querySelector(".frame-count, .gallery-subtitle, #gallery-subtitle");

    if (titleEl) titleEl.textContent = gallery.title;
    if (countEl) countEl.textContent = gallery.scene + " • " + gallery.photos.length + " frames";

    const container = document.querySelector(".gallery-grid, .swiper-wrapper, #photos-container, main");
    if (container && gallery.photos.length > 0) {
      let html = "";
      for (let i = 0; i < gallery.photos.length; i++) {
        html += '<div class="photo-card" style="margin-bottom: 24px;">';
        html += '<img src="' + gallery.photos[i].url + '" alt="' + gallery.title + '" style="width: 100%; height: auto; border-radius: 8px; display: block;" loading="lazy" />';
        html += '</div>';
      }
      container.innerHTML = html;
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();