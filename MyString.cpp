#include "MyString.h"

// finds length of a normal c-string
int MyString::getLen(const char* s) {
    int count = 0;
    while (s[count] != '\0') {
        count++;
    }
    return count;
}

MyString::MyString() {
    len = 0;
    str = new char[1];
    str[0] = '\0';
}

MyString::MyString(const char* s) {
    len = getLen(s);
    str = new char[len + 1];
    for (int i = 0; i < len; i++) {
        str[i] = s[i];
    }
    str[len] = '\0';
}

// deep copy, so both objects don't point to the same memory
MyString::MyString(const MyString& other) {
    len = other.len;
    str = new char[len + 1];
    for (int i = 0; i < len; i++) {
        str[i] = other.str[i];
    }
    str[len] = '\0';
}

MyString::~MyString() {
    delete[] str;
}

MyString& MyString::operator=(const MyString& other) {
    if (this == &other) {
        return *this;
    }

    char* newStr = new char[other.len + 1];
    for (int i = 0; i < other.len; i++) {
        newStr[i] = other.str[i];
    }
    newStr[other.len] = '\0';

    delete[] str;
    str = newStr;
    len = other.len;

    return *this;
}

MyString MyString::operator+(const MyString& other) {
    int newLen = len + other.len;
    char* buffer = new char[newLen + 1];

    for (int i = 0; i < len; i++) {
        buffer[i] = str[i];
    }
    for (int i = 0; i < other.len; i++) {
        buffer[len + i] = other.str[i];
    }
    buffer[newLen] = '\0';

    MyString result(buffer);
    delete[] buffer;
    return result;
}

bool MyString::operator==(const MyString& other) {
    if (len != other.len) {
        return false;
    }
    for (int i = 0; i < len; i++) {
        if (str[i] != other.str[i]) {
            return false;
        }
    }
    return true;
}

char& MyString::operator[](int index) {
    return str[index];
}

std::ostream& operator<<(std::ostream& out, const MyString& s) {
    out << s.str;
    return out;
}

std::istream& operator>>(std::istream& in, MyString& s) {
    char buffer[1000];
    in >> buffer;

    delete[] s.str;
    s.len = s.getLen(buffer);
    s.str = new char[s.len + 1];
    for (int i = 0; i < s.len; i++) {
        s.str[i] = buffer[i];
    }
    s.str[s.len] = '\0';

    return in;
}

int MyString::length() {
    return len;
}
