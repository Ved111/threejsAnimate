const reviewSection = () => {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("#app container not found!");
    return;
  }

  // Define reviews data, matching Shopify section presets
  const reviews = [
    {
      reviewText:
        "I could go on & on about the health benefits..but damn; this stuff is also tasty & addictive at the same time",
      reviewerName: "Aakash, Delhi",
      rating: 4.5,
    },
    {
      reviewText:
        "It's a game changer!! Haven't been very big on fizzy drinks all my life- but this has changed that. All hail the Don!",
      reviewerName: "Jo, Gangtok",
      rating: 5,
    },
    {
      reviewText:
        "LOVE Strawberry Cream! Makes me nostalgic & all refreshed at the same time",
      reviewerName: "Nidhi, Rohtak",
      rating: 4,
    },
    {
      reviewText: "A great drink & an even better mixer! ;)",
      reviewerName: "Shantanu, Bengaluru",
      rating: 4.5,
    },
    {
      reviewText:
        "You ever taste something & know that it's going to stay & conquer the scene? This is it guys. Way to go!",
      reviewerName: "Karim, Chennai",
      rating: 5,
    },
  ];

  // Create main container
  const reviewContainer = document.createElement("div");
  reviewContainer.classList.add("product-reviews");

  // Create section
  const reviewsSection = document.createElement("section");
  reviewsSection.classList.add("review-section");

  // Create heading
  const heading = document.createElement("h2");
  heading.classList.add("review-heading");
  heading.textContent = "Customer Reviews";
  reviewsSection.appendChild(heading);

  // Create slider wrapper
  const sliderWrapper = document.createElement("div");
  sliderWrapper.classList.add("carousel");

  // Create grid
  const reviewsGrid = document.createElement("div");
  reviewsGrid.classList.add("carousel-track");
  reviewsGrid.setAttribute("role", "list");
  reviewsGrid.setAttribute("aria-label", "Customer Reviews Slider");

  // Create reviews (original and cloned for seamless looping)
  const createReviewItem = (review, index) => {
    const reviewItem = document.createElement("div");
    reviewItem.classList.add("review-card");
    reviewItem.setAttribute("role", "listitem");

    const reviewBox = document.createElement("div");
    reviewBox.classList.add("review-card-content");

    const reviewText = document.createElement("p");
    reviewText.classList.add("review-text");
    reviewText.textContent = review.reviewText;

    const reviewerName = document.createElement("p");
    reviewerName.classList.add("reviewer-name");
    reviewerName.textContent = review.reviewerName;

    const reviewRating = document.createElement("div");
    reviewRating.classList.add("review-rating");

    const rating = document.createElement("div");
    rating.classList.add("rating");
    rating.setAttribute("role", "img");
    rating.setAttribute("aria-label", `${review.rating} out of 5 stars`);

    const ratingStar = document.createElement("span");
    ratingStar.classList.add("rating-star");
    ratingStar.style.setProperty("--rating", Math.floor(review.rating));
    ratingStar.style.setProperty("--rating-max", 5);
    ratingStar.style.setProperty("--rating-decimal", review.rating % 1);

    const ratingText = document.createElement("p");
    ratingText.classList.add("rating-text", "caption");
    ratingText.innerHTML = `<span>${review.rating} / 5</span>`;

    rating.appendChild(ratingStar);
    reviewRating.appendChild(rating);
    reviewRating.appendChild(ratingText);
    reviewBox.appendChild(reviewText);
    reviewBox.appendChild(reviewerName);
    reviewBox.appendChild(reviewRating);
    reviewItem.appendChild(reviewBox);
    return reviewItem;
  };

  // Append original and cloned reviews for seamless looping
  reviews.forEach((review, index) => {
    reviewsGrid.appendChild(createReviewItem(review, index));
  });
  reviews.forEach((review, index) => {
    reviewsGrid.appendChild(createReviewItem(review, index + reviews.length));
  });

  // Automatic scrolling
  let isScrolling = true;
  const scrollSpeed = 1; // Pixels per frame (60px/s at 60fps)
  let lastTime = 0;

  const scrollGrid = (timestamp) => {
    if (!isScrolling) {
      requestAnimationFrame(scrollGrid);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;

    // Scroll every ~16.67ms (60fps)
    if (deltaTime >= 16.67) {
      reviewsGrid.scrollLeft += scrollSpeed;
      // Reset to start for seamless looping (original content width = reviews.length * 200px)
      if (reviewsGrid.scrollLeft >= reviews.length * 200) {
        reviewsGrid.scrollLeft = 0;
      }
      lastTime = timestamp;
    }

    requestAnimationFrame(scrollGrid);
  };

  // Start scrolling
  requestAnimationFrame(scrollGrid);

  // Pause/resume on hover
  reviewsGrid.addEventListener("mouseover", () => {
    isScrolling = false;
  });
  reviewsGrid.addEventListener("mouseout", () => {
    isScrolling = true;
    lastTime = 0; // Reset time to avoid jump
  });

  // Append elements
  sliderWrapper.appendChild(reviewsGrid);
  reviewsSection.appendChild(sliderWrapper);
  reviewContainer.appendChild(reviewsSection);
  app.appendChild(reviewContainer);
};

export default reviewSection;
