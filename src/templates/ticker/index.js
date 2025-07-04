const ticker = () => {
  const app = document.querySelector("#app");
  if (!app) return;

  // Create ticker container
  const tickerContainer = document.createElement("div");
  tickerContainer.classList.add("bg-red-circular-gradient");
  tickerContainer.classList.add("base-container");
  tickerContainer.classList.add("ticker-main-container");

  const tickerMainContainer = document.createElement("div");
  tickerMainContainer.classList.add("ticker-container");

  const tickerContent = document.createElement("div");
  tickerContent.classList.add("ticker-content");
  tickerContent.classList.add("scroll");

  [1, 2, 3].forEach((item) => {
    const elem = document.createElement("div");
    elem.innerText = `text${item}`;
    tickerContent.append(elem);
  });

  const clone = tickerContent.cloneNode(true);

  tickerMainContainer.append(tickerContent);
  tickerMainContainer.append(clone);
  tickerContainer.append(tickerMainContainer);
  app.append(tickerContainer);
};

export default ticker;
