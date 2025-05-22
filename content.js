/**
 * firevim extension brings vim keybindings to firefox
 */
const J_SCROLL =   50; // how much to scroll for "j"
const K_SCROLL =  -50; // how much to scroll for "k"
const U_SCROLL = -200; // how much to scroll for "ctrl+u"
const D_SCROLL =  200; // how much to scroll for "ctrl-d"
const GG_WAIT  =  400; // how long to wait for next "g"
const CAPTURE  = true; // capture keydown early

// single char map
const single = new Map([
  ["j", J_SCROLL],
  ["k", K_SCROLL],
]);
// ctrl map
const ctrl = new Map([
  ["u", U_SCROLL],
  ["d", D_SCROLL],
  ["o", 0],
]);
// shift map
const shift = new Map([
  ["g", {
    behavior: "smooth",
    top: document.documentElement.scrollHeight,
  }],
]);
// tagNames to ignore
const tagIgnore = new Set([
  "INPUT",
  "TEXTAREA",
]);

/**
 * should we ignore event?:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if should
 *  @false: if should not
 */
const eventIgnore = (e) => {
  const {
    tagName,
    isContentEditable,
  } = e.target;

  if (tagIgnore.has(tagName))
    return true;
  if (isContentEditable)
    return true;

  return false;
};

/**
 * scroll on page:
 *
 * args:
 *  @amt: amount to scroll
 *
 * ret:
 *  nothing
 */
const scroll = (e, amt) => {
  window.scrollBy(0, amt);
  e.preventDefault();
};

/**
 * handle single char keys:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const trySingle = (e) => {
  const key = e.key.toLowerCase();

  if (!single.has(key))
    return false;

  scroll(e, single.get(key));
  return true;
};

/**
 * handle ctrl keys:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const tryCtrl = (e) => {
  const key = e.key.toLowerCase();

  if (!e.ctrlKey)
    return false;
  if (!ctrl.has(key))
    return false;

  if (key == "o") {
    window.history.back();
    e.preventDefault();
    e.stopPropagation();
  } else {
    scroll(e, ctrl.get(key));
  }

  return true;
};

/**
 * handle shift keys:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  @true:  if handled
 *  @false: if not
 */
const tryShift = (e) => {
  const key = e.key.toLowerCase();

  if (!e.shiftKey)
    return false;
  if (!shift.has(key))
    return false;

  window.scrollTo(shift.get(key));
  return true;
};


/**
 * handle "gg":
 *
 * args:
 *  @e: event
 *
 * ret:
 *  nothing
 */
let gPressed = false; // have we pressed "g"?
let gTimeout = null;  // timeout
const tryGgScroll = (e) => {
  const key = e.key.toLowerCase();

  if (key != "g")
    return;

  if (gPressed) {
    window.scrollTo({
      behavior: "smooth",
      top: 0,
    });
    gPressed = false;
    clearTimeout(gTimeout);
  } else {
    gPressed = true;
    gTimeout = setTimeout(() => {
      gPressed = false;
    }, GG_WAIT);
  }
};

/**
 * handle keydown event:
 *
 * args:
 *  @e: event
 *
 * ret:
 *  nothing
 */
document.addEventListener("keydown", (e) => {
  if (eventIgnore(e))
    return;

  if (trySingle(e))
    return;
  if (tryCtrl(e))
    return;
  if (tryShift(e))
    return;

  tryGgScroll(e);
}, CAPTURE);
