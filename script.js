const root = document.documentElement;
const body = document.body;
const overlay = document.getElementById("overlay");
const buttonsRow = document.getElementById("buttons-row");
const startButton = document.getElementById("start-button");

let currentlyHoveredEl = body;

const refreshBenchmark = 60;
let isSampling = true;
let now = performance.now();
const sampleSet = [];
let throttleEasing = false;
let canUpdateVals = true;

const cameraPos = new Map();
cameraPos.set("orbit", { hor: 3, vert: 3, zoom: -1024, adj: 90 });
cameraPos.set("normal", { hor: 120, vert: 90, zoom: 512, adj: 0 });
cameraPos.set("focused", { hor: 1, vert: 1, zoom: 640, adj: 0 });

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

const scene = {
  el: document.getElementById("scene"),
  get h() {
    return scene.el.offsetHeight;
  },
  get scale() {
    return win.h / scene.h;
  },
};

const cursor = {
  el: document.getElementById("cursor"),
  x: {
    target: win.midX,
    eased: win.midX,
  },
  y: {
    target: win.midY,
    eased: win.midY,
  },
  get half() {
    return cursor.el.offsetWidth / 2;
  },
};

const room = {
  el: document.getElementById("room"),
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
      eased: 512,
    },
    adj: {
      get target() {
        return cameraPos.get(room.range.mode).adj;
      },
      eased: 90,
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

//IF SCREEN REFRESH RATE APPEARS TO BE >= 120HZ, ADJUST ALL EASING VALUES TO COMPENSATE
function updateMultiplier() {
  let total = 0;
  sampleSet.forEach((sample) => {
    total += sample;
  });
  const average = total / sampleSet.length;
  const frameRate = 1000 / average;
  const roundedFrameRate = Math.round(frameRate / 10) * 10;
  if (roundedFrameRate >= 120) {
    cursor.x.ease = cursor.y.ease = 0.13;
    room.x.ease = room.y.ease = 0.08;
    room.range.hor.ease =
      room.range.vert.ease =
      room.range.zoom.ease =
      room.range.adj.ease =
        0.03;
  }
}

//HANDLE THROTTLING
function handleThrottle() {
  let total = 0;
  sampleSet.forEach((sample) => {
    total += sample;
  });
  const average = total / sampleSet.length;
  const frameRate = 1000 / average;
  const roundedFrameRate = Math.round(frameRate / 10) * 10;
  if (roundedFrameRate >= 120) {
    throttleEasing = true;
  }
}

//EASING FUNCTION
function ease(val) {
  val.eased += (val.target - val.eased) * val.ease;
}

//UPDATE HOVERED ELEMENT (TAKING THE SCENE'S EASING INTO ACCOUNT)
function updateHoveredEl() {
  const prevEl = currentlyHoveredEl;

  currentlyHoveredEl = document.elementFromPoint(
    cursor.x.eased,
    cursor.y.eased
  );

  if (prevEl !== null && prevEl !== currentlyHoveredEl) {
    prevEl.classList.remove("hover");
  }

  if (
    currentlyHoveredEl !== null &&
    currentlyHoveredEl.hasAttribute("data-h")
  ) {
    currentlyHoveredEl.classList.add("hover");
    cursor.el.classList.add("clickable");
  } else {
    cursor.el.classList.remove("clickable");
  }
}

//RAF AND SAMPLE FRAME UPDATE RATE
function refreshAndSample() {
  then = now;
  now = performance.now();
  sampleSet.push(now - then);
  if (sampleSet.length > 200) {
    isSampling = false;
    handleThrottle();
  }

  room.el.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotateX(${room.tilt}deg) rotateY(${room.pan}deg)`;
  cursor.el.style.transform = `translate3d(${cursor.x.eased}px, ${cursor.y.eased}px, 0)`;

  easedTraits.map((trait) => {
    ease(trait);
  });

  updateHoveredEl();

  if (isSampling) {
    requestAnimationFrame(refreshAndSample);
  } else {
    if (throttleEasing) {
      requestAnimationFrame(refreshAndThrottle);
    } else {
      requestAnimationFrame(refresh);
    }
  }
}

//RAF
function refresh() {
  room.el.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotateX(${room.tilt}deg) rotateY(${room.pan}deg)`;
  cursor.el.style.transform = `translate3d(${cursor.x.eased}px, ${cursor.y.eased}px, 0)`;

  easedTraits.map((trait) => {
    ease(trait);
  });

  updateHoveredEl();

  requestAnimationFrame(refresh);
}

//THROTTLED RAF
function refreshAndThrottle() {
  room.el.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotateX(${room.tilt}deg) rotateY(${room.pan}deg)`;
  cursor.el.style.transform = `translate3d(${cursor.x.eased}px, ${cursor.y.eased}px, 0)`;

  if (canUpdateVals) {
    canUpdateVals = false;
    easedTraits.map((trait) => {
      ease(trait);
    });
  } else {
    canUpdateVals = true;
  }

  updateHoveredEl();

  requestAnimationFrame(refreshAndThrottle);
}

function cloneScreen() {
  const screen = document.querySelector(".screen");
  const reflection = screen.cloneNode(true);
  reflection.classList.add("reflection");

  const screenDescendants = screen.querySelectorAll("*");
  const pairs = new Map();
  //MUTATION OBSERVER AND CALLBACK FUNCTION
  const classObserver = new MutationObserver(onClassListChange);
  async function onClassListChange(changes) {
    changes.forEach((change) => {
      pairs.get(change.target).classList = change.target.classList;
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
        attributeFilter: ["class"],
      });
    }
  });

  //ALL JS FUNCTIONALITY WITHIN SCREEN
  //EXAMPLE:
  document.getElementById("column-1").addEventListener("mouseup", function () {
    this.classList.toggle("red");
  });

  document.getElementById("reflection-wrapper").append(reflection);
}

//SCALE THE SCENE TO FIT SCREEN HEIGHT
function sizeFrame() {
  scene.el.style.transform = `translate3d(0, 0, 0) scale(${scene.scale})`;
}

//RESET VIEW TO MIDDLE
function resetView() {
  cursor.el.style.visibility = "hidden";
  cursor.x.target = win.midX;
  cursor.y.target = win.midY;
}

//REMOVE INITIAL OVERLAY
function reveal() {
  overlay.classList.add("reveal");
}

startButton.addEventListener("click", function () {
  buttonsRow.classList.add("hide");
  setTimeout(function () {
    room.range.mode = "focused";
    document.querySelector("#hud span.hide").classList.remove("hide");
  }, 500);
});

//SCALE SCENE ON WINDOW RESIZE
window.addEventListener("resize", sizeFrame);

//RESET VIEW TO CENTER IF WINDOW LOSES FOCUS
window.addEventListener("blur", resetView);

//UPDATE THE CURSOR
document.addEventListener("mousemove", function (event) {
  cursor.el.style.visibility = "visible";
  cursor.x.target = event.pageX - cursor.half;
  cursor.y.target = event.pageY - cursor.half;
});

//RESET VIEW TO CENTER IF CURSOR EXITS DOCUMENT
root.addEventListener("mouseleave", resetView);

//HANDLE CURSOR RETURNING TO DOCUMENT
root.addEventListener("mouseenter", function (event) {
  cursor.x.target = cursor.x.eased = event.pageX;
  cursor.y.target = cursor.y.eased = event.pageY;
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
  } else if (event.key === "m") {
    body.classList.toggle("light-mode");
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
      body.classList.remove("light-mode");
    } else {
      body.classList.add("light-mode");
    }
  });

//ON LOAD
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  body.classList.remove("light-mode");
}

sizeFrame();
cloneScreen();
refreshAndSample();
