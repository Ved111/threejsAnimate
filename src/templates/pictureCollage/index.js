const pictureCollage = () => {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("#app container not found!");
    return;
  }

  const pictues = [
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_064103_oorc8q.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "About Us",
          },
          styles: {
            left: "40%",
            bottom: "26px",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "40%", top: "26px" },
          props: { textContent: "brand story" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065538_u9oeab.png",
      customFn: createDiv,
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065538_u9oeab.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "Our Story",
          },
          styles: {
            left: "30%",
            bottom: "26px",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "30%", top: "26px" },
          props: { textContent: "founder story" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_064151_uqayx7.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "learn more",
          },
          styles: {
            left: "9rem",
            bottom: "3rem",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "10rem", top: "5rem" },
          props: { textContent: "why prebiotic ?" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_064312_ermy0h.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "shop now",
          },
          styles: {
            left: "9rem",
            bottom: "3rem",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "10rem", top: "8rem" },
          props: { textContent: "product page" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065608_khvrzn.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "recipes",
          },
          styles: {
            left: "5rem",
            bottom: "3rem",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "6rem", top: "6rem", maxWidth: "100px" },
          props: { textContent: "if flavors could kill" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234727/Screenshot_2025-06-29_065629_hpod2j.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "faq's",
          },
          styles: {
            left: "5rem",
            bottom: "3rem",
            textTransform: "uppercase",
          },
          classes: ["collage-btn", "collage-text"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234727/Screenshot_2025-06-29_065641_m2zjap.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "coupon",
          },
          styles: {
            left: "5rem",
            bottom: "3rem",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "5.5rem", top: "3rem" },
          props: { textContent: "email pop up" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_065701_o1p3o6.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "Benefits of Don Chico’s soda",
          },
          styles: {
            left: "14rem",
            bottom: "18rem",
            maxWidth: "180px",
          },
          classes: ["collage-btn-2", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "14rem", top: "19rem", maxWidth: "180px" },
          props: { textContent: "Ingredient List Breakdown" },
          classes: ["collage-text", "collage-btn-2"],
        },
        {
          element: "button",
          styles: { left: "14rem", bottom: "6rem", maxWidth: "180px" },
          props: { textContent: "soda benefits" },
          classes: ["collage-text", "collage-btn"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_065750_cdculv.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "who is don chico?",
          },
          styles: {
            left: "12rem",
            bottom: "3rem",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { left: "15rem", top: "4rem" },
          props: { textContent: "brand love" },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
  ];

  function createDiv({ index }) {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.style.height = "100%";
    wrapperDiv.style.width = "100%";
    wrapperDiv.style.position = "relative";
    wrapperDiv.style.gridArea = `img${index + 1}`;
    wrapperDiv.classList.add("collage-secondary-grid");

    const flavorSwitch = document.createElement("div");
    const ig = document.createElement("div");
    const thread = document.createElement("div");
    const spotify = document.createElement("div");

    flavorSwitch.style.gridArea = "flavorSwitch";
    ig.style.gridArea = "ig";
    thread.style.gridArea = "thread";
    spotify.style.gridArea = "spotify";

    flavorSwitch.classList.add("border-black");
    ig.classList.add("border-black");
    thread.classList.add("border-black");
    spotify.classList.add("border-black");

    const flavorTitle = document.createElement("button");
    const igTitle = document.createElement("button");
    const threadTitle = document.createElement("button");
    const spotifyTitle = document.createElement("button");

    flavorTitle.textContent = "flavours switch";
    igTitle.textContent = "ig";
    threadTitle.textContent = "thread";
    spotifyTitle.textContent = "spotify";

    flavorTitle.classList.add("collage-text", "collage-btn-2");
    igTitle.classList.add("collage-text", "collage-btn-2");
    threadTitle.classList.add("collage-text", "collage-btn-2");
    spotifyTitle.classList.add("collage-text", "collage-btn-2");

    flavorSwitch.append(flavorTitle);
    ig.append(igTitle);
    thread.append(threadTitle);
    spotify.append(spotifyTitle);

    wrapperDiv.append(flavorSwitch);
    wrapperDiv.append(ig);
    wrapperDiv.append(thread);
    wrapperDiv.append(spotify);
    collageContainer.append(wrapperDiv);
  }
  const collageContainer = document.createElement("div");
  collageContainer.classList.add("collage-container");
  collageContainer.classList.add("bg-red-circular-gradient");
  collageContainer.classList.add("base-container");

  pictues.forEach(({ url, properties = [], customFn }, index) => {
    if (customFn) {
      customFn({ index });
      return;
    }
    const wrapperDiv = document.createElement("div");
    wrapperDiv.style.height = "100%";
    wrapperDiv.style.width = "100%";
    wrapperDiv.style.position = "relative";
    wrapperDiv.style.gridArea = `img${index + 1}`;

    properties.forEach(({ element, styles = {}, props = {}, classes = [] }) => {
      const elem = document.createElement(element);
      Object.entries(props).forEach(([key, value]) => (elem[key] = value));
      Object.entries(styles).forEach(
        ([key, value]) => (elem.style[key] = value)
      );
      elem.classList.add(...classes);
      wrapperDiv.append(elem);
    });
    const img = document.createElement("img");
    img.src = url;
    img.alt = "image";
    wrapperDiv.append(img);

    collageContainer.append(wrapperDiv);
  });
  app.appendChild(collageContainer);
};

export default pictureCollage;
