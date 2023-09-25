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
  ease: 0.25,
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
        return room.range.isFocused ? 3 : 120;
      },
      eased: 120,
    },
    vert: {
      get target() {
        return room.range.isFocused ? 2 : 90;
      },
      eased: 90,
    },
    ease: 0.05,
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
  ease: 0.15,
};

function ease(val, easing) {
  val.eased += (val.target - val.eased) * easing;
}

function refresh() {
  //CURSOR EASING
  ease(cursor.x, cursor.ease);
  ease(cursor.y, cursor.ease);

  //ROOM EASING
  ease(room.x, room.ease);
  ease(room.y, room.ease);
  ease(room.range.hor, room.range.ease);
  ease(room.range.vert, room.range.ease);

  const tilt =
    -room.range.hor.eased + (room.x.eased / win.w) * (room.range.hor.eased * 2);
  const pan =
    room.range.vert.eased -
    (room.y.eased / win.h) * (room.range.vert.eased * 2);

  cursor.el.style.transform = `translate3d(${cursor.x.eased}px, ${cursor.y.eased}px, 0)`;
  room.el.style.transform = `translate3d(0, 0, 512px) rotateX(${pan}deg) rotateY(${tilt}deg)`;

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
