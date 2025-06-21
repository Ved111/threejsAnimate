import * as THREE from "three";
import { openCanAudioUrl } from "./utils";

export const openCanAudio = (camera) => {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const sound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();

  audioLoader.load(openCanAudioUrl, function (buffer) {
    sound.setBuffer(buffer);
    window.addEventListener(
      "click",
      () => {
        sound.play();
      },
      { once: true }
    );
  });
};
