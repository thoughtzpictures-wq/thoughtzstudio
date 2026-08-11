(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  const DEFAULT_GALLERY = "family-shoot";

  const favoriteIds = new Set();
  let currentGalleryTitle = "GALLERY";

  // Fetch photo files with automatic fallback if GitHub API rate-limits
  async function fetchFolderPhotos(folderName) {
    const rawBaseUrl = https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/images/galleries/${folderName};
    
    try {
      const apiUrl = https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/images/galleries/${folderName};
      const response = await fetch(apiUrl);

      if (response.ok) {
        const files = await response.json();
        if (Array.isArray(files)) {
          const imageFiles = files.filter(f => f.name && f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
          if (imageFiles.length > 0) {
            return imageFiles.map((file, idx) => ({
              id: ${folderName}-${idx + 1},
              url: file.download_url || ${rawBaseUrl}/${file.name}
            }));
          }
        }
      }
    } catch (err) {
      console.warn("GitHub API rate-limited or unavailable. Switching to direct fallback loader...", err);
    }

    // Fallback: Generate direct image links (handles rate limits seamlessly)
    const fallbackPhotos = [];
    const estimatedCount = folderName === "family-shoot" ? 100 : 20;

    for (let i = 1; i <= estimatedCount; i++) {
      fallbackPhotos.push({
        id: ${folderName}-${i},
        url: ${rawBaseUrl}/${i}.jpg
      });
    }

    return fallbackPhotos;
  }

  async function loadGallery() {
    const params = new URLSearchParams(window.location.search);
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY;

    const photos = await fetchFolderPhotos(galleryKey);

    if (photos && photos.length > 0) {
      currentGalleryTitle = galleryKey.replace(/-/g, " ").toUpperCase();
      renderGallery({
        title: currentGalleryTitle,
        scene: "Client Session",
        photos: photos
      });
    }
  }

  function updateFavoritesCounter() {
    const count = favoriteIds.size;
    const labelText = count === 1 ? "1 frame selected" : ${count} frames selected;

    const allEls = document.querySelectorAll("p, span, div, button");
    allEls.forEach(el => {
      if (el.children.length === 0 && el.textContent.includes("frames selected")) {
        el.textContent = labelText;
      }
    });
  }

  function setupSendFavouritesButton() {
    const allBtns = document.querySelectorAll("button, a, div");
    let sendBtn = null;

    allBtns.forEach(el => {
      if (el.textContent.trim().includes("Send Favourites to Studio")) {
        sendBtn = el;
      }
    });

    if (sendBtn) {
      sendBtn.style.cursor = "pointer";
      sendBtn.onclick = function(e) {
        e.preventDefault();

        if (favoriteIds.size === 0) {
          alert("Please select at least one photo before sending your favorites!");
          return;
        }

        const selectedList = Array.from(favoriteIds).join(", ");
        const message = Hello Thoughtz Studio! 👋\n\nHere are my selected favorite frames for *${currentGalleryTitle}* (${favoriteIds.size} total):\n\n${selectedList};

        const waUrl = "https://wa.me/?text=" + encodeURIComponent(message);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(message);
        }

        window.open(waUrl, "_blank");
      };
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

    // Hide broken swiper elements
    const oldSwipers = document.querySelectorAll(".swiper, .swiper-container");
    oldSwipers.forEach(el => {
      if (el !== galleryContainer) el.style.display = "none";
    });

    // Native snap-scroll styles
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
      
      // Photo Image with onerror graceful handling
      html += '<img src="' + photo.url + '" alt="' + gallery.title + ' - Frame ' + (i + 1) + '" style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: 16px; display: block; margin: 0 auto;" loading="lazy" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/800x600/18181b/ffffff?text=Frame+' + (i + 1) + '\';" />';
      
      // Favorite Button
      html += '<button data-photo-id="' + photo.id + '" class="fav-btn" style="position: absolute; top: 14px; right: 14px; background: ' + (isFav ? '#22c55e' : 'rgba(0,0,0,0.65)') + '; color: #ffffff; border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; backdrop-filter: blur(6px); display: flex; align-items: center; gap: 6px; z-index: 10; transition: all 0.2s ease;">';
      html += '<span class="fav-icon">' + (isFav ? '♥' : '♡') + '</span> ';
      html += '<span class="fav-label">' + (isFav ? 'Favorited' : 'Favorite') + '</span>';
      html += '</button>';

      html += '</div>';
      html += '</div>';
    }
    galleryContainer.innerHTML = html;

    // Handle favorite button clicks
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

    // Update index counter badge on scroll
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
    setupSendFavouritesButton();
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();
