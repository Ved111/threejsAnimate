import gsapDirect from "gsap";

export const openCanAudioUrl =
  "https://donchico.s3.eu-north-1.amazonaws.com/soda-can-opening-169337_aekjbs.mp3";

export const flavors = [
  {
    name: "Applecot Relish",
    src: "https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-07-06_at_6.46.44_PM-removebg-preview_plvti6.png",
    bg: "https://donchico.s3.eu-north-1.amazonaws.com/4_3_byfiaa.png",
  },
  {
    name: "Watermelon Sorbet",
    src: "https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-07-06_at_6.46.49_PM-removebg-preview_vfaaiy.png",
    bg: "https://donchico.s3.eu-north-1.amazonaws.com/2_1_qc6ltq.png",
  },
  {
    name: "Strawberry Cream",
    src: "https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-07-06_at_6.52.44_PM__2_-removebg-preview_waewbq.png",
    bg: "https://donchico.s3.eu-north-1.amazonaws.com/3_1_hajus7.png",
  },
];

export const bubbleImageUrl =
  "https://donchico.s3.eu-north-1.amazonaws.com/Screenshot_2025-06-30_at_2.23.57_PM-removebg-preview_1_yz6e5n.png";

export const stickyScroll = (sticky, target) => {
  const stickyElement = document.querySelector(sticky);
  const targetElement = document.querySelector(target);

  if (!stickyElement || !targetElement) {
    console.error("Sticky or target element not found");
    return;
  }

  setTimeout(() => {
    gsap.to(stickyElement, {
      scrollTrigger: {
        trigger: stickyElement,
        start: "top 20px",
        endTrigger: targetElement,
        end: "bottom bottom",
        pin: true,
        pinSpacing: false,
        scrub: true,
        // markers: true, // Remove markers in production
      },
    });
  }, 5000);
};
