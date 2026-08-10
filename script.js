(() => {
  "use strict";

  const GALLERIES = {
    "profect-memories-jmxdjl": {
      title: "Profect Memories",
      scene: "Golden Hour Portraits",
      photos: buildPhotos("profect", 12, 1),
    },
    "wedding-lane-9kfmz": {
      title: "Wedding on Lane Street",
      scene: "Ceremony & Reception",
      photos: buildPhotos("wedding", 10, 200),
    },
  };

  const DEFAULT_GALLERY_KEY = "profect-memories-jmxdjl";

  function buildPhotos(prefix, count, seedStart) {
    const photos = [];
    for (let i = 0; i < count; i++) {
      const seed = seedStart + i;
      photos.push({
        id: `${prefix}-${i + 1}`,
        url: `https://picsum.photos/seed/${prefix}${seed}/800/1000`,
      });
    }
    return photos;
  }

  function getGalleryFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (d && GALLERIES[d]) return GALLERIES[d];
    return GALLERIES[DEFAULT_GALLERY_KEY];
  }

  const gallery = getGalleryFromQuery();
  const favourited = new Set();

  const carousel = document.getElementById("carousel");
  const frameCounter = document.getElementById("frameCounter");
  const projectTitle = document.getElementById("projectTitle");
  const projectSubtitle = document.getElementById("projectSubtitle");
  const favBadge = document.getElementById("favBadge");
  const sendFavBtn = document.getElementById("sendFavBtn");
  const downloadAllBtn = document.getElementById("downloadAllBtn");
  const toast = document.getElementById("toast");

  const total = gallery.photos.length;

  projectTitle.textContent = gallery.title;
  projectSubtitle.textContent = `${gallery.scene} • ${total} frames`;

  function pad(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  function heartSvg() {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.4 8 1.8 4.5 5 3.4c2-0.7 4 0 5.3 1.7C11.6 3.4 13.6 2.7 15.6 3.4c3.2 1.1 4.6 4.6 3 7.8-2.5 4.7-10 9.3-10 9.3z"/>
    </svg>`;
  }

  function renderCarousel() {
    const frag = document.createDocumentFragment();
    gallery.photos.forEach((photo, idx) => {
      const card = document.createElement("div");
      card.className = "frame-card";
      card.setAttribute("role", "listitem");
      card.dataset.id = photo.id;

      const img = document.createElement("img");
      img.src = photo.url;
      img.alt = `Frame ${idx + 1} of ${total}`;
      img.loading = idx === 0 ? "eager" : "lazy";
      img.draggable = false;

      const indexTag = document.createElement("span");
      indexTag.className = "frame-index";
      indexTag.textContent = `${pad(idx + 1)} / ${pad(total)}`;

      const heartBtn = document.createElement("button");
      heartBtn.className = "heart-btn";
      heartBtn.type = "button";
      heartBtn.setAttribute("aria-label", "Toggle favourite");
      heartBtn.setAttribute("aria-pressed", "false");
      heartBtn.innerHTML = heartSvg();
      heartBtn.addEventListener("click", () => toggleFavourite(photo.id, heartBtn));

      card.appendChild(img);
      card.appendChild(indexTag);
      card.appendChild(heartBtn);
      frag.appendChild(card);
    });
    carousel.appendChild(frag);
  }

  function toggleFavourite(id, btn) {
    if (favourited.has(id)) {
      favourited.delete(id);
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    } else {
      favourited.add(id);
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    }
    updateFavouritesUI();
  }

  function updateFavouritesUI() {
    const count = favourited.size;
    favBadge.textContent = count === 1 ? "1 frame selected" : `${count} frames selected`;
    favBadge.classList.toggle("has-items", count > 0);
    sendFavBtn.disabled = count === 0;
    sendFavBtn.classList.toggle("active", count > 0);
  }

  function updateCounterFromScroll() {
    const cards = carousel.querySelectorAll(".frame-card");
    if (!cards.length) return;
    const carouselRect = carousel.getBoundingClientRect();
    const centerX = carouselRect.left + carouselRect.width / 2;

    let closestIdx = 0;
    let closestDist = Infinity;
    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(cardCenter - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    frameCounter.textContent = `${pad(closestIdx + 1)} / ${pad(total)}`;
  }

  let scrollTicking = false;
  carousel.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateCounterFromScroll();
      scrollTicking = false;
    });
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  downloadAllBtn.addEventListener("click", () => {
    gallery.photos.forEach((photo, idx) => {
      const a = document.createElement("a");
      a.href = photo.url;
      a.download = `${gallery.title.replace(/\s+/g, "-").toLowerCase()}-${idx + 1}.jpg`;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
    showToast("Downloading full-quality frames…");
  });

  sendFavBtn.addEventListener("click", async () => {
    if (favourited.size === 0) return;
    const frames = Array.from(favourited).join(", ");
    sendFavBtn.disabled = true;
    sendFavBtn.textContent = "Sending…";

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name": "favourites",
          project: gallery.title,
          frames,
          count: String(favourited.size),
        }).toString(),
      });
      showToast("Favourites sent to the studio ✓");
    } catch (err) {
      showToast("Couldn't send — check your connection");
    } finally {
      sendFavBtn.textContent = "Send Favourites to Studio";
      updateFavouritesUI();
    }
  });

  renderCarousel();
  updateFavouritesUI();
  updateCounterFromScroll();
})();
// Function to automatically fetch all photos from a gallery folder
async function getPhotosFromFolder(folderName) {
  const repoOwner = "thoughtzpictures-wq";
  const repoName = "thoughtzstudio";
  const apiUrl = https://api.github.com/repos/${repoOwner}/${repoName}/contents/images/galleries/${folderName};

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Folder not found");
    const files = await response.json();

    // Filter only image files (.jpg, .png, .webp, etc.)
    return files
      .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
      .map(file => file.download_url);
  } catch (error) {
    console.error("Error loading gallery photos:", error);
    return [];
  }
}
