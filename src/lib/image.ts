/** Largest file accepted before resizing. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageError = "not-image" | "too-large" | "unreadable";

/** Reads an image file and scales it down so it's small enough to store. */
export const imageToDataUrl = (file: File, maxSide = 512): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("not-image" satisfies ImageError));
    if (file.size > MAX_IMAGE_BYTES) return reject(new Error("too-large" satisfies ImageError));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // JPEG has no transparency: paint white behind see-through images rather than black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable" satisfies ImageError));
    };
    img.src = url;
  });

export const imageErrorText = (e: unknown) => {
  const code = e instanceof Error ? e.message : "";
  if (code === "not-image") return "Choose an image file, such as a JPG or PNG.";
  if (code === "too-large") return "That image is over 5 MB. Choose a smaller one.";
  return "We couldn't read that image. Try another one.";
};
