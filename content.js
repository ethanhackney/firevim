/**
 * firevim extension brings vim keybindings for firefox
 */
const MODE_INPUT_NORMAL = 0; // normal mode inside <input>
const MODE_INSERT       = 1; // insert mode
const MODE_NORMAL       = 2; // normal mode

// current mode
let mode = MODE_NORMAL;

/**
 * get all <a> on page:
 *
 * args:
 *  nothing
 *
 * ret:
 *  array of <a>
 */
const getLinks = () => {
  const links = [];

  for (const a of document.getElementsByTagName("a")) {
    const r = a.getBoundingClientRect();

    if (r.width <= 0)
      continue;
    if (r.height <= 0)
      continue;

    links.push(a);
  }

  return links;
};

/**
 * generate unique key for link:
 *
 * args:
 *  nothing
 *
 * ret:
 *  unique key
 *
 * TODO:
 *  better algorithm
 */
const links = new Map();
const uniqKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz";

  let key = "";
  do {
    key += chars[Math.floor(Math.random() * chars.length)];
  } while (links.has(key));

  return key;
};

/**
 * enter link mode:
 *
 * args:
 *  nothing
 *
 * ret:
 *  nothing
 */
let linkChoice = "";
let linkMode = false;
const enterLinkMode = () => {
  linkMode = true;
  linkChoice = "";

  getLinks().forEach((link) => {
    const key = uniqKey();
    const r = link.getBoundingClientRect();
    const label = document.createElement("div");

    label.textContent = key;
    Object.assign(label.style, {
      background: "yellow",
      fontWeight: "bold",
      position:   "absolute",
      fontSize:   "12px",
      padding:    "2px 4px",
      zIndex:     9999,
      border:     "1px solid black",
      color:      "black",
      left:       `${r.left + window.scrollX}px`,
      top:        `${r.top + window.scrollY}px`,
    });
    document.body.appendChild(label);

    links.set(key, {
      label,
      link,
    });
  })
};

/**
 * exit link mode:
 *
 * args:
 *  nothing
 *
 * ret:
 *  nothing
 */
const exitLinkMode = () => {
  linkMode = false;
  linkChoice = "";

  for (const [k, v] of links)
    v.label.remove();

  links.clear();
};

/**
 * link mode handler:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  nothing
 */
let linkTimeout = null;
const linkModeHandler = (e) => {
  if (e.key === "Escape") {
    exitLinkMode();
    stopEvent(e);
    return;
  }

  clearTimeout(linkTimeout);
  linkChoice += e.key;
  stopEvent(e);
  linkTimeout = setTimeout(() => {
    if (!links.has(linkChoice))
      return;

    links.get(linkChoice).link.click();
    exitLinkMode();
  }, 600);
};

/**
 * stop event:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  nothing
 */
const stopEvent = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * create handler for double char keybinding:
 *
 * args:
 *  @c:  char
 *  @fn: handler
 *
 * ret:
 *  handler for c
 */
const doubleCharHandler = (c, fn) => {
  let cPressed = false;
  let cTimeout = null;

  return (e) => {
    if (e.key !== c)
      return;

    if (cPressed) {
      clearTimeout(cTimeout);
      cPressed = false;
      fn(e);
    } else {
      cPressed = true;
      cTimeout = setTimeout(() => {
        cPressed = false;
      }, 600);
    }

    stopEvent(e);
  };
};

// regular keybinding handlers
const regularHandlers = new Map([
  [MODE_NORMAL, new Map([
    ["j", (e) => {
      window.scrollBy(0, 50);
      stopEvent(e);
    }],
    ["k", (e) => {
      window.scrollBy(0, -50);
      stopEvent(e);
    }],
    ["g", doubleCharHandler("g", (e) => {
      window.scrollTo({
        behavior: "smooth",
        top: 0,
      });
    })],
    ["f", (e) => {
      linkMode = true;
      enterLinkMode();
      stopEvent(e);
    }],
  ])],
  [MODE_INPUT_NORMAL, new Map([
    ["i", (e) => {
      mode = MODE_INSERT;
      stopEvent(e);
    }],
    ["h", (e) => {
      const t = e.target;
      const i = t.selectionStart;

      t.setSelectionRange(
        Math.max(0, i - 1),
        Math.max(0, i - 1)
      );
      stopEvent(e);
    }],
    ["l", (e) => {
      const t = e.target;
      const i = t.selectionStart;
      const len = t.value.length;

      t.setSelectionRange(
        Math.min(len, i + 1),
        Math.min(len, i + 1)
      );
      stopEvent(e);
    }],
    ["d", doubleCharHandler("d", (e) => {
      e.target.value = "";
    })],
    ["Enter", (e) => {
      mode = MODE_NORMAL;
    }],
  ])],
  [MODE_INSERT, new Map([
    ["Escape", (e) => {
      mode = MODE_INPUT_NORMAL;
      stopEvent(e);
    }],
    ["Enter", (e) => {
      mode = MODE_NORMAL;
    }],
  ])],
]);

// ctrl+char keybinding handlers
const ctrlHandlers = new Map([
  [MODE_NORMAL, new Map([
    ["d", (e) => {
      window.scrollBy(0, 500);
      stopEvent(e);
    }],
    ["u", (e) => {
      window.scrollBy(0, -500);
      stopEvent(e);
    }],
    ["o", (e) => {
      window.history.back();
      stopEvent(e);
    }],
  ])],
  [MODE_INPUT_NORMAL, new Map([
  ])],
  [MODE_INSERT, new Map([
  ])],
]);

// shift+char keybinding handlers
const shiftHandlers = new Map([
  [MODE_NORMAL, new Map([
    ["G", (e) => {
      window.scrollTo({
        behavior: "smooth",
        top: document.documentElement.scrollHeight,
      });
      stopEvent(e);
    }],
  ])],
  [MODE_INPUT_NORMAL, new Map([
  ])],
  [MODE_INSERT, new Map([
  ])],
]);

// sites to disable extension on for now
const blackList = new Set([
  "chatgpt.com",
  "github.com",
]);

/**
 * handle event:
 *
 * args:
 *  @handlers: handler map
 *  @e:        event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const eventHandler = (handlers, e) => {
  const m = handlers.get(mode);

  if (!m.has(e.key))
    return false;

  m.get(e.key)(e);
  return true;
};

/**
 * regular char keybinding handler:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const regularHandler = (e) => {
  if (eventHandler(regularHandlers, e))
    return true;

  if (mode === MODE_INPUT_NORMAL)
    stopEvent(e);
};

/**
 * ctrl+char keybinding handler:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const ctrlHandler = (e) => {
  if (!e.ctrlKey)
    return false;

  return eventHandler(ctrlHandlers, e);
};

/**
 * shift+char keybinding handler:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const shiftHandler = (e) => {
  if (!e.shiftKey)
    return false;

  return eventHandler(shiftHandlers, e);
};

// handle focus/blur for all <input>
for (const input of document.getElementsByTagName("input")) {
  input.addEventListener("focus", (e) => {
    mode = MODE_INPUT_NORMAL;
  });
  input.addEventListener("blur", (e) => {
    mode = MODE_NORMAL;
  });
}

// handle keydown event
document.addEventListener("keydown", (e) => {
  if (blackList.has(location.hostname))
    return;

  if (linkMode) {
    linkModeHandler(e);
    return;
  }

  if (regularHandler(e))
    return;
  if (ctrlHandler(e))
    return;
  if (shiftHandler(e))
    return;
}, true);
