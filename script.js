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

    // 1. Update Title
    const titleEls = document.querySelectorAll("h1, .gallery-title, #gallery-title");
    titleEls.forEach(function(el) {
      el.textContent = gallery.title;
    });

    // 2. Update Subtitles & Initial Counter
    const allText = document.querySelectorAll("p, span, div");
    allText.forEach(function(el) {
      if (el.children.length === 0) {
        if (el.textContent.includes("12 frames") || el.textContent.includes("Scene •") || el.textContent.includes("frames")) {
          el.textContent = gallery.scene + " • " + count + " frames";
        }
        if (el.textContent.includes("01 /") || el.textContent.includes("01/")) {
          el.textContent = "01 / " + (count < 10 ? "0" + count : count);
        }
      }
    });

    // 3. Inject Images & Re-initialize Slider
    const wrapper = document.querySelector(".swiper-wrapper, .slides-wrapper, #photos-container");
    const swiperEl = document.querySelector(".swiper, .swiper-container") || document.querySelector("[class*='swiper']");

    if (wrapper) {
      // Safely destroy previous slider instance if active
      if (swiperEl && swiperEl.swiper) {
        try {
          swiperEl.swiper.destroy(true, true);
        } catch (e) {
          console.log("Swiper reset:", e);
        }
      }

      // Populate photo slides
      let html = "";
      for (let i = 0; i < gallery.photos.length; i++) {
        html += '<div class="swiper-slide" style="display:flex; justify-content:center; align-items:center;">';
        html += '<img src="' + gallery.photos[i].url + '" alt="' + gallery.title + '" style="max-width:100%; height:auto; max-height:70vh; object-fit:contain; border-radius:12px; display:block;" loading="lazy" />';
        html += '</div>';
      }
      wrapper.innerHTML = html;

      // Re-init Swiper slider
      if (window.Swiper) {
        new window.Swiper(swiperEl || ".swiper", {
          loop: false,
          observer: true,
          observeParents: true,
          pagination: { el: ".swiper-pagination", clickable: true },
          navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
          on: {
            slideChange: function () {
              const currentIdx = this.realIndex + 1;
              const formattedCurrent = currentIdx < 10 ? "0" + currentIdx : currentIdx;
              const formattedTotal = count < 10 ? "0" + count : count;

              allText.forEach(function(el) {
                if (el.children.length === 0 && el.textContent.match(/\d+\s*\/\s*\d+/)) {
                  el.textContent = formattedCurrent + " / " + formattedTotal;
                }
              });
            }
          }
        });
      }
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();
