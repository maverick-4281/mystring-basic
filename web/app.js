(function () {
  const SLOT = { A: 0, B: 1, C: 2, R: 3, S: 4 };
  const SOURCE = {
    ctor: `MyString::MyString(const char* s) {
    len = getLen(s);
    str = new char[len + 1];
    for (int i = 0; i < len; i++) {
        str[i] = s[i];
    }
    str[len] = '\\0';
}`,
    copy: `MyString::MyString(const MyString& other) {
    len = other.len;
    str = new char[len + 1];
    for (int i = 0; i < len; i++) {
        str[i] = other.str[i];
    }
    str[len] = '\\0';
}`,
    assign: `MyString& MyString::operator=(const MyString& other) {
    if (this == &other) {
        return *this;
    }

    char* newStr = new char[other.len + 1];
    for (int i = 0; i < other.len; i++) {
        newStr[i] = other.str[i];
    }
    newStr[other.len] = '\\0';

    delete[] str;
    str = newStr;
    len = other.len;

    return *this;
}`,
    plus: `MyString MyString::operator+(const MyString& other) {
    int newLen = len + other.len;
    char* buffer = new char[newLen + 1];

    for (int i = 0; i < len; i++) {
        buffer[i] = str[i];
    }
    for (int i = 0; i < other.len; i++) {
        buffer[len + i] = other.str[i];
    }
    buffer[newLen] = '\\0';

    MyString result(buffer);
    delete[] buffer;
    return result;
}`,
    eq: `bool MyString::operator==(const MyString& other) {
    if (len != other.len) {
        return false;
    }
    for (int i = 0; i < len; i++) {
        if (str[i] != other.str[i]) {
            return false;
        }
    }
    return true;
}`,
    index: `char& MyString::operator[](int index) {
    return str[index];
}`,
    length: `int MyString::length() {
    return len;
}`,
    streamOut: `std::ostream& operator<<(std::ostream& out, const MyString& s) {
    out << s.str;
    return out;
}`,
    streamIn: `std::istream& operator>>(std::istream& in, MyString& s) {
    char buffer[1000];
    in >> buffer;

    delete[] s.str;
    s.len = s.getLen(buffer);
    s.str = new char[s.len + 1];
    for (int i = 0; i < s.len; i++) {
        s.str[i] = buffer[i];
    }
    s.str[s.len] = '\\0';

    return in;
}`
  };

  let Module = null;
  let nextSim = 0x1000;
  const sim = { A: 0, B: 0, C: 0, R: 0, S: 0 };
  let freed = null;
  let highlight = { name: "", index: -1 };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hex(n) {
    return "0x" + n.toString(16).toUpperCase().padStart(6, "0");
  }

  function bump(name) {
    sim[name] = nextSim;
    nextSim += 0x80;
  }

  function ccallCreate(slot, text) {
    Module.ccall("ms_create", null, ["number", "string"], [slot, text]);
  }

  function readValue(slot) {
    const ptr = Module.ccall("ms_value", "number", ["number"], [slot]);
    const value = Module.UTF8ToString(ptr);
    Module.ccall("ms_free", null, ["number"], [ptr]);
    return value;
  }

  function lengthOf(slot) {
    return Module.ccall("ms_length", "number", ["number"], [slot]);
  }

  function exists(slot) {
    return Module.ccall("ms_exists", "number", ["number"], [slot]) === 1;
  }

  function charsOf(text) {
    const list = [];
    for (let i = 0; i < text.length; i++) {
      list.push(text[i]);
    }
    list.push("\\0");
    return list;
  }

  function byteHtml(ch, extraClass, delay) {
    const shown = ch === "\\0" ? "\\0" : ch === " " ? "␣" : ch;
    const cls = ["byte", extraClass || "live", ch === "\\0" ? "term" : "", delay != null ? "enter" : ""]
      .filter(Boolean)
      .join(" ");
    const style = delay != null && !reduceMotion ? `animation-delay:${delay}ms` : "";
    return `<span class="${cls}" style="${style}">${escapeHtml(shown)}</span>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function row(chars, kind, highlightIndex, animate) {
    return chars
      .map((ch, i) => {
        const extra = [kind, i === highlightIndex ? "highlight" : ""].filter(Boolean).join(" ");
        return byteHtml(ch, extra, animate ? i * 70 : null);
      })
      .join("");
  }

  function objectCard(name, text, address, options) {
    options = options || {};
    const chars = charsOf(text);
    const hi = options.highlightIndex;
    const animate = options.animate;
    const len = text.length;
    return `<article class="object-block">
      <h4>String ${name}</h4>
      <p><span class="field">str</span><br>↓</p>
      <p class="byte-row">${row(chars, "live", hi, animate)}</p>
      <p>len = ${len}</p>
      <p>simulated address = ${hex(address)}</p>
      <p>bytes = ${len + 1}</p>
    </article>`;
  }

  function setSource(code, explain) {
    document.getElementById("play-source").innerHTML = `<code>${escapeHtml(code)}</code>`;
    document.getElementById("play-explain").textContent = explain || "";
  }

  function setResult(text) {
    document.getElementById("play-result").textContent = text;
  }

  function syncFromInputs(readdress) {
    const a = document.getElementById("input-a").value;
    const b = document.getElementById("input-b").value;
    ccallCreate(SLOT.A, a);
    ccallCreate(SLOT.B, b);
    if (readdress) {
      bump("A");
      bump("B");
    }
  }

  function renderPlayground(options) {
    options = options || {};
    const a = readValue(SLOT.A);
    const b = exists(SLOT.B) ? readValue(SLOT.B) : "";
    const hasC = exists(SLOT.C);
    const c = hasC ? readValue(SLOT.C) : null;
    const hasR = exists(SLOT.R);
    const r = hasR ? readValue(SLOT.R) : null;
    const hiName = highlight.name;
    const hi = highlight.index;

    let html = "";
    html += objectCard("A", a, sim.A, { highlightIndex: hiName === "A" ? hi : -1, animate: options.animateA });
    html += objectCard("B", b, sim.B, { highlightIndex: hiName === "B" ? hi : -1, animate: options.animateB });
    if (hasC) {
      html += objectCard("C", c, sim.C, { highlightIndex: hiName === "C" ? hi : -1, animate: options.animateC });
    }
    if (hasR) {
      html += objectCard("Result", r, sim.R, { animate: options.animateR });
    }
    if (freed) {
      html += `<article class="object-block">
        <h4>Freed memory</h4>
        <p>old buffer → delete[]</p>
        <p class="freed-row">╳ <span class="byte-row">${row(charsOf(freed.text), "freed", -1, false)}</span></p>
      </article>`;
    }
    document.getElementById("play-viz").innerHTML = html;
  }

  function requireModule() {
    if (!Module) {
      setResult("WebAssembly is not ready.");
      return false;
    }
    return true;
  }

  function onConcat() {
    if (!requireModule()) return;
    syncFromInputs(false);
    Module.ccall("ms_concat", null, ["number", "number", "number"], [SLOT.A, SLOT.B, SLOT.R]);
    bump("R");
    highlight = { name: "", index: -1 };
    const a = readValue(SLOT.A);
    const b = readValue(SLOT.B);
    const r = readValue(SLOT.R);
    const n = lengthOf(SLOT.R);
    setResult(`Result: ${r}    Length: ${n}    Bytes: ${n + 1}`);
    setSource(
      SOURCE.plus,
      `${n} characters + null terminator. operator+ builds a temporary buffer, then a new MyString.`
    );
    renderPlayground({ animateR: true });
  }

  function onCompare() {
    if (!requireModule()) return;
    syncFromInputs(false);
    const same = Module.ccall("ms_equals", "number", ["number", "number"], [SLOT.A, SLOT.B]) === 1;
    highlight = { name: "", index: -1 };
    setResult(`A = ${readValue(SLOT.A)}    B = ${readValue(SLOT.B)}    Result: ${same}`);
    setSource(SOURCE.eq, "operator== compares length, then each character.");
    renderPlayground();
  }

  function onCopy() {
    if (!requireModule()) return;
    syncFromInputs(false);
    Module.ccall("ms_copy", null, ["number", "number"], [SLOT.A, SLOT.C]);
    bump("C");
    highlight = { name: "", index: -1 };
    setResult(`C copied from A. Same content. Different simulated address.`);
    setSource(SOURCE.copy, "Same content. Different memory. Independent ownership.");
    renderPlayground({ animateC: true });
  }

  function onMutate() {
    if (!requireModule()) return;
    if (!exists(SLOT.C)) {
      setResult("Copy A to C first, then mutate C[0].");
      return;
    }
    if (lengthOf(SLOT.C) < 1) {
      setResult("C is empty, so C[0] is out of range.");
      return;
    }
    const ch = document.getElementById("input-mut").value;
    if (!ch) {
      setResult("Enter one character for C[0].");
      return;
    }
    const beforeA = readValue(SLOT.A);
    Module.ccall("ms_set_char", "number", ["number", "number", "number"], [SLOT.C, 0, ch.charCodeAt(0)]);
    highlight = { name: "C", index: 0 };
    setResult(`Before: A = ${beforeA}    After: A = ${readValue(SLOT.A)}    C = ${readValue(SLOT.C)}`);
    setSource(SOURCE.index, "Only C's buffer changed. That is the proof that the copy is independent.");
    renderPlayground();
  }

  function onAssign() {
    if (!requireModule()) return;
    syncFromInputs(false);
    freed = { text: readValue(SLOT.B) };
    Module.ccall("ms_assign", null, ["number", "number"], [SLOT.B, SLOT.A]);
    bump("B");
    document.getElementById("input-b").value = readValue(SLOT.B);
    highlight = { name: "", index: -1 };
    setResult("B = A. Old B buffer is shown as freed, then the new buffer appears.");
    setSource(SOURCE.assign, "Assignment frees the old buffer, then owns a deep copy of A.");
    renderPlayground({ animateB: true });
  }

  function onSelf() {
    if (!requireModule()) return;
    syncFromInputs(false);
    const before = readValue(SLOT.A);
    const beforeLen = lengthOf(SLOT.A);
    Module.ccall("ms_assign", null, ["number", "number"], [SLOT.A, SLOT.A]);
    highlight = { name: "", index: -1 };
    setResult(`a = a; still "${readValue(SLOT.A)}", length ${lengthOf(SLOT.A)} (was ${before}, ${beforeLen}).`);
    setSource(
      SOURCE.assign,
      "Self-assignment matters because a naive delete[] str would free the only buffer, then copy from freed memory."
    );
    renderPlayground();
  }

  function onLength() {
    if (!requireModule()) return;
    syncFromInputs(false);
    const n = lengthOf(SLOT.A);
    highlight = { name: "", index: -1 };
    setResult(`a.length()    Result: ${n}`);
    setSource(SOURCE.length, "length() returns the stored len member.");
    renderPlayground();
  }

  function onIndex() {
    if (!requireModule()) return;
    syncFromInputs(false);
    const index = Number(document.getElementById("input-index").value);
    const n = lengthOf(SLOT.A);
    if (!Number.isInteger(index) || index < 0 || index >= n) {
      setResult(`Index ${index} is out of range for A (length ${n}).`);
      highlight = { name: "", index: -1 };
      renderPlayground();
      return;
    }
    const code = Module.ccall("ms_get_char", "number", ["number", "number"], [SLOT.A, index]);
    const ch = String.fromCharCode(code);
    highlight = { name: "A", index: index };
    setResult(`A[${index}]    Result: '${ch}'`);
    setSource(SOURCE.index, "The highlighted byte is the character returned by operator[].");
    renderPlayground();
  }

  function onStreamIn() {
    if (!requireModule()) return;
    const raw = document.getElementById("stream-in").value;
    Module.ccall("ms_create_empty", null, ["number"], [SLOT.S]);
    Module.ccall("ms_stream_in", null, ["number", "string"], [SLOT.S, raw]);
    const value = readValue(SLOT.S);
    document.getElementById("stream-result").textContent =
      `cin >> a;  stored "${value}", length ${lengthOf(SLOT.S)} (whitespace stops the real operator>>).`;
  }

  function onStreamOut() {
    if (!requireModule()) return;
    if (!exists(SLOT.S)) {
      Module.ccall("ms_create", null, ["number", "string"], [SLOT.S, document.getElementById("stream-in").value]);
    }
    const value = readValue(SLOT.S);
    document.getElementById("stream-result").textContent = `cout << a;  ${value}`;
  }

  function animateHero() {
    const host = document.getElementById("hero-bytes");
    const chars = ["H", "e", "l", "l", "o", "\\0"];
    host.innerHTML = "";
    chars.forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "byte live enter" + (ch === "\\0" ? " term" : "");
      span.textContent = ch;
      if (!reduceMotion) {
        span.style.animationDelay = i * 120 + "ms";
      }
      host.appendChild(span);
    });
  }

  function bind() {
    document.getElementById("btn-concat").addEventListener("click", onConcat);
    document.getElementById("btn-compare").addEventListener("click", onCompare);
    document.getElementById("btn-copy").addEventListener("click", onCopy);
    document.getElementById("btn-mutate").addEventListener("click", onMutate);
    document.getElementById("btn-assign").addEventListener("click", onAssign);
    document.getElementById("btn-self").addEventListener("click", onSelf);
    document.getElementById("btn-length").addEventListener("click", onLength);
    document.getElementById("btn-index").addEventListener("click", onIndex);
    document.getElementById("btn-stream-in").addEventListener("click", onStreamIn);
    document.getElementById("btn-stream-out").addEventListener("click", onStreamOut);
    document.getElementById("input-a").addEventListener("change", function () {
      if (!Module) return;
      ccallCreate(SLOT.A, this.value);
      bump("A");
      renderPlayground({ animateA: true });
    });
    document.getElementById("input-b").addEventListener("change", function () {
      if (!Module) return;
      ccallCreate(SLOT.B, this.value);
      bump("B");
      renderPlayground({ animateB: true });
    });
  }

  function setButtons(enabled) {
    document.querySelectorAll(".actions button, .stream-demo button").forEach((btn) => {
      btn.disabled = !enabled;
    });
  }

  animateHero();
  bind();
  setButtons(false);

  if (typeof createMyStringModule !== "function") {
    document.getElementById("wasm-status").textContent =
      "WebAssembly loader missing. Serve the web/ folder over HTTP so mystring.js can load.";
    document.getElementById("wasm-status").className = "status err";
    return;
  }

  createMyStringModule({ locateFile: (file) => "wasm/" + file })
    .then((mod) => {
      Module = mod;
      syncFromInputs(true);
      document.getElementById("wasm-status").textContent =
        "WebAssembly ready. Operations execute the compiled C++ MyString class.";
      document.getElementById("wasm-status").className = "status ok";
      setSource(SOURCE.ctor, "A and B were constructed with MyString(const char*).");
      setButtons(true);
      renderPlayground({ animateA: true, animateB: true });
    })
    .catch((err) => {
      document.getElementById("wasm-status").textContent =
        "WebAssembly failed to load. Use a local HTTP server (see README). " + err;
      document.getElementById("wasm-status").className = "status err";
    });
})();
