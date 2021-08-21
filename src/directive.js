import {
  format,
  unformat,
  setCursor,
  event,
  fixed,
  numbersToCurrency,
  validateRestrictedOptions,
} from './utils';
import assign from './assign';
import defaults from './options';

let lastKnownValue = null;

const setValue = (el, opt, caller) => {
  if (lastKnownValue === el.value) {
    if (opt.debug) console.log('directive setValue() - lastKnownValue === el.value. Stopping here...', el.value);
    return;
  }
  if (!validateRestrictedOptions(opt)) {
    if (opt.debug) console.log('directive setValue() - validateRestrictedOptions() return false. Stopping here...', el.value);
    return;
  }
  let positionFromEnd = el.value.length - el.selectionEnd;
  el.value = format(el.value, opt, caller);
  lastKnownValue = el.value;
  positionFromEnd = Math.max(positionFromEnd, opt.suffix.length); // right
  positionFromEnd = el.value.length - positionFromEnd;
  positionFromEnd = Math.max(positionFromEnd, opt.prefix.length); // left
  setCursor(el, positionFromEnd);
  el.dispatchEvent(event('change')); // v-model.lazy
};

export default {
  mounted(el, binding) {
    if (!binding.value) {
      return;
    }

    const opt = assign(defaults, binding.value);

    if (opt.debug) console.log('directive mounted() - opt', opt);

    // v-money3 used on a component that's not a input
    if (el.tagName.toLocaleUpperCase() !== 'INPUT') {
      const els = el.getElementsByTagName('input');
      if (els.length !== 1) {
        // throw new Error("v-money3 requires 1 input, found " + els.length)
      } else {
        // eslint-disable-next-line prefer-destructuring
        el = els[0];
      }
    }

    el.onkeydown = (e) => {
      const backspacePressed = e.code === 'Backspace' || e.code === 'Delete';
      const isAtEndPosition = (el.value.length - el.selectionEnd) === 0;

      if (opt.debug) console.log('directive onkeydown() - backspacePressed', backspacePressed);
      if (opt.debug) console.log('directive onkeydown() - isAtEndPosition', isAtEndPosition);
      if (opt.debug) console.log('directive onkeydown() - unformat el.valuee', el.value);

      if (opt.allowBlank
          && backspacePressed
          && isAtEndPosition
          && unformat(el.value, opt) === 0
      ) {
        if (opt.debug) console.log('directive onkeydown() - set el.value = ""', el.value);
        el.value = '';
        el.dispatchEvent(event('change')); // v-model.lazy
      }

      if (opt.debug) console.log('directive onkeydown() - e.key', e.key);
      if (e.key === '+') {
        if (opt.debug) console.log('directive onkeydown() - unformat el.value', el.value);
        const number = unformat(el.value, opt);
        if (number < 0) {
          el.value = number * -1;
        }
      }
    };

    el.oninput = () => {
      if (opt.debug) console.log('directive oninput()', el.value);
      if (/^[1-9]$/.test(el.value)) {
        el.value = numbersToCurrency(el.value, fixed(opt.precision));
        if (opt.debug) console.log('directive oninput() - is 1-9', el.value);
      }
      setValue(el, opt, 'directive oninput');
    };

    if (opt.debug) console.log('directive mounted() - el.value', el.value);
    setValue(el, opt, 'directive mounted');
  },
  updated(el, binding) {
    if (!binding.value) {
      return;
    }
    const opt = assign(defaults, binding.value);
    if (opt.debug) console.log('directive updated() - el.value', el.value);
    setValue(el, opt, 'directive updated');
  },
  beforeUnmount(el) {
    el.onkeydown = null;
    el.oninput = null;
    el.onfocus = null;
  },
};
