const socialsSection = () => {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("#app container not found!");
    return;
  }

  // Mock Instagram data (replace with API or embed later)
  const instagramPosts = [
    {
      imageUrl: "https://via.placeholder.com/300x300.png?text=Post+1",
      caption: "Hanging out with Don Chico 🍹",
      link: "https://instagram.com/p/xxxx1",
    },
    {
      imageUrl: "https://via.placeholder.com/300x300.png?text=Post+2",
      caption: "Summer vibes ☀️",
      link: "https://instagram.com/p/xxxx2",
    },
    {
      imageUrl: "https://via.placeholder.com/300x300.png?text=Post+3",
      caption: "Gut health goals 💪",
      link: "https://instagram.com/p/xxxx3",
    },
  ];

  // Container
  const socialsContainer = document.createElement("div");
  socialsContainer.classList.add("socials-section");

  // Heading
  const heading = document.createElement("h2");
  heading.classList.add("socials-heading");
  heading.textContent = "Our Socials";
  socialsContainer.appendChild(heading);

  // Grid wrapper
  const socialsGrid = document.createElement("div");
  socialsGrid.classList.add("socials-grid");

  // Posts
  instagramPosts.forEach((post) => {
    const postCard = document.createElement("a");
    postCard.classList.add("social-card");
    postCard.href = post.link;
    postCard.target = "_blank";
    postCard.rel = "noopener noreferrer";

    postCard.innerHTML = `
        <div class="social-card-image" style="background-image: url('${post.imageUrl}')"></div>
        <div class="social-card-caption">${post.caption}</div>
      `;
    socialsGrid.appendChild(postCard);
  });

  socialsContainer.appendChild(socialsGrid);
  app.appendChild(socialsContainer);
};

export default socialsSection;
