"use strict";

//all easables
class EasableTrait {
  constructor(target, easing = null) {
    this.target = target;
    this.eased = target;
    this.easing = easing;
  }

  get isActive() {
    return Math.abs(this.target - this.eased) > 0.01;
  }

  ease() {
    if (this.isActive)
      this.eased +=
        (this.target - this.eased) * ((this.easing || rm.dynamicEase) * mult);
  }

  snap() {
    this.eased = this.target;
  }
}

//viewport
const vw = {
  w: window.innerWidth,
  h: window.innerHeight,
  hMult: 1 / window.innerWidth,
  vMult: 1 / window.innerHeight,
  midX: window.innerWidth * 0.5,
  midY: window.innerWidth * 0.5,

  measure() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.hMult = 1 / window.innerWidth;
    this.vMult = 1 / window.innerHeight;
    this.midX = this.w * 0.5;
    this.midY = this.h * 0.5;
  },
};

//scene
const scn = {
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
    //orbit
    { hRange: 6, vRange: 4, zoom: -768, adj: 90, rangeEasing: 0.01 },
    //normal
    { hRange: 190, vRange: 100, zoom: 512, adj: 0, rangeEasing: 0.04 },
    //focused
    { hRange: 2, vRange: 2, zoom: 576, adj: 0, rangeEasing: 0.04 },
  ],

  rangeEasing: new EasableTrait(0.005, 0.01),
  hRange: new EasableTrait(6),
  vRange: new EasableTrait(4),
  zoom: new EasableTrait(-768),
  adj: new EasableTrait(90),
  x: new EasableTrait(vw.midX, 0.15),
  y: new EasableTrait(vw.midY, 0.15),

  get dynamicEase() {
    return this.rangeEasing.eased;
  },

  get pan() {
    return (
      this.hRange.eased * -0.5 +
      this.x.eased * vw.hMult * this.hRange.eased +
      this.adj.eased
    );
  },

  get tilt() {
    return (
      this.vRange.eased * 0.5 - this.y.eased * vw.vMult * this.vRange.eased
    );
  },

  setMode(num) {
    this.rangeEasing.target = this.modes[num].rangeEasing;
    this.hRange.target = this.modes[num].hRange;
    this.vRange.target = this.modes[num].vRange;
    this.zoom.target = this.modes[num].zoom;
    this.adj.target = this.modes[num].adj;
    this.mode = num;
  },

  update() {
    this.el.style.transform = `translate3d(0, 0, ${this.zoom.eased}px) rotate3d(1, 0, 0, ${this.tilt}deg) rotate3d(0, 1, 0, ${this.pan}deg)`;
  },

  easeTraits() {
    this.x.ease();
    this.y.ease();
    this.rangeEasing.ease();
    this.hRange.ease();
    this.vRange.ease();
    this.zoom.ease();
    this.adj.ease();
  },
};

//cursor
const crs = {
  el: document.querySelector("c-cursor"),
  x: new EasableTrait(vw.midX, 0.25),
  y: new EasableTrait(vw.midY, 0.25),
  hf: null,
  isHidden: false,

  measure() {
    this.hf = this.el.offsetWidth * 0.5;
  },

  update() {
    this.el.style.transform = `translate3d(${this.x.eased - this.hf}px, ${
      this.y.eased - this.hf
    }px, 0)`;
  },

  hide() {
    this.isHidden = true;
    addCl(this.el, "hide");
  },

  show() {
    this.isHidden = false;
    remCl(this.el, "hide");
  },

  default() {
    remCl(this.el, "can-click");
  },

  canClick() {
    addCl(this.el, "can-click");
  },

  easeTraits() {
    this.x.ease();
    this.y.ease();
  },
};

//MAIN
const body = document.body;
const nav = document.querySelector("nav");
const startButton = document.getElementById("start");
const email = document.querySelector("footer span");
const resButton = document.getElementById("res");
const hiddenKey = document.querySelector("c-control.hide");
const hoverables = [...document.querySelectorAll("[data-h]")];

//PROJECT LIST
const list = document.querySelector("ul");
const listEntries = list.querySelectorAll("li");
const entryCount = listEntries.length;
const listPairs = new Map();
let canScroll = false;

//RAF SPEED CONTROL
const frameDurationMultiplier = 1 / (1000 / 60);
let then = performance.now();
let everyOtherFrame;
let mult = 1;

//ALL CLICK ACTIONS
const actions = new Map([
  [
    startButton,
    () => {
      addCl(nav, "hide");
      setTimeout(() => {
        rm.setMode(2);
        remCl(hiddenKey, "hide");
        remCl(rm.el, "backface");
        addCl(nav, "remove");
        [...listPairs.keys()].forEach((entry, index) =>
          setTimeout(() => remCl(entry, "hide"), (index + 20) * 125)
        );
        canScroll = true;
      }, 350);
    },
  ],
  [resButton, () => window.open("resume_placeholder.pdf", "_blank")],
]);

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
      changes.forEach((change) =>
        requestAnimationFrame(
          () => (pairs.get(change.target).classList = change.target.classList)
        )
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
  const el = document.elementFromPoint(crs.x.eased, crs.y.eased);
  if (hoverables.includes(el)) {
    hoverables.forEach((h) =>
      h === el || h === listPairs.get(el) ? addCl(h, "hov") : remCl(h, "hov")
    );
    crs.canClick();
  } else {
    hoverables.forEach((h) => remCl(h, "hov"));
    crs.default();
  }
}

//UPDATES FOR EACH FRAME
function step(timeStamp) {
  rm.update();
  crs.update();

  mult = (timeStamp - then) * frameDurationMultiplier;
  rm.easeTraits();
  crs.easeTraits();

  everyOtherFrame && !crs.isHidden && updateHoveredEl();
  everyOtherFrame = !everyOtherFrame;

  then = timeStamp;
  requestAnimationFrame(step);
}

//SCALE THE SCENE TO FIT SCREEN HEIGHT AND RE-MEASURE WINDOW SIZE
function measureAndSize() {
  crs.measure();
  vw.measure();
  scn.scale();
}

//WHEN TAB LOSES OR REGAINS FOCUS
function tabFocusChange() {
  crs.hide();
  resetView();
  crs.x.snap();
  crs.y.snap();
  rm.x.snap();
  rm.y.snap();
  hoverables.forEach((h) => remCl(h, "hov"));
  crs.default();
}

//UPDATE THE CURSOR
document.addEventListener("mousemove", (e) => {
  crs.x.target = rm.x.target = e.pageX;
  crs.y.target = rm.y.target = e.pageY;
  document.hasFocus() && crs.show();
});

//HANDLE CURSOR RETURNING TO DOCUMENT
document.documentElement.addEventListener("mouseenter", (e) => {
  crs.x.target = rm.x.target = e.pageX;
  crs.y.target = rm.y.target = e.pageY;
  crs.x.snap();
  crs.y.snap();
});

//RESET VIEW TO MIDDLE
function resetView() {
  crs.x.target = rm.x.target = vw.midX;
  crs.y.target = rm.y.target = vw.midY;
  crs.hide();
}

//SCALE SCENE ON WINDOW RESIZE
window.addEventListener("resize", () => {
  measureAndSize();
  resetView();
});

//RESET VALS WHEN CHANGING TABS/RETURNING TO TAB
window.addEventListener("visibilitychange", tabFocusChange);

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
document.documentElement.addEventListener("mouseleave", resetView);

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
  vw.w > 992
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
requestAnimationFrame(step);
