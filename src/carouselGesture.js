function handleSwipe({
  carouselLength = 1,
  callback = () => {},
  currentIndex = { value: 0 },
  touchStartX = 0,
  touchEndX = 0,
}) {
  const swipeDistance = touchEndX - touchStartX;
  if (Math.abs(swipeDistance) < 50) return;

  let newIndex;
  if (swipeDistance < 0) {
    // Swiped Left → Next Flavor
    newIndex = (currentIndex.value + 1) % carouselLength;
  } else {
    // Swiped Right → Previous Flavor
    newIndex = (currentIndex.value - 1 + carouselLength) % carouselLength;
  }
  currentIndex.value = newIndex;
  callback(newIndex);
}

export const carouselGesture = ({
  swipeArea = null,
  carouselLength = 1,
  callback = () => {},
  currentIndex = { value: 0 },
  condition = true,
}) => {
  if (!swipeArea || !condition) {
    return;
  }

  let touchStartX = 0;
  let touchEndX = 0;

  swipeArea.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  swipeArea.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;

    handleSwipe({
      carouselLength,
      callback,
      currentIndex,
      touchEndX,
      touchStartX,
    });
  });
};
