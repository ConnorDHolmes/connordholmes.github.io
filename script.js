const win = {
  w: window.innerWidth,
  h: window.innerHeight,
  midX: window.innerWidth / 2,
  midY: window.innerHeight / 2,
};

const overlay = document.getElementById("overlay");

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
  halfW: document.querySelector("#cursor").offsetWidth / 2,
  halfH: document.querySelector("#cursor").offsetHeight / 2,
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
  cursor.el.style.transform = `translate3d(${cursor.easeX}px, ${cursor.easeY}px, 0)`;
}

function cloneScreen() {
  const screen = document.querySelector(".screen");
  const reflection = screen.cloneNode(true);
  reflection.classList.add("reflection");

  const screenDescendants = screen.querySelectorAll("*");
  const pairMap = new Map();
  //MUTATION OBSERVER AND CALLBACK FUNCTION
  const classObserver = new MutationObserver(onClassListChange);
  function onClassListChange(changes) {
    changes.forEach((change) => {
      pairMap.get(change.target).classList = change.target.classList;
    });
  }
  //ONLY OBSERVE CHANGES IN ELEMENTS THAT MIGHT CHANGE
  screenDescendants.forEach((descendant, index) => {
    if (
      descendant.hasAttribute("data-m") ||
      descendant.hasAttribute("data-h")
    ) {
      pairMap.set(descendant, reflection.querySelectorAll("*")[index]);
      classObserver.observe(descendant, {
        attributeFilter: ["class"],
      });
      //HOVER HANDLING FOR ALL SCREEN ELEMENTS WITH DATA-H (HOVERABLE) ATTRIBUTE
      if (descendant.hasAttribute("data-h")) {
        descendant.addEventListener("mouseenter", function () {
          this.classList.add("hover");
          cursor.el.classList.add("clickable");
        });
        descendant.addEventListener("mouseleave", function () {
          this.classList.remove("hover");
          cursor.el.classList.remove("clickable");
        });
      }
    }
  });

  //ALL JS FUNCTIONALITY WITHIN SCREEN
  //Example:
  document.getElementById("column-1").addEventListener("mouseup", function () {
    this.classList.toggle("red");
  });

  document.getElementById("reflection-wrapper").append(reflection);
}

function sizeFrame() {
  const scaleVal = win.h / scene.h;
  scene.el.style.transform = `translate3d(0, 0, 0) scale(${scaleVal})`;
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
  requestAnimationFrame(refresh);
}

function reveal() {
  overlay.classList.add("reveal");
}

window.addEventListener("resize", function () {
  resetMeasurements();
  sizeFrame();
});

window.addEventListener("blur", resetView);

document.addEventListener("mousemove", function (event) {
  cursor.el.style.visibility = "visible";
  cursor.x = event.pageX - cursor.halfW;
  cursor.y = event.pageY - cursor.halfH;
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

document.addEventListener("readystatechange", function (event) {
  if (event.target.readyState === "complete") {
    reveal();
  }
});

sizeFrame();
cloneScreen();
refresh();
