"use strict";
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
  //WINDOW TRAITS
  win = {
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
  },
  //SCENE
  sceneEl = document.querySelector("c-scene"),
  scene = {
    get h() {
      return sceneEl.offsetHeight;
    },
    get scale() {
      return win.h / scene.h;
    },
  },
  //CURSOR
  cursorEl = document.querySelector("c-cursor"),
  cursor = {
    x: {
      target: win.midX,
      eased: win.midX,
    },
    y: {
      target: win.midY,
      eased: win.midY,
    },
    half: cursorEl.offsetWidth * 0.5,
  },
  //CAMERA MODE OPTIONS
  camera = new Map([
    ["orbit", { hor: 3, vert: 2, zoom: -864, adj: 90 }],
    ["normal", { hor: 95, vert: 50, zoom: 512, adj: 0 }],
    ["focused", { hor: 1, vert: 1, zoom: 576, adj: 0 }],
  ]),
  //ROOM
  roomEl = document.querySelector("c-room"),
  room = {
    range: {
      mode: "orbit",
      hor: {
        get target() {
          return camera.get(room.range.mode).hor;
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
          return camera.get(room.range.mode).vert;
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
          return camera.get(room.range.mode).zoom;
        },
        eased: -1024,
        get isInactive() {
          return Math.abs(this.target - this.eased) < 0.5;
        },
      },
      adj: {
        get target() {
          return camera.get(room.range.mode).adj;
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
  },
  //LIST OF ALL TRAITS TO BE EASED EACH FRAME
  easedTraits = [
    cursor.x,
    cursor.y,
    room.x,
    room.y,
    room.range.hor,
    room.range.vert,
    room.range.zoom,
    room.range.adj,
  ],
  //ALL CLICK ACTIONS
  actions = new Map([
    [
      startButton,
      () => {
        addCl(nav, "hide");
        setTimeout(() => {
          room.range.mode = "focused";
          remBl(hiddenKey, "hide");
          remBl(roomEl, "backface");
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
//ALL EASING VALS
cursor.x.ease = cursor.y.ease = 0.25;
room.x.ease = room.y.ease = 0.15;
room.range.hor.ease = room.range.vert.ease = room.range.adj.ease = 0.05;
room.range.zoom.ease = 0.04;

let then = document.timeline.currentTime,
  everyOtherFrame,
  canScroll = false;

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

//ANIMATION EASING FUNCTION
function ease(val, mult) {
  val.eased += (val.target - val.eased) * (val.ease * mult);
}

//UPDATE HOVERED ELEMENT (TAKING THE CURSOR'S EASING INTO ACCOUNT)
function updateHoveredEl() {
  const el = document.elementFromPoint(cursor.x.eased, cursor.y.eased);
  if (hoverables.includes(el)) {
    hoverables.forEach((h) =>
      h === el || h === listPairs.get(el) ? addCl(h, "hov") : remCl(h, "hov")
    );
    addBl(cursorEl, "clickable");
  } else {
    hoverables.forEach((h) => remCl(h, "hov"));
    remBl(cursorEl, "clickable");
  }
}

function returningToTab() {
  cursor.x.target = cursor.x.eased = room.x.eased = win.midX;
  cursor.y.target = cursor.y.eased = room.y.eased = win.midY;
  remBl(cursorEl, "clickable");
  addBl(cursorEl, "hide");
}

//UPDATES FOR EACH FRAME
function refresh(timeStamp) {
  roomEl.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotate3d(1, 0, 0, ${room.tilt}deg) rotate3d(0, 1, 0, ${room.pan}deg)`;
  cursorEl.style.transform = `translate3d(${cursor.x.eased - cursor.half}px, ${
    cursor.y.eased - cursor.half
  }px, 0)`;

  const multiplier = (timeStamp - then) / frameDurationBenchmark;
  easedTraits.forEach((trait) => !trait.isInactive && ease(trait, multiplier));

  everyOtherFrame && !cursorEl.hasAttribute("hide") && updateHoveredEl();
  everyOtherFrame = !everyOtherFrame;

  //seems to fix buggy tab change behavior with view
  // if (
  //   cursor.x.eased > win.w + 16 ||
  //   cursor.x.eased < -16 ||
  //   room.x.eased > win.w + 16 ||
  //   room.x.eased < -16
  // ) {
  //   cursor.x.eased = win.midX;
  //   cursor.y.eased = win.midX;
  //   room.x.eased = win.midX;
  //   room.y.eased = win.midX;
  // }

  then = timeStamp;
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

//RESET VALS WHEN CHANGING TABS/RETURNING TO TAB
window.addEventListener("visibilitychange", returningToTab);
document.addEventListener("focus", returningToTab);

//UPDATE THE CURSOR
document.addEventListener("mousemove", (e) => {
  cursor.x.target = e.pageX;
  cursor.y.target = e.pageY;
  remBl(cursorEl, "hide");
});

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
root.addEventListener("mouseleave", resetView);

//HANDLE CURSOR RETURNING TO DOCUMENT
root.addEventListener("mouseenter", (e) => {
  cursor.x.eased = e.pageX;
  cursor.y.eased = e.pageY;
});

//ALL KEY INPUTS
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
  win.w > 768
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
