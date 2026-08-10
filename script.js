(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  const DEFAULT_GALLERY = "family-shoot";

  // State array to track favorited photo IDs
  const favoriteIds = new Set();

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

  function updateFavoritesCounter() {
    const count = favoriteIds.size;
    const labelText = count === 1 ? "1 frame selected" : count + " frames selected";

    const allEls = document.querySelectorAll("p, span, div, button");
    allEls.forEach(function(el) {
      if (el.children.length === 0 && el.textContent.includes("frames selected")) {
        el.textContent = labelText;
      }
    });
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

    // 4. Create carousel container
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

    // Hide old broken swipers if present
    const oldSwipers = document.querySelectorAll(".swiper, .swiper-container");
    oldSwipers.forEach(function(el) {
      if (el !== galleryContainer) el.style.display = "none";
    });

    // Native snap-scroll container styles
    galleryContainer.style.width = "100%";
    galleryContainer.style.margin = "20px 0";
    galleryContainer.style.display = "flex";
    galleryContainer.style.overflowX = "auto";
    galleryContainer.style.scrollSnapType = "x mandatory";
    galleryContainer.style.webkitOverflowScrolling = "touch";
    galleryContainer.style.gap = "16px";
    galleryContainer.style.padding = "8px 0";

    // Build slides with Favorite Overlay Button
    let html = "";
    for (let i = 0; i < gallery.photos.length; i++) {
      const photo = gallery.photos[i];
      const isFav = favoriteIds.has(photo.id);

      html += '<div style="flex: 0 0 100%; max-width: 100%; scroll-snap-align: center; display: flex; justify-content: center; align-items: center;">';
      html += '<div style="position: relative; display: inline-block; width: 100%; max-width: 100%; text-align: center;">';
      
      // Photo Image
      html += '<img src="' + photo.url + '" alt="' + gallery.title + ' - Frame ' + (i + 1) + '" style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: 16px; display: block; margin: 0 auto;" loading="lazy" />';
      
      // Favorite Button
      html += '<button data-photo-id="' + photo.id + '" class="fav-btn" style="position: absolute; top: 14px; right: 14px; background: ' + (isFav ? '#22c55e' : 'rgba(0,0,0,0.65)') + '; color: #ffffff; border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; backdrop-filter: blur(6px); display: flex; align-items: center; gap: 6px; z-index: 10; transition: all 0.2s ease;">';
      html += '<span class="fav-icon">' + (isFav ? '♥' : '♡') + '</span> ';
      html += '<span class="fav-label">' + (isFav ? 'Favorited' : 'Favorite') + '</span>';
      html += '</button>';

      html += '</div>';
      html += '</div>';
    }
    galleryContainer.innerHTML = html;

    // Delegate favorite button click events
    galleryContainer.onclick = function(e) {
      const btn = e.target.closest(".fav-btn");
      if (!btn) return;

      const photoId = btn.getAttribute("data-photo-id");
      const iconEl = btn.querySelector(".fav-icon");
      const labelEl = btn.querySelector(".fav-label");

      if (favoriteIds.has(photoId)) {
        favoriteIds.delete(photoId);
        btn.style.background = "rgba(0,0,0,0.65)";
        if (iconEl) iconEl.textContent = "♡";
        if (labelEl) labelEl.textContent = "Favorite";
      } else {
        favoriteIds.add(photoId);
        btn.style.background = "#22c55e";
        if (iconEl) iconEl.textContent = "♥";
        if (labelEl) labelEl.textContent = "Favorited";
      }

      updateFavoritesCounter();
    };

    // Update counter badge on scroll
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

    updateFavoritesCounter();
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();
