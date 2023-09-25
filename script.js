const overlay = document.getElementById("overlay");

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
  el: document.querySelector("#scene"),
  get h() {
    return scene.el.offsetHeight;
  },
  get scale() {
    return win.h / scene.h;
  },
};

const cursor = {
  el: document.querySelector("#cursor"),
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
  el: document.querySelector("#room"),
  range: {
    isFocused: false,
    hor: {
      get target() {
        return room.range.isFocused ? 1 : 120;
      },
      eased: 120,
      get cone() {
        return room.range.hor.eased * 2;
      },
    },
    vert: {
      get target() {
        return room.range.isFocused ? 1 : 90;
      },
      eased: 90,
      get cone() {
        return room.range.vert.eased * 2;
      },
    },
    zoom: {
      get target() {
        return room.range.isFocused ? 608 : 512;
      },
      eased: 512,
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
};

cursor.x.ease = cursor.y.ease = 0.25;
room.x.ease = room.y.ease = 0.15;
room.range.hor.ease = room.range.vert.ease = room.range.zoom.ease = 0.05;

function ease(val) {
  val.eased += (val.target - val.eased) * val.ease;
}

function refresh() {
  //CURSOR EASING
  ease(cursor.x);
  ease(cursor.y);

  //ROOM EASING
  ease(room.x);
  ease(room.y);
  ease(room.range.hor);
  ease(room.range.vert);
  ease(room.range.zoom);

  room.pan =
    -room.range.hor.eased + (room.x.eased / win.w) * room.range.hor.cone;
  room.tilt =
    room.range.vert.eased - (room.y.eased / win.h) * room.range.vert.cone;

  cursor.el.style.transform = `translate3d(${cursor.x.eased}px, ${cursor.y.eased}px, 0)`;
  room.el.style.transform = `translate3d(0, 0, ${room.range.zoom.eased}px) rotateX(${room.tilt}deg) rotateY(${room.pan}deg)`;

  requestAnimationFrame(refresh);
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
  //ONLY OBSERVE CHANGES IN ELEMENTS THAT MIGHT CHANGE (MUTABLE OR HOVERABLE)
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
  scene.el.style.transform = `translate3d(0, 0, 0) scale(${scene.scale})`;
}

function resetView() {
  cursor.el.style.visibility = "hidden";
  cursor.x.target = win.midX;
  cursor.y.target = win.midY;
}

function reveal() {
  overlay.classList.add("reveal");
}

window.addEventListener("resize", sizeFrame);

window.addEventListener("blur", resetView);

document.addEventListener("mousemove", function (event) {
  cursor.el.style.visibility = "visible";
  cursor.x.target = event.pageX - cursor.half;
  cursor.y.target = event.pageY - cursor.half;
});

document.documentElement.addEventListener("mouseleave", resetView);

document.documentElement.addEventListener("mouseenter", function (event) {
  cursor.x.target = cursor.x.eased = event.pageX;
  cursor.y.target = cursor.y.eased = event.pageY;
});

document.addEventListener("keyup", function (event) {
  if (event.key === "Shift") {
    room.range.isFocused = !room.range.isFocused;
  } else if (event.key === "m") {
    document.querySelector("body").classList.toggle("light-mode");
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
