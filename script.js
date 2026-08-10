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
    const formattedTotal = count < 10 ? "0" + count : count;

    // 1. Target Title (H1)
    const titleEl = document.querySelector("h1");
    if (titleEl) {
      titleEl.textContent = gallery.title;
      // Target Subtitle immediately under H1
      if (titleEl.nextElementSibling) {
        titleEl.nextElementSibling.textContent = gallery.scene + " • " + count + " frames";
      }
    }

    // 2. Target Top Right Counter Badge (01 / 100)
    const badge = document.querySelector("[class*='counter']") || document.querySelector(".badge");
    if (badge) {
      badge.textContent = "01 / " + formattedTotal;
    }

    // 3. Inject Photos into Swiper
    const wrapper = document.querySelector(".swiper-wrapper");
    if (wrapper) {
      let html = "";
      for (let i = 0; i < gallery.photos.length; i++) {
        html += '<div class="swiper-slide" style="display:flex; justify-content:center; align-items:center;">';
        html += '<img src="' + gallery.photos[i].url + '" alt="' + gallery.title + ' - Frame ' + (i + 1) + '" style="max-width:100%; height:auto; max-height:65vh; object-fit:contain; border-radius:12px; display:block;" loading="lazy" />';
        html += '</div>';
      }
      wrapper.innerHTML = html;

      // Re-initialize Swiper Slider
      const swiperContainer = document.querySelector(".swiper") || document.querySelector(".swiper-container");
      if (swiperContainer && swiperContainer.swiper) {
        swiperContainer.swiper.update();
        swiperContainer.swiper.slideTo(0);
      } else if (window.Swiper && swiperContainer) {
        new window.Swiper(swiperContainer, {
          loop: false,
          observer: true,
          observeParents: true,
          pagination: { el: ".swiper-pagination", clickable: true },
          navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
          on: {
            slideChange: function () {
              const currentIdx = this.realIndex + 1;
              const formattedCurrent = currentIdx < 10 ? "0" + currentIdx : currentIdx;
              if (badge) {
                badge.textContent = formattedCurrent + " / " + formattedTotal;
              }
            }
          }
        });
      }
    }
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();
