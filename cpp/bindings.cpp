#include "MyString.h"
#include <emscripten.h>
#include <sstream>
#include <cstring>
#include <cstdlib>

// Small C++ ↔ JavaScript bridge. MyString itself is unchanged.
// Slots: 0 = A, 1 = B, 2 = C, 3 = concat/stream result.

static MyString* g_slots[8] = {nullptr};

static bool valid_slot(int slot) {
    return slot >= 0 && slot < 8;
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
void ms_create(int slot, const char* text) {
    if (!valid_slot(slot)) {
        return;
    }
    delete g_slots[slot];
    g_slots[slot] = new MyString(text ? text : "");
}

EMSCRIPTEN_KEEPALIVE
void ms_create_empty(int slot) {
    if (!valid_slot(slot)) {
        return;
    }
    delete g_slots[slot];
    g_slots[slot] = new MyString();
}

EMSCRIPTEN_KEEPALIVE
void ms_copy(int src, int dest) {
    if (!valid_slot(src) || !valid_slot(dest) || !g_slots[src]) {
        return;
    }
    delete g_slots[dest];
    g_slots[dest] = new MyString(*g_slots[src]);
}

EMSCRIPTEN_KEEPALIVE
void ms_destroy(int slot) {
    if (!valid_slot(slot)) {
        return;
    }
    delete g_slots[slot];
    g_slots[slot] = nullptr;
}

EMSCRIPTEN_KEEPALIVE
int ms_exists(int slot) {
    return valid_slot(slot) && g_slots[slot] != nullptr;
}

EMSCRIPTEN_KEEPALIVE
int ms_length(int slot) {
    if (!valid_slot(slot) || !g_slots[slot]) {
        return 0;
    }
    return g_slots[slot]->length();
}

EMSCRIPTEN_KEEPALIVE
char* ms_value(int slot) {
    std::string text;
    if (valid_slot(slot) && g_slots[slot]) {
        std::ostringstream out;
        out << *g_slots[slot];
        text = out.str();
    }
    char* copy = static_cast<char*>(std::malloc(text.size() + 1));
    if (!copy) {
        return nullptr;
    }
    std::memcpy(copy, text.c_str(), text.size() + 1);
    return copy;
}

EMSCRIPTEN_KEEPALIVE
void ms_free(char* pointer) {
    std::free(pointer);
}

EMSCRIPTEN_KEEPALIVE
void ms_concat(int a, int b, int dest) {
    if (!valid_slot(a) || !valid_slot(b) || !valid_slot(dest) || !g_slots[a] || !g_slots[b]) {
        return;
    }
    MyString result = (*g_slots[a]) + (*g_slots[b]);
    delete g_slots[dest];
    g_slots[dest] = new MyString(result);
}

EMSCRIPTEN_KEEPALIVE
int ms_equals(int a, int b) {
    if (!valid_slot(a) || !valid_slot(b) || !g_slots[a] || !g_slots[b]) {
        return 0;
    }
    return ((*g_slots[a]) == (*g_slots[b])) ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
int ms_get_char(int slot, int index) {
    if (!valid_slot(slot) || !g_slots[slot]) {
        return -1;
    }
    int n = g_slots[slot]->length();
    if (index < 0 || index >= n) {
        return -1;
    }
    return static_cast<unsigned char>((*g_slots[slot])[index]);
}

EMSCRIPTEN_KEEPALIVE
int ms_set_char(int slot, int index, int ch) {
    if (!valid_slot(slot) || !g_slots[slot]) {
        return 0;
    }
    int n = g_slots[slot]->length();
    if (index < 0 || index >= n) {
        return 0;
    }
    (*g_slots[slot])[index] = static_cast<char>(ch);
    return 1;
}

EMSCRIPTEN_KEEPALIVE
void ms_assign(int dest, int src) {
    if (!valid_slot(dest) || !valid_slot(src) || !g_slots[src]) {
        return;
    }
    if (!g_slots[dest]) {
        g_slots[dest] = new MyString();
    }
    *g_slots[dest] = *g_slots[src];
}

EMSCRIPTEN_KEEPALIVE
void ms_stream_in(int slot, const char* text) {
    if (!valid_slot(slot)) {
        return;
    }
    if (!g_slots[slot]) {
        g_slots[slot] = new MyString();
    }
    std::istringstream in(text ? text : "");
    in >> *g_slots[slot];
}

}
