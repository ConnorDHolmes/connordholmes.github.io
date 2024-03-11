"use strict";

//MAIN ELEMENTS
const root = document.documentElement;
const body = document.body;
const nav = document.querySelector("nav");
const startButton = document.getElementById("start-button");
const hiddenKey = document.querySelector("c-control[hide]");
const screen = document.querySelector("c-screen");

//PROJECT LIST
const list = document.querySelector("ul");
const listEntries = list.querySelectorAll("li");
const listCount = listEntries.length;
const listMap = new Map();

//RAF SPEED CONTROL
const fpsBenchmark = 60;
const frameDurationBenchmark = 1000 / fpsBenchmark;
let then = document.timeline.currentTime;
let multiplier = 1;

//use this to fire something every other frame
let everyOtherFrame = true;

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
  get scale() {
    return win.h / scene.h;
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
cameraPos.set("orbit", { hor: 3, vert: 2, zoom: -864, adj: 90 });
cameraPos.set("normal", { hor: 95, vert: 50, zoom: 512, adj: 0 });
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
      eased: 3,
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
      eased: 2,
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
};

//ALL EASING VALS
cursor.x.ease = cursor.y.ease = 0.25;
room.x.ease = room.y.ease = 0.15;
room.range.hor.ease = room.range.vert.ease = room.range.adj.ease = 0.05;
room.range.zoom.ease = 0.04;

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

//ADD CLASS (IF CLASS DOESN'T EXIST)
function addCl(el, cl) {
  if (!el.classList.contains(cl)) {
    el.classList.add(cl);
  }
}

//REMOVE CLASS (IF CLASS EXISTS)
function remCl(el, cl) {
  if (el.classList.contains(cl)) {
    el.classList.remove(cl);
  }
}

//TOGGLE CLASS
function togCl(el, cl) {
  el.classList.toggle(cl);
}

//ADD BOOLEAN ATTRIBUTE (IF ATTRIBUTE DOESN'T EXIST)
function addBl(el, attr) {
  if (!el.hasAttribute(attr)) {
    el.setAttribute(attr, "");
  }
}

//REMOVE BOOLEAN ATTRIBUTE (IF ATTRIBUTE EXISTS)
function remBl(el, attr) {
  if (el.hasAttribute(attr)) {
    el.removeAttribute(attr);
  }
}

//CLONE THE PROJECT LIST TO CREATE SEAMLESS WRAPPING
function cloneListEntries() {
  listEntries.forEach((entry) => {
    const clone = entry.cloneNode(true);
    listMap.set(entry, clone);
    listMap.set(clone, entry);
    list.append(clone);
  });
}

//CLONE THE SCREEN TO MAKE A REFLECTION
function cloneScreen() {
  const reflection = screen.cloneNode(true);

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
      if (list.scrollTop >= maxScroll) {
        listClone.scrollTop = list.scrollTop = 1;
      } else if (list.scrollTop === 0) {
        listClone.scrollTop = list.scrollTop = maxScroll - 1;
      } else {
        listClone.scrollTop = list.scrollTop += e.deltaY;
      }
    },
    { passive: true }
  );

  //APPEND REFLECTION INTO ROOM
  document.querySelector("c-reflection").append(reflection);
}

//ANIMATION EASING FUNCTION
function ease(val) {
  val.eased += (val.target - val.eased) * (val.ease * multiplier);
}

//UPDATE HOVERED ELEMENT (TAKING THE CURSOR'S EASING INTO ACCOUNT)
function updateHoveredEl() {
  if (!cursorEl.hasAttribute("hide")) {
    const el = document.elementFromPoint(cursor.x.eased, cursor.y.eased);
    if (hoverableEls.includes(el)) {
      hoverableEls.forEach((hoverableEl) => {
        //account for list entry clones
        if (hoverableEl === el || hoverableEl === listMap.get(el)) {
          addCl(hoverableEl, "hover");
        } else {
          remCl(hoverableEl, "hover");
        }
      });
      addBl(cursorEl, "clickable");
    } else {
      hoverableEls.forEach((hoverableEl) => {
        remCl(hoverableEl, "hover");
      });
      remBl(cursorEl, "clickable");
    }
  }
}

//ANIMATION AND OTHER UPDATES
function refresh(timeStamp) {
  const diff = timeStamp - then;
  then = timeStamp;
  multiplier = diff / frameDurationBenchmark;

  roomEl.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotate3d(1, 0, 0, ${room.tilt}deg) rotate3d(0, 1, 0, ${room.pan}deg)`;
  cursorEl.style.transform = `translate3d(${cursor.x.eased}px, ${cursor.y.eased}px, 0)`;

  easedTraits.forEach((trait) => {
    if (trait.isInactive) {
      return;
    }
    ease(trait);
  });

  if (everyOtherFrame) {
    updateHoveredEl();
  }
  everyOtherFrame = !everyOtherFrame;

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
  addBl(cursorEl, "hide");
}

//SCALE SCENE ON WINDOW RESIZE
window.addEventListener("resize", measureAndSize);

//RESET VIEW TO CENTER IF WINDOW LOSES FOCUS
window.addEventListener("blur", resetView);

//RESET VIEW TO CENTER IF DOCUMENT LOSES FOCUS
root.addEventListener("blur", resetView);

//UPDATE THE CURSOR
document.addEventListener("mousemove", (e) => {
  cursor.x.target = e.pageX - cursor.half;
  cursor.y.target = e.pageY - cursor.half;
  remBl(cursorEl, "hide");
});

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
root.addEventListener("mouseleave", resetView);

//HANDLE CURSOR RETURNING TO DOCUMENT
root.addEventListener("mouseenter", (e) => {
  cursor.x.eased = e.pageX - cursor.half;
  cursor.y.eased = e.pageY - cursor.half;
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
    remCl(body, "overlay");
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
document.addEventListener("click", (e) => {
  //enter focused mode from "work button"
  if (e.target === startButton) {
    addCl(nav, "hide");
    setTimeout(() => {
      room.range.mode = "focused";
      remBl(hiddenKey, "hide");
      remBl(roomEl, "backface");
      addCl(nav, "remove");
    }, 350);
  }
});

//ON LOAD
//change color mode if needed
if (window.matchMedia("(prefers-color-scheme: light)").matches) {
  addCl(body, "light-mode");
}
//update "data-text" attributes where needed
document.querySelectorAll("[data-text]").forEach((el) => {
  el.setAttribute("data-text", el.innerHTML);
});
cloneListEntries();
//include list clones in hoverableEls
const hoverableEls = [...document.querySelectorAll("[data-h]")];
cloneScreen();
measureAndSize();
requestAnimationFrame(refresh);
