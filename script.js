(() => {
  "use strict";

  const REPO_OWNER = "thoughtzpictures-wq";
  const REPO_NAME = "thoughtzstudio";

  const GALLERIES = {
    "profect-memories-jmxdjl": {
      title: "Profect Memories",
      scene: "Golden Hour Portraits",
      photos: buildPhotos("profect", 12, 1),
    },
    "wedding-lane-9kfmz": {
      title: "Wedding on Lane Street",
      scene: "Ceremony & Reception",
      photos: buildPhotos("wedding", 18, 200),
    }
  };

  const DEFAULT_GALLERY_KEY = "profect-memories-jmxdjl";

  function buildPhotos(prefix, count, seedStart) {
    const photos = [];
    for (let i = 0; i < count; i++) {
      const seed = seedStart + i;
      photos.push({
        id: ${prefix}-${i + 1},
        url: https://picsum.photos/seed/${seed}/800/1000,
      });
    }
    return photos;
  }

  async function fetchFolderPhotos(folderName) {
    try {
      const response = await fetch(https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/images/galleries/${folderName});
      if (!response.ok) return null;
      const files = await response.json();
      
      const imageFiles = files.filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i));
      
      return imageFiles.map((file, index) => ({
        id: ${folderName}-${index + 1},
        url: file.download_url || /${file.path}
      }));
    } catch (err) {
      console.error("Failed to fetch gallery folder:", err);
      return null;
    }
  }

  async function loadGallery() {
    const params = new URLSearchParams(window.location.search);
    const galleryKey = params.get("id") || params.get("gallery") || DEFAULT_GALLERY_KEY;

    let galleryData = GALLERIES[galleryKey];

    if (!galleryData) {
      const fetchedPhotos = await fetchFolderPhotos(galleryKey);
      if (fetchedPhotos && fetchedPhotos.length > 0) {
        galleryData = {
          title: galleryKey.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          scene: ${fetchedPhotos.length} Frames,
          photos: fetchedPhotos
        };
      } else {
        galleryData = GALLERIES[DEFAULT_GALLERY_KEY];
      }
    }

    renderGallery(galleryData);
  }

  function renderGallery(gallery) {
    const titleEl = document.querySelector("h1, .gallery-title");
    const countEl = document.querySelector(".frame-count, .gallery-subtitle");

    if (titleEl) titleEl.textContent = gallery.title;
    if (countEl) countEl.textContent = ${gallery.scene || "Gallery"} • ${gallery.photos.length} frames;

    console.log("Loaded Gallery:", gallery);
  }

  document.addEventListener("DOMContentLoaded", loadGallery);
})();