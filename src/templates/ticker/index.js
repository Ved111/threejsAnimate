const tickerItems = [
  {
    text: "No Artificial Flavouring",
    image:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1751716586/4_4_5_xum6vz.png",
  },
  {
    text: "High in Fibre",
    image:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1751716584/4_4_4_n5sq12.png",
  },
  {
    text: "No Artificial Colouring",
    image:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1751716584/4_4_2_fz9ec8.png",
  },
  {
    text: "No Artificial Flavouring ",
    image:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1751716584/4_4_3_tsshnd.png",
  },
  {
    text: "Low Sugar",
    image:
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1751716583/4_4_1_tcbjow.png",
  },
];

const ticker = () => {
  const app = document.querySelector("#app");
  if (!app) return;

  // Create main ticker container
  const tickerContainer = document.createElement("div");
  tickerContainer.classList.add(
    "bg-red-circular-gradient",
    "base-container",
    "ticker-main-container"
  );

  const tickerMainContainer = document.createElement("div");
  tickerMainContainer.classList.add("ticker-container");

  const tickerContent = document.createElement("div");
  tickerContent.classList.add("ticker-content", "scroll");

  tickerItems.forEach(({ text, image }) => {
    const item = document.createElement("div");
    item.classList.add("ticker-item");

    if (image) {
      const img = document.createElement("img");
      img.src = image;
      img.alt = text;
      img.style.width = "24px";
      img.style.height = "24px";
      img.style.marginRight = "8px";
      img.style.verticalAlign = "middle";
      item.appendChild(img);
    }

    const span = document.createElement("span");
    span.innerText = text;
    item.appendChild(span);

    tickerContent.appendChild(item);
  });

  const clone = tickerContent.cloneNode(true);
  tickerMainContainer.append(tickerContent, clone);
  tickerContainer.appendChild(tickerMainContainer);
  app.appendChild(tickerContainer);
};

export default ticker;
