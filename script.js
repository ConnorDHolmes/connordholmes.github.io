"use strict";

//all easables
class EasableTrait {
  constructor(easing, target = 0) {
    this.target = target;
    this.eased = target;
    this.easing = easing;
  }

  get isActive() {
    return Math.abs(this.target - this.eased) > 0.001;
  }

  ease() {
    if (this.isActive)
      this.eased += (this.target - this.eased) * (this.easing * mult);
  }

  snap() {
    this.eased = this.target;
  }
}

//viewport
const vw = {
  w: window.innerWidth,
  h: window.innerHeight,
  midX: window.innerWidth * 0.5,
  midY: window.innerWidth * 0.5,

  recalc() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.midX = this.w * 0.5;
    this.midY = this.h * 0.5;
  },
};

//scene
const sn = {
  el: document.querySelector("c-scene"),

  scale() {
    this.h = this.el.offsetHeight;
    this.el.style.transform = `scale(${vw.h / this.el.offsetHeight})`;
  },
};

//room
const rm = {
  el: document.querySelector("c-room"),

  mode: 0,
  modes: [
    //orbit (0)
    { hRange: 6, vRange: 4, zoom: -864, adj: 90, rangeEasing: 0.01 },
    //normal (1)
    { hRange: 180, vRange: 100, zoom: 512, adj: 0, rangeEasing: 0.04 },
    //focused (2)
    { hRange: 2, vRange: 2, zoom: 576, adj: 0, rangeEasing: 0.04 },
  ],

  rangeEasing: new EasableTrait(0.01, 0.01),
  hRange: new EasableTrait(0.01, 6),
  vRange: new EasableTrait(0.01, 4),
  zoom: new EasableTrait(0.01, -864),
  adj: new EasableTrait(0.01, 90),
  x: new EasableTrait(0.15, vw.midX),
  y: new EasableTrait(0.15, vw.midY),

  get pan() {
    return (
      this.hRange.eased * -0.5 +
      (this.x.eased / vw.w) * this.hRange.eased +
      this.adj.eased
    );
  },

  get tilt() {
    return this.vRange.eased * 0.5 - (this.y.eased / vw.h) * this.vRange.eased;
  },

  setMode(num) {
    this.mode = num;
    this.hRange.target = this.modes[num].hRange;
    this.vRange.target = this.modes[num].vRange;
    this.zoom.target = this.modes[num].zoom;
    this.adj.target = this.modes[num].adj;
    this.rangeEasing.target = this.modes[num].rangeEasing;
  },

  update() {
    this.el.style.transform = `translate3d(0, 0, ${this.zoom.eased}px) rotate3d(1, 0, 0, ${this.tilt}deg) rotate3d(0, 1, 0, ${this.pan}deg)`;
  },
};

//cursor
const cs = {
  el: document.querySelector("c-cursor"),
  x: new EasableTrait(0.25, vw.midX),
  y: new EasableTrait(0.25, vw.midY),
  hf: null,

  measure() {
    this.hf = this.el.offsetWidth * 0.5;
  },

  update() {
    this.el.style.transform = `translate3d(${this.x.eased - this.hf}px, ${
      this.y.eased - this.hf
    }px, 0)`;
  },
};

const allEasables = [
  cs.x,
  cs.y,
  rm.x,
  rm.y,
  rm.hRange,
  rm.vRange,
  rm.zoom,
  rm.adj,
  rm.rangeEasing,
];

function easeAll() {
  rm.adj.easing =
    rm.hRange.easing =
    rm.vRange.easing =
    rm.zoom.easing =
      rm.rangeEasing.eased;
  allEasables.forEach((easable) => easable.ease());
}

function snapAll() {
  allEasables.forEach((easable) => easable.snap());
}

const root = document.documentElement,
  //MAIN
  body = document.body,
  nav = document.querySelector("nav"),
  startButton = document.getElementById("start"),
  email = document.querySelector("footer span"),
  resButton = document.getElementById("res"),
  hiddenKey = document.querySelector("c-control[hide]"),
  hoverables = [...document.querySelectorAll("[data-h]")],
  //PROJECT LIST
  list = document.querySelector("ul"),
  listEntries = list.querySelectorAll("li"),
  entryCount = listEntries.length,
  listPairs = new Map(),
  //RAF SPEED CONTROL
  frameDurationBenchmark = 1000 / 60,
  frameDurationMultiplier = 1 / frameDurationBenchmark,
  //ALL CLICK ACTIONS
  actions = new Map([
    [
      startButton,
      () => {
        addCl(nav, "hide");
        setTimeout(() => {
          rm.setMode(2);
          remBl(hiddenKey, "hide");
          remBl(rm.el, "backface");
          addCl(nav, "remove");
          [...listPairs.keys()].forEach((entry, index) =>
            setTimeout(() => remCl(entry, "hide"), (index + 10) * 125)
          );
          canScroll = true;
        }, 350);
      },
    ],
    [resButton, () => window.open("resume_placeholder.pdf", "_blank")],
  ]);

let then = document.timeline.currentTime,
  everyOtherFrame,
  canScroll = false,
  mult = 1;

//ADD CLASS (IF CLASS DOESN'T EXIST)
function addCl(el, cl) {
  !el.classList.contains(cl) &&
    requestAnimationFrame(() => el.classList.add(cl));
}

//REMOVE CLASS (IF CLASS EXISTS)
function remCl(el, cl) {
  el.classList.contains(cl) &&
    requestAnimationFrame(() => el.classList.remove(cl));
}

//TOGGLE CLASS
function togCl(el, cl) {
  requestAnimationFrame(() => el.classList.toggle(cl));
}

//ADD BOOLEAN ATTRIBUTE (IF ATTRIBUTE DOESN'T EXIST)
function addBl(el, attr) {
  !el.hasAttribute(attr) &&
    requestAnimationFrame(() => el.setAttribute(attr, ""));
}

//REMOVE BOOLEAN ATTRIBUTE (IF ATTRIBUTE EXISTS)
function remBl(el, attr) {
  el.hasAttribute(attr) &&
    requestAnimationFrame(() => el.removeAttribute(attr));
}

//SET PROJECT LINK BEHAVIOR
function bindLinks() {
  document.querySelectorAll("a").forEach((link) => {
    const destination = link.href;
    actions.set(link, () => window.open(destination, "_blank"));
    link.removeAttribute("href");
    link.removeAttribute("target");
  });
}

//ADD A CLASS TO THE BODY TO INDICATE YOU'RE BROWSING IN SAFARI
function detectSafari() {
  if (
    navigator.userAgent.indexOf("Safari") > -1 &&
    navigator.userAgent.indexOf("Chrome") === -1
  ) {
    body.classList.add("safari-compat");
  }
}

//CLONE THE PROJECT LIST ITEMS (TO CREATE SEAMLESS WRAPPING) AND BIND THEM TO ACTIONS
function cloneListEntries() {
  const sections = document.querySelectorAll("section");
  listEntries.forEach((entry, entryIndex) => {
    const clone = entry.cloneNode(true);
    listPairs.set(entry, clone).set(clone, entry);
    hoverables.push(clone);

    actions
      .set(entry, () => {
        sections.forEach((section, index) =>
          index === entryIndex ? togCl(section, "show") : remCl(section, "show")
        );
        [...listPairs.keys()].forEach((key) =>
          key === entry || key === clone
            ? togCl(key, "selected")
            : remCl(key, "selected")
        );
      })
      .set(clone, () => {
        sections.forEach((section, index) =>
          index === entryIndex + entryCount
            ? togCl(section, "show")
            : remCl(section, "show")
        );
        [...listPairs.keys()].forEach((key) =>
          key === entry || key === clone
            ? togCl(key, "selected")
            : remCl(key, "selected")
        );
      });
    list.append(clone);
  });
}

//CLONE THE SCREEN TO MAKE A REFLECTION
function cloneScreen() {
  const screen = document.querySelector("c-screen"),
    reflection = screen.cloneNode(true),
    pairs = new Map(),
    observer = new MutationObserver((changes) =>
      changes.forEach(
        (change) =>
          (pairs.get(change.target).classList = change.target.classList)
      )
    );
  //ONLY OBSERVE CHANGES IN ELEMENTS THAT MIGHT CHANGE (MUTABLE OR HOVERABLE)
  const reflectionMutables = [
    ...reflection.querySelectorAll("[data-m], [data-h]"),
  ];
  reflectionMutables.forEach((mutable) =>
    ["data-m", "data-h"].forEach((attr) => mutable.removeAttribute(attr))
  );

  [...screen.querySelectorAll("[data-m], [data-h]")].forEach(
    (mutable, index) => {
      pairs.set(mutable, reflectionMutables[index]);
      observer.observe(mutable, {
        attributeFilter: ["class"],
      });
    }
  );

  //list scrolling and looping
  const listClone = pairs.get(list);
  listClone.scrollTop = list.scrollTop = 1;

  const maxScroll =
    (listEntries[0].offsetHeight +
      parseInt(
        getComputedStyle(list).getPropertyValue("--gap").split("p")[0]
      )) *
    entryCount;

  document.addEventListener(
    "wheel",
    (e) => {
      if (canScroll) {
        if (list.scrollTop >= maxScroll) {
          listClone.scrollTop = list.scrollTop = 1;
        } else if (list.scrollTop === 0) {
          listClone.scrollTop = list.scrollTop = maxScroll - 1;
        } else {
          listClone.scrollTop = list.scrollTop += e.deltaY;
        }
      }
    },
    { passive: true }
  );

  //APPEND REFLECTION INTO ROOM
  document.querySelector("c-reflection").append(reflection);
}

//UPDATE HOVERED ELEMENT (TAKING THE CURSOR'S EASING INTO ACCOUNT)
function updateHoveredEl() {
  const el = document.elementFromPoint(cs.x.eased, cs.y.eased);
  if (hoverables.includes(el)) {
    hoverables.forEach((h) =>
      h === el || h === listPairs.get(el) ? addCl(h, "hov") : remCl(h, "hov")
    );
    addBl(cs.el, "clickable");
  } else {
    hoverables.forEach((h) => remCl(h, "hov"));
    remBl(cs.el, "clickable");
  }
}

function returningToTab() {
  cs.x.target = cs.x.eased = rm.x.eased = vw.midX;
  cs.y.target = cs.y.eased = rm.y.eased = vw.midY;
  snapAll();
  hoverables.forEach((h) => remCl(h, "hov"));
  remBl(cs.el, "clickable");
  addBl(cs.el, "hide");
}

//UPDATES FOR EACH FRAME
function refresh(timeStamp) {
  rm.update();
  cs.update();

  mult = (timeStamp - then) * frameDurationMultiplier;
  easeAll();

  everyOtherFrame && !cs.el.hasAttribute("hide") && updateHoveredEl();
  everyOtherFrame = !everyOtherFrame;

  then = timeStamp;
  requestAnimationFrame(refresh);
}

//SCALE THE SCENE TO FIT SCREEN HEIGHT AND RE-MEASURE WINDOW SIZE
function measureAndSize() {
  cs.measure();
  vw.recalc();
  sn.scale();
  resetView();
}

//RESET VIEW TO MIDDLE
function resetView() {
  cs.x.target = rm.x.target = vw.midX;
  cs.y.target = rm.y.target = vw.midY;
  addBl(cs.el, "hide");
}

//SCALE SCENE ON WINDOW RESIZE
window.addEventListener("resize", measureAndSize);

//RESET VIEW TO CENTER IF WINDOW LOSES FOCUS
window.addEventListener("blur", returningToTab);

//RESET VIEW TO CENTER IF DOCUMENT LOSES FOCUS
root.addEventListener("blur", returningToTab);
document.addEventListener("blur", returningToTab);

//RESET VALS WHEN CHANGING TABS/RETURNING TO TAB
window.addEventListener("visibilitychange", returningToTab);
document.addEventListener("focus", returningToTab);

//UPDATE THE CURSOR
document.addEventListener("mousemove", (e) => {
  cs.x.target = rm.x.target = e.pageX;
  cs.y.target = rm.y.target = e.pageY;
  remBl(cs.el, "hide");
});

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
root.addEventListener("mouseleave", resetView);

//HANDLE CURSOR RETURNING TO DOCUMENT
root.addEventListener("mouseenter", (e) => {
  cs.x.target = cs.x.eased = e.pageX;
  cs.x.target = cs.y.eased = e.pageY;
});

//ALL KEY INPUTS
document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    if (rm.mode !== 0) {
      if (rm.mode === 1) {
        rm.setMode(2);
      } else {
        rm.setMode(1);
      }
    }
  } else if (e.key === "m" || e.key === "M") {
    togCl(body, "light-mode");
  } else if (e.key === "e" || e.key === "E") {
    togCl(body, "performance-mode");
  }
});

//FADE IN SCENE AFTER ALL CONTENT IS LOADED
document.addEventListener(
  "readystatechange",
  (e) => e.target.readyState === "complete" && remCl(body, "overlay")
);

//WATCH FOR INTERFACE MODE PREFERENCE CHANGE
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) =>
    e.matches ? remCl(body, "light-mode") : addCl(body, "light-mode")
  );

//REMOVE A USER SELECTION WITHIN THE WINDOW
function removeSelection() {
  window.getSelection && window.getSelection().removeAllRanges();
  document.selection && document.selection.empty();
}

//ALL CLICK ACTIONS
document.addEventListener("click", (e) => {
  vw.w > 768
    ? actions.get(document.querySelector(".hov"))?.()
    : actions.get(e.target)?.();

  if (e.target !== email) {
    removeSelection();
  }
});

//ON LOAD

//change color mode if needed
window.matchMedia("(prefers-color-scheme: light)").matches &&
  addCl(body, "light-mode");

//update "data-text" attributes where needed
document
  .querySelectorAll("[data-text]")
  .forEach((el) => el.setAttribute("data-text", el.innerHTML));

detectSafari();
bindLinks();
cloneListEntries();
cloneScreen();
measureAndSize();
requestAnimationFrame(refresh);
