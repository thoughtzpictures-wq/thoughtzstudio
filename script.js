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

    // 1. Update Title and Subtitle
    const titleEl = document.querySelector("h1");
    if (titleEl) {
      titleEl.textContent = gallery.title;
      if (titleEl.nextElementSibling) {
        titleEl.nextElementSibling.textContent = gallery.scene + " • " + count + " frames";
      }
    }

    // 2. Update Badge Counter
    const badge = document.querySelector("[class*='counter']") || document.querySelector(".badge");
    if (badge) {
      badge.textContent = "01 / " + formattedTotal;
    }

    // 3. Locate "SWIPE TO VIEW FRAMES" label
    let swipeHintEl = null;
    const allEls = document.querySelectorAll("p, span, div, h2, h3");
    for (let i = 0; i < allEls.length; i++) {
      if (allEls[i].children.length === 0 && allEls[i].textContent.trim().toUpperCase().includes("SWIPE TO VIEW FRAMES")) {
        swipeHintEl = allEls[i];
        break;
      }
    }

    // 4. Create or target explicit image carousel container
    let galleryContainer = document.getElementById("studio-carousel");
    if (!galleryContainer) {
      galleryContainer = document.createElement("div");
      galleryContainer.id = "studio-carousel";
      
      if (swipeHintEl && swipeHintEl.parentNode) {
        swipeHintEl.parentNode.insertBefore(galleryContainer, swipeHintEl.nextSibling);
      } else {
        document.body.appendChild(galleryContainer);
      }
    }

    // 5. Hide any old broken/collapsed swiper elements
    const oldSwipers = document.querySelectorAll(".swiper, .swiper-container");
    oldSwipers.forEach(function(el) {
      if (el !== galleryContainer) el.style.display = "none";
    });

    // 6. Apply native, high-performance snap-scroll styles
    galleryContainer.style.width = "100%";
    galleryContainer.style.margin = "20px 0";
    galleryContainer.style.display = "flex";
    galleryContainer.style.overflowX = "auto";
    galleryContainer.style.scrollSnapType = "x mandatory";
    galleryContainer.style.webkitOverflowScrolling = "touch";
    galleryContainer.style.gap = "16px";
    galleryContainer.style.padding = "8px 0";

    // 7. Inject photo slides
    let html = "";
    for (let i = 0; i < gallery.photos.length; i++) {
      html += '<div style="flex: 0 0 100%; max-width: 100%; scroll-snap-align: center; display: flex; justify-content: center; align-items: center;">';
      html += '<img src="' + gallery.photos[i].url + '" alt="' + gallery.title + ' - Frame ' + (i + 1) + '" style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: 16px; display: block;" loading="lazy" />';
      html += '</div>';
    }
    galleryContainer.innerHTML = html;

    // 8. Update counter dynamically as user swipes
    galleryContainer.addEventListener("scroll", function() {
      const scrollPos = galleryContainer.scrollLeft;
      const width = galleryContainer.clientWidth;
      if (width > 0) {
        const currentIdx = Math.min(Math.round(scrollPos / width) + 1, count);
        const formattedCurrent = currentIdx < 10 ? "0" + currentIdx : currentIdx;
        if (badge) {
          badge.textContent = formattedCurrent + " / " + formattedTotal;
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();
