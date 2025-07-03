import { bubbleImageUrl } from "./utils";

export const generateBubble = (container, condition) => {
  if (!container || !condition) {
    return;
  }
  for (let i = 0; i < 40; i++) {
    const img = document.createElement("img");
    img.src = bubbleImageUrl;
    img.style.position = "absolute";
    img.style.width = "20px"; // Or any size you want
    img.style.height = "auto";

    // Generate random position
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const randomLeft = Math.random() * (containerWidth - 10); // subtract image width
    const randomTop = Math.random() * (containerHeight - 10); // subtract image height

    img.style.left = `${randomLeft}px`;
    img.style.top = `${randomTop}px`;

    container.appendChild(img);
  }
};
