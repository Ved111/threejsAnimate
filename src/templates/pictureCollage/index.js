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
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234727/Screenshot_2025-06-29_065641_m2zjap.png",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_065701_o1p3o6.png",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_065750_cdculv.png",
    },
  ];
  const collageContainer = document.createElement("div");
  collageContainer.classList.add("collage-container");
  collageContainer.classList.add("bg-red-circular-gradient");
  collageContainer.classList.add("base-container");

  pictues.forEach(({ url, properties = [] }, index) => {
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
