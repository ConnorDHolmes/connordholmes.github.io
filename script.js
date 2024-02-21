//MAIN ELEMENTS
const root = document.documentElement;
const body = document.body;
const overlay = document.querySelector("c-overlay");
const buttonsRow = document.querySelector("c-buttons");
const startButton = buttonsRow.querySelector("#start-button");
const screen = document.querySelector("c-screen");

let currentlyHoveredEl = body;

//ROUND OFF TO 3 DECIMAL PLACES
function round(num) {
  return Math.round(num * 1000) / 1000;
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
  half: cursorEl.offsetWidth / 2,
};

//CAMERA CONFIGS
const cameraPos = new Map();
cameraPos.set("orbit", { hor: 4, vert: 3, zoom: -1024, adj: 90 });
cameraPos.set("normal", { hor: 90, vert: 90, zoom: 512, adj: 0 });
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
    },
    vert: {
      get target() {
        return cameraPos.get(room.range.mode).vert;
      },
      eased: 90,
      get cone() {
        return room.range.vert.eased * 2;
      },
    },
    zoom: {
      get target() {
        return cameraPos.get(room.range.mode).zoom;
      },
      eased: -2048,
    },
    adj: {
      get target() {
        return cameraPos.get(room.range.mode).adj;
      },
      eased: 90,
    },
    get pan() {
      return round(
        -room.range.hor.eased +
          (room.x.eased / win.w) * room.range.hor.cone +
          room.range.adj.eased
      );
    },
    get tilt() {
      return round(
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
  requestAnimationFrame(() => {
    el.classList.add(className);
  });
}

//REMOVE CLASS
function remCl(el, className) {
  requestAnimationFrame(() => {
    el.classList.remove(className);
  });
}

//TOGGLE CLASS
function togCl(el, className) {
  requestAnimationFrame(() => {
    el.classList.toggle(className);
  });
}

//ADD BOOLEAN ATTRIBUTE
function addBool(el, attribute) {
  requestAnimationFrame(() => {
    el.setAttribute(attribute, "");
  });
}

//REMOVE BOOLEAN ATTRIBUTE
function remBool(el, attribute) {
  requestAnimationFrame(() => {
    el.removeAttribute(attribute);
  });
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
  //MUTATION OBSERVER AND CALLBACK FUNCTION
  const classObserver = new MutationObserver(onClassListChange);
  function onClassListChange(changes) {
    changes.forEach((change) => {
      if (change.attributeName === "class") {
        pairs.get(change.target).classList = change.target.classList;
      } else if (change.attributeName === "style") {
        pairs
          .get(change.target)
          .setAttribute("style", change.target.getAttribute("style"));
      }
    });
  }
  //ONLY OBSERVE CHANGES IN ELEMENTS THAT MIGHT CHANGE (MUTABLE OR HOVERABLE)
  screenDescendants.forEach((descendant, index) => {
    if (
      descendant.hasAttribute("data-m") ||
      descendant.hasAttribute("data-h")
    ) {
      pairs.set(descendant, reflection.querySelectorAll("*")[index]);
      //REMOVE ID FROM CLONED ELEMENTS
      pairs.get(descendant).removeAttribute("id");

      classObserver.observe(descendant, {
        attributeFilter: ["class", "style"],
      });
    }
  });

  //ALL JS FUNCTIONALITY WITHIN SCREEN GOES HERE

  list.scrollTop = 1;
  pairs.get(list).scrollTo(1, list.scrollTop);

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
          list.scrollTop = 1;
        } else if (list.scrollTop === 0) {
          list.scrollTop = maxScroll - 1;
        } else {
          list.scrollTop += e.deltaY;
        }
        pairs.get(list).scrollTo(0, list.scrollTop);
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
    addBool(cursorEl, "clickable");
  } else {
    remBool(cursorEl, "clickable");
  }
}

//ANIMATION AND OTHER UPDATES
function refresh(timeStamp) {
  const diff = timeStamp - then;
  then = timeStamp;
  multiplier = diff / frameDurationBenchmark || 1;

  easedTraits.forEach((trait) => {
    ease(trait);
  });

  roomEl.style = `transform: translate3d(${room.xPos}px, ${room.yPos}px, ${room.range.zoom.eased}px) rotate3d(1, 0, 0, ${room.range.tilt}deg) rotate3d(0, 1, 0, ${room.range.pan}deg)`;

  cursorEl.style = `transform: translate3d(${cursor.x.eased - cursor.half}px, ${
    cursor.y.eased - cursor.half
  }px, 0)`;

  updateHoveredEl();

  requestAnimationFrame(refresh);
}

//SCALE THE SCENE TO FIT SCREEN HEIGHT AND RE-MEASURE WINDOW SIZE
function measureAndSize() {
  sceneEl.style = `transform: translate3d(${scene.x}px, ${scene.y}px, 0) scale3d(${scene.scale}, ${scene.scale}, 1)`;
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
    remCl(document.querySelector("footer span.hide"), "hide");
  }, 250);
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
  remBool(cursorEl, "hide");
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
