const win = {
  w: window.innerWidth,
  h: window.innerHeight,
  midX: window.innerWidth / 2,
  midY: window.innerHeight / 2,
};

const scene = {
  el: document.querySelector("#scene"),
  h: document.querySelector("#scene").offsetHeight,
};

const cursor = {
  el: document.querySelector("#cursor"),
  x: win.midX,
  y: win.midY,
  easeX: win.midX,
  easeY: win.midY,
  ease: 0.25,
  w: document.querySelector("#cursor").offsetWidth,
  h: document.querySelector("#cursor").offsetHeight,
};

const room = {
  el: document.querySelector("#room"),
  view: {
    focus: false,
    h: 120,
    v: 90,
    focusH: 3,
    focusV: 2,
    easeH: 120,
    easeV: 90,
    ease: 0.05,
  },
  ease: 0.15,
  easeX: win.midX,
  easeY: win.midY,
};

function orientRoom() {
  room.view.easeH +=
    ((room.view.focus ? room.view.focusH : room.view.h) - room.view.easeH) *
    room.view.ease;
  room.view.easeV +=
    ((room.view.focus ? room.view.focusV : room.view.v) - room.view.easeV) *
    room.view.ease;

  room.easeX += (cursor.x - room.easeX) * room.ease;
  room.easeY += (cursor.y - room.easeY) * room.ease;

  const tiltX = -room.view.easeH + (room.easeX / win.w) * (room.view.easeH * 2);
  const tiltY = room.view.easeV - (room.easeY / win.h) * (room.view.easeV * 2);

  room.el.style.transform = `translate3d(0, 0, 512px) rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
}

function contextCursor() {
  cursor.easeX += (cursor.x - cursor.easeX) * cursor.ease;
  cursor.easeY += (cursor.y - cursor.easeY) * cursor.ease;

  cursor.el.style.transform = `translate3d(${cursor.easeX - cursor.w / 2}px, ${
    cursor.easeY - cursor.h / 2
  }px, 0)`;
}

function cloneScreen() {
  const screen = document.querySelector(".screen");
  const reflection = screen.cloneNode(true);
  reflection.classList.add("reflection");

  const screenDescendants = screen.querySelectorAll("*");
  const reflectionDescendants = reflection.querySelectorAll("*");
  const pairs = [];
  screenDescendants.forEach((descendant, index) => {
    pairs.push([descendant, reflectionDescendants[index]]);
  });

  //ROUTE ALL JAVASCRIPT ACTIONS WITHIN SCREEN THROUGH THIS FUNCTION
  pairs.forEach((pair) => {
    pair[0].addEventListener("mouseenter", function () {
      pair[0].classList.add("hover");
      pair[1].classList.add("hover");
    });
    pair[0].addEventListener("mouseleave", function () {
      pair[0].classList.remove("hover");
      pair[1].classList.remove("hover");
    });
  });

  document.getElementById("reflection-wrapper").append(reflection);
}

function sizeFrame() {
  const scaleVal = win.h / scene.h;
  scene.el.style.transform = `scale(${scaleVal})`;
}

function resetMeasurements() {
  win.w = window.innerWidth;
  win.h = window.innerHeight;
  win.midX = win.w / 2;
  win.midY = win.h / 2;
  scene.h = scene.el.offsetHeight;
}

function resetView() {
  cursor.el.style.visibility = "hidden";
  cursor.x = win.midX;
  cursor.y = win.midY;
}

function refresh() {
  orientRoom();
  contextCursor();
  sizeFrame();
  requestAnimationFrame(refresh);
}

window.addEventListener("resize", resetMeasurements);

window.addEventListener("blur", resetView);

document.addEventListener("mousemove", function (event) {
  cursor.el.style.visibility = "visible";
  cursor.x = event.pageX;
  cursor.y = event.pageY;
});

document.documentElement.addEventListener("mouseleave", resetView);

document.documentElement.addEventListener("mouseenter", function (event) {
  cursor.x = event.pageX;
  cursor.y = event.pageY;
  cursor.easeX = event.pageX;
  cursor.easeY = event.pageY;
});

document.addEventListener("keyup", function (event) {
  if (event.key === "Shift") {
    room.view.focus = !room.view.focus;
  } else if (event.key === "m") {
    document.querySelector("body").classList.toggle("light-mode");
    console.log("mode switched");
  }
});

cloneScreen();
refresh();
