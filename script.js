"use strict";

//MAIN ELEMENTS
const root = document.documentElement;
const body = document.body;
const overlay = document.querySelector("c-overlay");
const buttonsRow = document.querySelector("c-buttons");
const startButton = buttonsRow.querySelector("#start-button");
const hiddenKey = document.querySelector("#hidden-key");
const screen = document.querySelector("c-screen");

const domChangeQueue = [];

let currentlyHoveredEl = body;
/* use this to skip run an action every other frame */
let debounceSwitch = true;

//ROUND OFF TO 3 DECIMAL PLACES
function round(num) {
  return Math.round(num * 1000) * 0.001;
}

//PROJECT LIST
const list = document.querySelector("c-list");
const listEntries = list.querySelectorAll("h3");
const listCount = listEntries.length;

//RAF SPEED CONTROL
const fpsBenchmark = 60;
const frameDurationBenchmark = 1000 / fpsBenchmark;
let then = document.timeline.currentTime;
let multiplier = 1;

//WINDOW TRAITS
const win = {
  get w() {
    return window.innerWidth;
  },
  get h() {
    return window.innerHeight;
  },
  get midX() {
    return win.w / 2;
  },
  get midY() {
    return win.h / 2;
  },
};

//SCENE
const sceneEl = document.querySelector("c-scene");
const scene = {
  h: sceneEl.offsetHeight,
  w: sceneEl.offsetWidth,
  get scale() {
    return win.h / scene.h;
  },
  get x() {
    return win.midX - scene.w * 0.5;
  },
  get y() {
    return win.midY - scene.h * 0.5;
  },
};

//CURSOR
const cursorEl = document.querySelector("c-cursor");
const cursor = {
  x: {
    target: win.midX,
    eased: win.midX,
  },
  y: {
    target: win.midY,
    eased: win.midY,
  },
  half: cursorEl.offsetWidth * 0.5,
};

//CAMERA CONFIGS
const cameraPos = new Map();
cameraPos.set("orbit", { hor: 4, vert: 3, zoom: -1024, adj: 90 });
cameraPos.set("normal", { hor: 90, vert: 60, zoom: 512, adj: 0 });
cameraPos.set("focused", { hor: 1, vert: 1, zoom: 576, adj: 0 });

//ROOM
const roomEl = document.querySelector("c-room");
const room = {
  range: {
    mode: "orbit",
    hor: {
      get target() {
        return cameraPos.get(room.range.mode).hor;
      },
      eased: 5,
      get cone() {
        return room.range.hor.eased * 2;
      },
      get isInactive() {
        return Math.abs(this.target - this.eased) < 0.5;
      },
    },
    vert: {
      get target() {
        return cameraPos.get(room.range.mode).vert;
      },
      eased: 90,
      get cone() {
        return room.range.vert.eased * 2;
      },
      get isInactive() {
        return Math.abs(this.target - this.eased) < 0.5;
      },
    },
    zoom: {
      get target() {
        return cameraPos.get(room.range.mode).zoom;
      },
      eased: -1024,
      get isInactive() {
        return Math.abs(this.target - this.eased) < 0.5;
      },
    },
    adj: {
      get target() {
        return cameraPos.get(room.range.mode).adj;
      },
      eased: 90,
      get isInactive() {
        return Math.abs(this.target - this.eased) < 0.5;
      },
    },
    get pan() {
      return (
        -room.range.hor.eased +
        (room.x.eased / win.w) * room.range.hor.cone +
        room.range.adj.eased
      );
    },
    get tilt() {
      return (
        room.range.vert.eased - (room.y.eased / win.h) * room.range.vert.cone
      );
    },
  },
  x: {
    get target() {
      return cursor.x.target;
    },
    eased: cursor.x.target,
  },
  y: {
    get target() {
      return cursor.y.target;
    },
    eased: cursor.y.target,
  },
  w: roomEl.offsetWidth,
  h: roomEl.offsetHeight,
  get xPos() {
    return scene.w * 0.5 - room.w * 0.5;
  },
  get yPos() {
    return scene.h * 0.5 - room.h * 0.5;
  },
};

//ALL EASING VALS
cursor.x.ease = cursor.y.ease = 0.25;
room.x.ease = room.y.ease = 0.15;
room.range.hor.ease =
  room.range.vert.ease =
  room.range.zoom.ease =
  room.range.adj.ease =
    0.05;

//LIST OF ALL TRAITS TO BE EASED EACH FRAME
const easedTraits = [
  cursor.x,
  cursor.y,
  room.x,
  room.y,
  room.range.hor,
  room.range.vert,
  room.range.zoom,
  room.range.adj,
];

//POPULATE "DATA-TEXT" ATTRIBUTES FOR DIVS THAT HAVE IT
function populateDataText() {
  document.querySelectorAll("[data-text]").forEach((el) => {
    el.setAttribute("data-text", el.innerHTML);
  });
}

//ADD CLASS
function addCl(el, className) {
  domChangeQueue.push([1, el, className]);
}

//REMOVE CLASS
function remCl(el, className) {
  domChangeQueue.push([2, el, className]);
}

//TOGGLE CLASS
function togCl(el, className) {
  domChangeQueue.push([3, el, className]);
}

//ADD BOOLEAN ATTRIBUTE
function addBool(el, attribute) {
  domChangeQueue.push([4, el, attribute]);
}

//REMOVE BOOLEAN ATTRIBUTE
function remBool(el, attribute) {
  domChangeQueue.push([5, el, attribute]);
}

//CLONE THE PROJECT LIST TO CREATE SEAMLESS WRAPPING
function cloneListEntries() {
  listEntries.forEach((entry) => {
    const clone = entry.cloneNode(true);
    list.append(clone);
  });
}

//CLONE THE SCREEN TO MAKE A REFLECTION
function cloneScreen() {
  const reflection = screen.cloneNode(true);
  addBool(reflection, "reflection");

  const screenDescendants = screen.querySelectorAll("*");
  const pairs = new Map();
  //REFLECTION MUTATION OBSERVER AND CALLBACK
  function onScreenChange(changes) {
    changes.forEach((change) => {
      pairs.get(change.target).classList = change.target.classList;
    });
  }
  const reflectionObserver = new MutationObserver(onScreenChange);

  //ONLY OBSERVE CHANGES IN ELEMENTS THAT MIGHT CHANGE (MUTABLE OR HOVERABLE)
  screenDescendants.forEach((descendant, index) => {
    if (
      descendant.hasAttribute("data-m") ||
      descendant.hasAttribute("data-h")
    ) {
      pairs.set(descendant, reflection.querySelectorAll("*")[index]);
      reflectionObserver.observe(descendant, {
        attributeFilter: ["class"],
      });
    }
  });

  //ALL JS FUNCTIONALITY WITHIN SCREEN GOES HERE

  //list scrolling and looping
  const listClone = pairs.get(list);
  listClone.scrollTop = list.scrollTop = 1;

  const itemHeight = listEntries[0].offsetHeight;
  const itemsGap = parseInt(
    getComputedStyle(list).getPropertyValue("--gap").split("p")[0]
  );
  const maxScroll = (itemHeight + itemsGap) * listCount;

  list.addEventListener(
    "wheel",
    (e) => {
      requestAnimationFrame(() => {
        if (list.scrollTop >= maxScroll) {
          listClone.scrollTop = list.scrollTop = 1;
        } else if (list.scrollTop === 0) {
          listClone.scrollTop = list.scrollTop = maxScroll - 1;
        } else {
          listClone.scrollTop = list.scrollTop += e.deltaY;
        }
      });
    },
    { passive: true }
  );

  //APPEND REFLECTION INTO ROOM
  document.querySelector("c-reflection").append(reflection);
}

//EASING FUNCTION (WITH MULTIPLIER)
function ease(val) {
  val.eased += (val.target - val.eased) * (val.ease * multiplier);
}

//UPDATE HOVERED ELEMENT (TAKING THE SCENE'S EASING INTO ACCOUNT)
function updateHoveredEl() {
  const prevEl = currentlyHoveredEl;
  currentlyHoveredEl = document.elementFromPoint(
    cursor.x.eased,
    cursor.y.eased
  );
  if (prevEl !== null && prevEl !== currentlyHoveredEl) {
    remCl(prevEl, "hover");
  }
  if (
    currentlyHoveredEl !== null &&
    currentlyHoveredEl.hasAttribute("data-h")
  ) {
    addCl(currentlyHoveredEl, "hover");
    if (!cursorEl.hasAttribute("clickable")) {
      addBool(cursorEl, "clickable");
    }
  } else {
    if (cursorEl.hasAttribute("clickable")) {
      remBool(cursorEl, "clickable");
    }
  }
}

//ANIMATION AND OTHER UPDATES
function refresh(timeStamp) {
  const diff = timeStamp - then;
  then = timeStamp;
  multiplier = diff / frameDurationBenchmark || 1;

  easedTraits.forEach((trait) => {
    if (trait.isInactive) {
      return;
    }
    ease(trait);
  });

  roomEl.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotate3d(1, 0, 0, ${room.range.tilt}deg) rotate3d(0, 1, 0, ${room.range.pan}deg)`;

  cursorEl.style.transform = `translate3d(${cursor.x.eased - cursor.half}px, ${
    cursor.y.eased - cursor.half
  }px, 0)`;

  if (debounceSwitch) {
    updateHoveredEl();
  }
  debounceSwitch = !debounceSwitch;

  while (domChangeQueue.length) {
    const change = domChangeQueue.shift();
    if (change[0] === 1) {
      change[1].classList.add(change[2]);
    } else if (change[0] === 2) {
      change[1].classList.remove(change[2]);
    } else if (change[0] === 3) {
      change[1].classList.toggle(change[2]);
    } else if (change[0] === 4) {
      change[1].setAttribute(change[2], "");
    } else if (change[0] === 5) {
      change[1].removeAttribute(change[2]);
    }
  }

  requestAnimationFrame(refresh);
}

//SCALE THE SCENE TO FIT SCREEN HEIGHT AND RE-MEASURE WINDOW SIZE
function measureAndSize() {
  sceneEl.style.transform = `scale(${scene.scale})`;
  resetView();
}

//RESET VIEW TO MIDDLE
function resetView() {
  cursor.x.target = win.midX;
  cursor.y.target = win.midY;
  addBool(cursorEl, "hide");
}

//REMOVE INITIAL OVERLAY
function reveal() {
  addCl(overlay, "reveal");
  setTimeout(() => {
    overlay.remove();
  }, 2000);
}

//ENTER FOCUSED MODE FROM "WORK" BUTTON
function navToScreen() {
  addBool(buttonsRow, "hide");
  setTimeout(() => {
    room.range.mode = "focused";
    remCl(hiddenKey, "hide");
    addCl(roomEl, "hide-backface");
  }, 500);
  setTimeout(() => {
    list.querySelectorAll("h3").forEach((header, index) => {
      setTimeout(() => {
        remCl(header, "hide");
      }, index * 100);
    });
  }, 1000);
}

//SCALE SCENE ON WINDOW RESIZE
window.addEventListener("resize", measureAndSize);

//RESET VIEW TO CENTER IF WINDOW LOSES FOCUS
window.addEventListener("blur", resetView);

//RESET VIEW TO CENTER IF DOCUMENT LOSES FOCUS
root.addEventListener("blur", resetView);

//UPDATE THE CURSOR
document.addEventListener("mousemove", (e) => {
  cursor.x.target = e.pageX;
  cursor.y.target = e.pageY;
  if (cursorEl.hasAttribute("hide")) {
    remBool(cursorEl, "hide");
  }
});

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
root.addEventListener("mouseleave", resetView);

//HANDLE CURSOR RETURNING TO DOCUMENT
root.addEventListener("mouseenter", (e) => {
  cursor.x.eased = e.pageX;
  cursor.y.eased = e.pageY;
});

//ALL INPUTS
document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    if (room.range.mode !== "orbit") {
      if (room.range.mode === "normal") {
        room.range.mode = "focused";
      } else {
        room.range.mode = "normal";
      }
    }
  } else if (e.key === "m" || e.key === "M") {
    togCl(body, "light-mode");
  } else if (e.key === "e" || e.key === "E") {
    togCl(body, "performance-mode");
  }
});

//FADE IN SCENE AFTER ALL CONTENT IS LOADED
document.addEventListener("readystatechange", (e) => {
  if (e.target.readyState === "complete") {
    reveal();
  }
});

//WATCH FOR INTERFACE MODE PREFERENCE CHANGE
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (e.matches) {
      remCl(body, "light-mode");
    } else {
      addCl(body, "light-mode");
    }
  });

//ALL CLICK HANDLERS
function addAllClickHandlers() {
  document.addEventListener("click", (e) => {
    if (e.target === startButton) {
      navToScreen();
    }
  });
}

//ON LOAD
if (window.matchMedia("(prefers-color-scheme: light)").matches) {
  addCl(body, "light-mode");
}

populateDataText();
cloneListEntries();
cloneScreen();
addAllClickHandlers();
measureAndSize();
requestAnimationFrame(refresh);
