const pictureCollage = () => {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("#app container not found!");
    return;
  }

  const pictues = [
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_064103_oorc8q.png",
      classes: ["wide"],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065538_u9oeab.png",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065538_u9oeab.png",
      classes: ["wide"],
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234728/Screenshot_2025-06-29_064151_uqayx7.png",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_064312_ermy0h.png",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751234729/Screenshot_2025-06-29_065608_khvrzn.png",
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

  pictues.forEach(({ url, classes = [] }, index) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "image";
    img.style.gridArea = `img${index + 1}`;
    classes.forEach((item) => img.classList.add(item));
    collageContainer.append(img);
  });
  app.appendChild(collageContainer);
};

export default pictureCollage;
