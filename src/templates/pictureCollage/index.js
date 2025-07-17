const pictureCollage = () => {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("#app container not found!");
    return;
  }

  const pictues = [
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702184/IMG_7516_1_abjhzq.jpg",
      properties: [
        {
          element: "button",
          props: {
            textContent: "About Us",
            redirectUrl: "https://www.drinkdonchico.com/pages/our-story",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          props: {
            textContent: "brand story",
            redirectUrl: "https://www.drinkdonchico.com/pages/our-story",
          },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065538_u9oeab.png",
      customFn: createDiv,
    },
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702169/image_1_ydnyqy.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "Our Story",
            redirectUrl: "https://www.drinkdonchico.com/pages/our-story-1",
          },

          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          props: {
            textContent: "founder story",
            redirectUrl: "https://www.drinkdonchico.com/pages/our-story",
          },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702354/IMG_7630_1_vl9vv1.jpg",
      properties: [
        {
          element: "button",
          props: {
            textContent: "learn more",
            redirectUrl:
              "https://www.drinkdonchico.com/pages/why-prebiotics-what-exactly-do-they-do",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          props: {
            textContent: "why prebiotic ?",
            redirectUrl: "https://www.drinkdonchico.com/pages/why-prebiotic",
          },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702468/IMG_7626_1_wxubd7.jpg",
      properties: [
        {
          element: "button",
          props: {
            textContent: "view sodas",
            redirectUrl: "https://www.drinkdonchico.com/collections/all",
          },
          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          props: {
            textContent: "product page",
            redirectUrl: "https://www.drinkdonchico.com/collections/all",
          },
          classes: ["collage-text", "collage-btn-2"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702840/Screenshot_2025-07-17_at_3.23.36_AM_umlhzf.png",
      properties: [
        {
          element: "button",
          props: {
            textContent: "recipes",
            redirectUrl: "https://www.drinkdonchico.com/blogs/recipes",
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
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702940/IMG_7629_1_v4l6wv.jpg",
      properties: [
        {
          element: "button",
          props: {
            textContent: "FAQ'S",
            redirectUrl: "https://www.drinkdonchico.com/pages/why-prebiotic",
          },
          classes: ["collage-btn", "collage-text"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702593/IMG_7627_1_ldmvdx.jpg",
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
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752702697/IMG_7628_1_vmpy4t.jpg",
      properties: [
        {
          element: "button",
          styles: { whiteSpace: "pre-line" },
          props: {
            textContent:
              "Ingredient List\nBreakdown\nBenefits of\nDon Chico’s soda ",
            redirectUrl: "https://www.drinkdonchico.com/blogs/news/ingredients",
          },
          classes: ["collage-text", "collage-btn-2"],
        },
        {
          element: "button",
          props: {
            textContent: "soda benefits",
            redirectUrl:
              "https://www.drinkdonchico.com/pages/benefits-of-don-chicos-soda-with-benefits",
          },
          classes: ["collage-text", "collage-btn"],
        },
      ],
    },
    {
      url: "https://res.cloudinary.com/do7dxrdey/image/upload/v1752703085/IMG_7631_2_eul96x.jpg",
      properties: [
        {
          element: "button",
          props: {
            textContent: "Don's Lore",
            redirectUrl:
              "https://www.drinkdonchico.com/pages/don-chicos-legend",
          },

          classes: ["collage-btn", "collage-text"],
        },
        {
          element: "button",
          props: {
            textContent: "brand love",
            redirectUrl: "https://www.drinkdonchico.com/pages/our-story",
          },
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

    flavorSwitch.classList.add("flavorSwitch");
    ig.classList.add("border-black");
    thread.classList.add("border-black");
    spotify.classList.add("border-black");

    const igTitle = document.createElement("i");
    const spotifyTitle = document.createElement("i");
    const threadTitle = document.createElement("img");

    flavorSwitch.textContent = "Follow us here";

    threadTitle.textContent = "thread";
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
    // Twitter/X image icon
    threadTitle.src =
      "https://res.cloudinary.com/do7dxrdey/image/upload/v1752705953/sl_z_072523_61700_05-removebg-preview_qe4kfn.png";
    threadTitle.alt = "Twitter X";
    threadTitle.style.width = "32px";
    threadTitle.style.height = "32px";
    threadTitle.classList.add(
      "d-flex",
      "align-items-center",
      "justify-content-center"
    );
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

    // ✅ Add image
    const img = document.createElement("img");
    img.src = url;
    img.alt = "image";
    img.addEventListener("click", () => {
      // You can redirect or show modal here
    });
    wrapperDiv.append(img);

    // ✅ Add buttons with click listeners
    properties.forEach(({ element, styles = {}, props = {}, classes = [] }) => {
      const elem = document.createElement(element);

      Object.entries(props).forEach(([key, value]) => {
        elem[key] = value;
      });

      Object.entries(styles).forEach(([key, value]) => {
        elem.style[key] = value;
      });

      elem.classList.add(...classes);

      // ✅ Add redirect logic if redirectUrl is defined
      if (props.redirectUrl) {
        elem.addEventListener("click", () => {
          window.top.location.href = props.redirectUrl;
        });
      }

      wrapperDiv.append(elem);
    });

    collageContainer.append(wrapperDiv);
  });

  app.appendChild(collageContainer);
};

export default pictureCollage;
