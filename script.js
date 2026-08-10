(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  const DEFAULT_GALLERY = "family-shoot";

  async function fetchFolderPhotos(folderName) {
    try {
      const apiUrl = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME + "/contents/images/galleries/" + folderName;
      const response = await fetch(apiUrl);
      if (!response.ok) return null;

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
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY;

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

    // 1. Update Gallery Title
    const titleEls = document.querySelectorAll("h1, .gallery-title, #gallery-title");
    titleEls.forEach(function(el) {
      el.textContent = gallery.title;
    });

    // 2. Update Frame Counts & Subtitles
    const allText = document.querySelectorAll("p, span, div");
    allText.forEach(function(el) {
      if (el.children.length === 0) {
        if (el.textContent.includes("12 frames") || el.textContent.includes("Scene •")) {
          el.textContent = gallery.scene + " • " + count + " frames";
        }
        if (el.textContent.includes("01 / 12") || el.textContent.includes("01/12")) {
          el.textContent = "01 / " + count;
        }
      }
    });

    // 3. Inject Images into Swiper Slider
    const wrapper = document.querySelector(".swiper-wrapper, .slides-wrapper, #photos-container");
    if (wrapper) {
      let html = "";
      for (let i = 0; i < gallery.photos.length; i++) {
        html += '<div class="swiper-slide">';
        html += '<img src="' + gallery.photos[i].url + '" alt="' + gallery.title + '" style="width:100%; border-radius:12px;" loading="lazy" />';
        html += '</div>';
      }
      wrapper.innerHTML = html;
    }

    if (window.swiper && typeof window.swiper.update === "function") {
      window.swiper.update();
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();
