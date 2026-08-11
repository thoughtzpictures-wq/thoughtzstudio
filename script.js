(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";
  const DEFAULT_GALLERY = "family-shoot";
  const STUDIO_PHONE = "2347065686921"; 

  const favoriteIds = new Set();
  let currentGalleryTitle = "FAMILY SHOOT";
  let loadedPhotos = [];

  async function fetchFolderPhotos(folderName) {
    const rawBaseUrl = "https://raw.githubusercontent.com/" + REPO_OWNER + "/" + REPO_NAME + "/main/images/galleries/" + folderName;
    
    try {
      const apiUrl = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME + "/contents/images/galleries/" + folderName;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const files = await response.json();
        if (Array.isArray(files)) {
          const imageFiles = files.filter(function(f) {
            return f.name && f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
          });
          if (imageFiles.length > 0) {
            return imageFiles.map(function(file, idx) {
              return {
                id: folderName + "-" + (idx + 1),
                url: file.download_url || (rawBaseUrl + "/" + file.name),
                name: file.name || ("frame-" + (idx + 1) + ".jpg")
              };
            });
          }
        }
      }
    } catch (err) {
      console.warn("API unavailable, using fallback photo loader", err);
    }

    var fallbackPhotos = [];
    var count = (folderName === "family-shoot") ? 100 : 20;
    for (var i = 1; i <= count; i++) {
      fallbackPhotos.push({
        id: folderName + "-" + i,
        url: rawBaseUrl + "/" + i + ".jpg",
        name: "frame-" + i + ".jpg"
      });
    }
    return fallbackPhotos;
  }

  async function loadGallery() {
    const params = new URLSearchParams(window.location.search);
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY;

    currentGalleryTitle = galleryKey.replace(/-/g, " ").toUpperCase();
    updatePageHeader(currentGalleryTitle);

    loadedPhotos = await fetchFolderPhotos(galleryKey);

    renderGallery({
      title: currentGalleryTitle,
      scene: "Client Session",
      photos: loadedPhotos || []
    });
  }

  function updatePageHeader(titleText) {
    const titleEl = document.querySelector("h1");
    if (titleEl) {
      titleEl.textContent = titleText;
    }
  }

  function updateFavoritesCounter() {
    const count = favoriteIds.size;
    const labelText = count === 1 ? "1 frame selected" : count + " frames selected";

    const allEls = document.querySelectorAll("p, span, div, button, small");
    allEls.forEach(function(el) {
      if (el.children.length === 0 && (el.textContent.includes("frame selected") || el.textContent.includes("frames selected"))) {
        el.textContent = labelText;
      }
    });
  }

  function triggerWhatsAppSend() {
    if (favoriteIds.size === 0) {
      alert("Please select at least one photo before sending your favorites!");
      return;
    }

    const selectedList = Array.from(favoriteIds).join(", ");
    const message = "Hello Thoughtz Studio! 👋\n\nHere are my selected favorite frames for " + currentGalleryTitle + " (" + favoriteIds.size + " total):\n\n" + selectedList;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message);
    }

    let waUrl = "https://api.whatsapp.com/send?";
    if (STUDIO_PHONE && STUDIO_PHONE.length > 0) {
      waUrl += "phone=" + STUDIO_PHONE + "&";
    }
    waUrl += "text=" + encodeURIComponent(message);

    window.location.assign(waUrl);
  }

  // Smart download for selected images (opens clean direct tabs)
  function triggerDownloadSelected() {
    if (favoriteIds.size === 0) {
      alert("Please favorite at least one photo first by tapping the heart icon on your favorite images!");
      return;
    }

    const selectedPhotos = loadedPhotos.filter(p => favoriteIds.has(p.id));

    alert("Opening " + selectedPhotos.length + " selected photo(s) for high-resolution download.");

    selectedPhotos.forEach(function(photo) {
      window.open(photo.url, "_blank");
    });
  }

  // Re-bind template buttons and replace "Download All" with "Download Selected"
  function setupActionButtons() {
    const allBtns = document.querySelectorAll("button, a, div");

    allBtns.forEach(function(el) {
      const text = (el.textContent || "").toLowerCase().trim();

      // WhatsApp Button
      if (text.includes("send favourites") || text.includes("send favorites")) {
        const btn = el.closest("button, a, div") || el;
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          triggerWhatsAppSend();
        };
      }

      // Replace Download All functionality with Download Selected
      if (text.includes("download all") || text.includes("download frames")) {
        const btn = el.closest("button, a, div") || el;
        
        // Update label text dynamically so client knows it downloads selected frames
        if (btn.children.length === 0) {
          btn.textContent = "Download Selected Frames";
        } else {
          const textNodes = btn.querySelectorAll("*");
          textNodes.forEach(tn => {
            if (tn.textContent.toLowerCase().includes("download")) {
              tn.textContent = "Download Selected Frames";
            }
          });
        }

        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          triggerDownloadSelected();
        };
      }
    });
  }

  function renderGallery(gallery) {
    const count = gallery.photos.length;
    const formattedTotal = count < 10 ? "0" + count : count;

    const titleEl = document.querySelector("h1");
    if (titleEl) {
      titleEl.textContent = gallery.title;
      if (titleEl.nextElementSibling) {
        titleEl.nextElementSibling.textContent = gallery.scene + " • " + count + " frames";
      }
    }

    const badge = document.querySelector("[class*='counter']") || document.querySelector(".badge");
    if (badge) {
      badge.textContent = "01 / " + formattedTotal;
    }

    let swipeHintEl = null;
    const allEls = document.querySelectorAll("p, span, div, h2, h3");
    for (let i = 0; i < allEls.length; i++) {
      if (allEls[i].children.length === 0 && allEls[i].textContent.trim().toUpperCase().includes("SWIPE TO VIEW FRAMES")) {
        swipeHintEl = allEls[i];
        break;
      }
    }

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

    const oldSwipers = document.querySelectorAll(".swiper, .swiper-container");
    oldSwipers.forEach(function(el) {
      if (el !== galleryContainer) el.style.display = "none";
    });

    galleryContainer.style.width = "100%";
    galleryContainer.style.margin = "20px 0";
    galleryContainer.style.display = "flex";
    galleryContainer.style.overflowX = "auto";
    galleryContainer.style.scrollSnapType = "x mandatory";
    galleryContainer.style.webkitOverflowScrolling = "touch";
    galleryContainer.style.gap = "16px";
    galleryContainer.style.padding = "8px 0";

    let html = "";
    for (let i = 0; i < gallery.photos.length; i++) {
      const photo = gallery.photos[i];
      const isFav = favoriteIds.has(photo.id);

      html += '<div style="flex: 0 0 100%; max-width: 100%; scroll-snap-align: center; display: flex; justify-content: center; align-items: center;">';
      html += '<div style="position: relative; display: inline-block; width: 100%; max-width: 100%; text-align: center;">';
      
      html += '<img src="' + photo.url + '" alt="' + gallery.title + ' - Frame ' + (i + 1) + '" style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: 16px; display: block; margin: 0 auto;" loading="lazy" />';
      
      html += '<button type="button" data-photo-id="' + photo.id + '" class="fav-btn" style="position: absolute; top: 14px; right: 14px; background: ' + (isFav ? '#22c55e' : 'rgba(0,0,0,0.65)') + '; color: #ffffff; border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; backdrop-filter: blur(6px); display: flex; align-items: center; gap: 6px; z-index: 99; transition: all 0.2s ease;">';
      html += '<span class="fav-icon">' + (isFav ? '♥' : '♡') + '</span> ';
      html += '<span class="fav-label">' + (isFav ? 'Favorited' : 'Favorite') + '</span>';
      html += '</button>';

      html += '</div>';
      html += '</div>';
    }
    galleryContainer.innerHTML = html;

    // Strict favoriting handler that suppresses all default template listeners
    galleryContainer.addEventListener("click", function(e) {
      const btn = e.target.closest(".fav-btn");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

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
    }, true);

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
    setupActionButtons();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(loadGallery, 1);
  } else {
    document.addEventListener("DOMContentLoaded", loadGallery);
  }
})();
