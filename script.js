//MAIN ELEMENTS
const root = document.documentElement;
const body = document.body;
const overlay = document.querySelector("c-overlay");
const buttonsRow = document.querySelector("c-buttons");
const startButton = buttonsRow.querySelector("#start-button");
const screen = document.querySelector("c-screen");

//PROJECT LIST
const list = document.querySelector("c-list");
const listEntries = list.querySelectorAll("h3");
const listCount = listEntries.length;

let currentlyHoveredEl = body;

const fpsBenchmark = 60;
const frameDurationBenchmark = 1000 / fpsBenchmark;
let then = performance.now();
let multiplier = 1;

//WINDOW
const win = {
  w: window.innerWidth % 2 ? window.innerWidth + 1 : window.innerWidth,
  h: window.innerHeight % 2 ? window.innerHeight + 1 : window.innerHeight,
};
win.midX = win.w / 2;
win.midY = win.h / 2;

const scene = {
  el: document.querySelector("c-scene"),
};
scene.h = scene.el.offsetHeight;
scene.scale = win.h / scene.h;

//CURSOR
const cursor = {
  el: document.querySelector("c-cursor"),
  x: {
    target: win.midX,
    eased: win.midX,
  },
  y: {
    target: win.midY,
    eased: win.midY,
  },
};
cursor.half = cursor.el.offsetWidth / 2;

//CAMERA CONFIGS
const cameraPos = new Map();
cameraPos.set("orbit", { hor: 4, vert: 3, zoom: -1024, adj: 90 });
cameraPos.set("normal", { hor: 120, vert: 90, zoom: 512, adj: 0 });
cameraPos.set("focused", { hor: 1, vert: 1, zoom: 576, adj: 0 });

//ROOM
const room = {
  el: document.querySelector("c-room"),
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
  },
  x: {
    target: cursor.x.target,
    eased: cursor.x.target,
  },
  y: {
    target: cursor.y.target,
    eased: cursor.y.target,
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

//ADD CLASS
function addCl(el, className) {
  el.classList.add(className);
}

//REMOVE CLASS
function removeCl(el, className) {
  el.classList.remove(className);
}

//TOGGLE CLASS
function toggleCl(el, className) {
  el.classList.toggle(className);
}

//ADD BOOLEAN ATTRIBUTE
function addBoolAttr(el, attribute) {
  el.setAttribute(attribute, "");
}

//REMOVE BOOLEAN ATTRIBUTE
function removeBoolAttr(el, attribute) {
  el.removeAttribute(attribute);
}

//EASING FUNCTION (WITH MULTIPLIER)
function ease(val) {
  val.eased += (val.target - val.eased) * (val.ease * multiplier);
}

//ROUND OFF TO 3 DECIMAL PLACES
function round(num) {
  return Math.round(num * 1000) / 1000;
}

//UPDATE HOVERED ELEMENT (TAKING THE SCENE'S EASING INTO ACCOUNT)
function updateHoveredEl() {
  const prevEl = currentlyHoveredEl;
  currentlyHoveredEl = document.elementFromPoint(
    cursor.x.eased,
    cursor.y.eased
  );
  if (prevEl !== null && prevEl !== currentlyHoveredEl) {
    removeCl(prevEl, "hover");
  }
  if (
    currentlyHoveredEl !== null &&
    currentlyHoveredEl.hasAttribute("data-h")
  ) {
    addCl(currentlyHoveredEl, "hover");
    addBoolAttr(cursor.el, "clickable");
  } else {
    removeBoolAttr(cursor.el, "clickable");
  }
}

//CALCULATE VIEW PAN
function pan() {
  return round(
    -room.range.hor.eased +
      (room.x.eased / win.w) * room.range.hor.cone +
      room.range.adj.eased
  );
}

//CALCULATE VIEW TILT
function tilt() {
  return round(
    room.range.vert.eased - (room.y.eased / win.h) * room.range.vert.cone
  );
}

//ANIMATION AND OTHER UPDATES
function refresh(timeStamp) {
  const diff = timeStamp - then;
  then = timeStamp;

  multiplier = round(diff / frameDurationBenchmark) || 1;
  easedTraits.forEach((trait) => {
    ease(trait);
  });

  cursor.el.style.transform = `translate3d(${cursor.x.eased - cursor.half}px, ${
    cursor.y.eased - cursor.half
  }px, 0)`;

  room.el.style.transform = `translate3d(-50%, -50%, ${
    room.range.zoom.eased
  }px) rotate3d(1, 0, 0, ${tilt()}deg) rotate3d(0, 1, 0, ${pan()}deg)`;

  updateHoveredEl();

  requestAnimationFrame(refresh);
}

function cloneListEntries() {
  listEntries.forEach((entry) => {
    addCl(entry, "hide");
    const clone = entry.cloneNode(true);
    list.append(clone);
  });
}

function cloneScreen() {
  const reflection = screen.cloneNode(true);
  addBoolAttr(reflection, "reflection");

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
    function (e) {
      requestAnimationFrame(function () {
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

//SCALE THE SCENE TO FIT SCREEN HEIGHT AND RE-MEASURE WINDOW SIZE
function measureAndSize() {
  win.w = window.innerWidth % 2 ? window.innerWidth + 1 : window.innerWidth;
  win.h = window.innerHeight % 2 ? window.innerHeight + 1 : window.innerHeight;
  win.midX = win.w / 2;
  win.midY = win.h / 2;
  scene.scale = win.h / scene.h;
  scene.el.style.transform = `translate(-50%, -50%) scale(${scene.scale})`;
  resetView();
}

//RESET VIEW TO MIDDLE
function resetView() {
  cursor.x.target = room.x.target = win.midX;
  cursor.y.target = room.y.target = win.midY;
  cursor.el.style.opacity = "0";
}

//REMOVE INITIAL OVERLAY
function reveal() {
  addCl(overlay, "reveal");
  setTimeout(function () {
    overlay.remove();
  }, 1500);
}

//ENTER FOCUSED MODE FROM "WORK" BUTTON
startButton.addEventListener("click", function () {
  addBoolAttr(buttonsRow, "hide");
  setTimeout(function () {
    room.range.mode = "focused";
    removeCl(document.querySelector("footer span.hide"), "hide");
  }, 250);
  setTimeout(function () {
    list.querySelectorAll("h3").forEach((header, index) => {
      setTimeout(function () {
        removeCl(header, "hide");
      }, index * 100);
    });
  }, 1000);
});

//SCALE SCENE ON WINDOW RESIZE
window.addEventListener("resize", measureAndSize);

//RESET VIEW TO CENTER IF WINDOW LOSES FOCUS
window.addEventListener("blur", resetView);

//RESET VIEW TO CENTER IF DOCUMENT LOSES FOCUS
root.addEventListener("blur", resetView);

//UPDATE THE CURSOR
document.addEventListener("mousemove", function (e) {
  cursor.el.style.opacity = "1";
  cursor.x.target = room.x.target = e.pageX;
  cursor.y.target = room.y.target = e.pageY;
});

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
root.addEventListener("mouseleave", resetView);

//HANDLE CURSOR RETURNING TO DOCUMENT
root.addEventListener("mouseenter", function (e) {
  cursor.x.eased = e.pageX;
  cursor.y.eased = e.pageY;
});

//ALL INPUTS
document.addEventListener("keyup", function (event) {
  if (event.key === "Shift") {
    if (room.range.mode !== "orbit") {
      if (room.range.mode === "normal") {
        room.range.mode = "focused";
      } else {
        room.range.mode = "normal";
      }
    }
  } else if (event.key === "m" || event.key === "M") {
    toggleCl(body, "light-mode");
  }
});

//FADE IN SCENE AFTER ALL CONTENT IS LOADED
document.addEventListener("readystatechange", function (event) {
  if (event.target.readyState === "complete") {
    reveal();
  }
});

//WATCH FOR INTERFACE MODE PREFERENCE CHANGE
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", function (event) {
    if (event.matches) {
      removeCl(body, "light-mode");
    } else {
      addCl(body, "light-mode");
    }
  });

//ON LOAD
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  removeCl(body, "light-mode");
}

//POPULATE "DATA-TEXT" ATTRIBUTES FOR DIVS THAT HAVE IT
function populateDataText() {
  document.querySelectorAll("[data-text]").forEach((el) => {
    el.setAttribute("data-text", el.innerHTML);
  });
}

populateDataText();
cloneListEntries();
cloneScreen();
measureAndSize();
refresh();
