async function image() {
  const uploadButton = document.getElementById("upload-button");
  const fileInput = document.getElementById("file-input");
  const latestImage = document.getElementById("latest-image");

  async function loadLatestImage() {
    try {
      const response = await fetch("/latest-image");
      const data = await response.json();
      if (data.image_path) {
        latestImage.src =
          data.image_path ||
          "https://cdn-icons-png.flaticon.com/512/13/13626.png";
      }
    } catch (error) {
      console.error("Failed to load latest image:", error);
    }
  }

  loadLatestImage();

  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          latestImage.src = data.image_path;
        } else {
          alert("Failed to upload image");
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
      }
    }
  });
}

export { image };
