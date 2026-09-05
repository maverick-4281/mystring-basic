#ifndef MYSTRING_H
#define MYSTRING_H

#include <iostream>

class MyString {
private:
    char* str;
    int len;

    int getLen(const char* s);

public:
    MyString();
    MyString(const char* s);
    MyString(const MyString& other);
    ~MyString();

    MyString& operator=(const MyString& other);
    MyString operator+(const MyString& other);
    bool operator==(const MyString& other);
    char& operator[](int index);

    friend std::ostream& operator<<(std::ostream& out, const MyString& s);
    friend std::istream& operator>>(std::istream& in, MyString& s);

    int length();
};

#endif
