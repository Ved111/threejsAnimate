const recipe = () => {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("#app container not found!");
    return;
  }

  const recipesImageUrl = [
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751160558/Screenshot_2025-06-29_063912_gyrk3p.png",
      value: "Apricot something",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751160558/Screenshot_2025-06-29_063949_ak6qpf.png",
      value: "Strawberry cream soda",
    },
    {
      url: "https://res.cloudinary.com/dgkja1ija/image/upload/v1751160558/Screenshot_2025-06-29_064006_zadavo.png",
      value: "Watermelon mojito",
    },
  ];

  const handleClick = (recipeImgSelector, recipeButtonSelector) => {
    document
      .querySelectorAll(".recipe-image")
      .forEach((img) => img.classList.remove("border-dotted-red"));

    // Remove highlight from all buttons
    document
      .querySelectorAll(".recipe-button")
      .forEach((btn) => btn.classList.remove("btn-bg-red"));

    recipeImgSelector.classList.toggle("border-dotted-red");
    recipeButtonSelector.classList.toggle("btn-bg-red");
  };

  const recipeContainer = document.createElement("div");
  const recipeSection = document.createElement("div");
  const recipeTitle = document.createElement("h2");
  recipeContainer.classList.add("newRecipeContainer");
  recipeSection.classList.add("recipeSubContainer");
  recipeTitle.textContent = "Don's recipes";
  recipeContainer.appendChild(recipeTitle);
  recipeContainer.appendChild(recipeSection);

  recipesImageUrl.forEach(({ url, value }) => {
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("newRecipeCard");

    const recipeImg = document.createElement("img");
    recipeImg.src = url;
    recipeImg.alt = "Recipe Image";
    recipeImg.classList.add("recipe-image");
    recipeCard.appendChild(recipeImg);

    const recipeButton = document.createElement("button");
    recipeButton.classList.add("recipe-button");
    recipeButton.textContent = value;

    recipeCard.appendChild(recipeButton);
    recipeSection.appendChild(recipeCard);

    recipeImg.addEventListener(
      "click",
      handleClick.bind(null, recipeImg, recipeButton)
    );
    recipeButton.addEventListener(
      "click",
      handleClick.bind(null, recipeImg, recipeButton)
    );
  });
  app.appendChild(recipeContainer);
};

export default recipe;
