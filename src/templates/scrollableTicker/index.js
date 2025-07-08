import { stickyScroll } from "../../utils";

const scrollableTicker = (gsap, ScrollTrigger) => {
  const customBorderSection = document.querySelector(".custom-border-section");
  const scrollableTickerContainer = document.createElement("div");
  const isMobile = window.innerWidth <= 768;

  const target = isMobile ? ".mobile-can-ui" : ".can-hero-section";
  scrollableTickerContainer.style.width = "100%";
  scrollableTickerContainer.style.height = "150px";
  scrollableTickerContainer.classList.add(
    "border",
    "border-5",
    "border-success",

    "scrollable-ticker-container"
  );

  scrollableTickerContainer.style.position = "fixed";
  scrollableTickerContainer.style.bottom = "0";

  scrollableTickerContainer.style.zIndex = "15";

  customBorderSection.appendChild(scrollableTickerContainer);

  //   stickyScroll(".scrollable-ticker-container", target, gsap, ScrollTrigger);
};

export default scrollableTicker;
