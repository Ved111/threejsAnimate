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
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
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

          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
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
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
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
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
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
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          styles: { maxWidth: "100px" },
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
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
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
          styles: { whiteSpace: "pre-line" },
          props: {
            textContent:
              "Ingredient List\nBreakdown\nBenefits of\nDon Chico’s soda ",
          },
          classes: ["collage-text", "collage-btn-2"],
        },
        {
          element: "button",
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

          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
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
    flavorSwitch.style.position = "relative";

    ig.style.gridArea = "ig";
    thread.style.gridArea = "thread";
    thread.style.position = "relative";

    spotify.style.gridArea = "spotify";

    flavorSwitch.classList.add("border-black");
    ig.classList.add("border-black");
    thread.classList.add("border-black");
    spotify.classList.add("border-black");

    const flavorTitle = document.createElement("button");
    const igTitle = document.createElement("i");
    const threadTitle = document.createElement("button");
    const spotifyTitle = document.createElement("i");

    flavorTitle.textContent = "flavours switch";

    threadTitle.textContent = "thread";
    flavorTitle.classList.add("collage-text", "collage-btn-2");
    igTitle.classList.add(
      "fab",
      "fa-instagram",
      "d-flex",
      "align-items-center",
      "justify-content-center",
      "bg-white",
      "rem-2",
      "instagram-gradient"
    );
    threadTitle.classList.add("collage-text", "collage-btn-2");
    spotifyTitle.classList.add(
      "fab",
      "fa-spotify",
      "d-flex",
      "align-items-center",
      "justify-content-center",
      "bg-black",
      "rem-2",
      "color-spotify",
      "rounded-circle"
    );

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
    wrapperDiv.classList.add(`collage-${index + 1}`);

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
