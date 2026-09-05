const path = require("path");
const createMyStringModule = require(path.join(__dirname, "..", "web", "wasm", "mystring.js"));

function readValue(Module, slot) {
  const ptr = Module.ccall("ms_value", "number", ["number"], [slot]);
  const value = Module.UTF8ToString(ptr);
  Module.ccall("ms_free", null, ["number"], [ptr]);
  return value;
}

createMyStringModule().then((Module) => {
  Module.ccall("ms_create", null, ["number", "string"], [0, "Hello"]);
  const length = Module.ccall("ms_length", "number", ["number"], [0]);
  const value = readValue(Module, 0);
  console.log("create:", JSON.stringify(value), "length:", length);

  Module.ccall("ms_create", null, ["number", "string"], [1, "World"]);
  Module.ccall("ms_concat", null, ["number", "number", "number"], [0, 1, 3]);
  console.log("concat:", readValue(Module, 3), "length:", Module.ccall("ms_length", "number", ["number"], [3]));

  const equalSame = Module.ccall("ms_equals", "number", ["number", "number"], [0, 0]);
  const equalDiff = Module.ccall("ms_equals", "number", ["number", "number"], [0, 1]);
  console.log("equals same:", equalSame, "diff:", equalDiff);

  if (value !== "Hello" || length !== 5) {
    console.error("WASM spike failed: expected Hello / 5");
    process.exit(1);
  }
  console.log("WASM spike passed: real C++ MyString executed.");
});
