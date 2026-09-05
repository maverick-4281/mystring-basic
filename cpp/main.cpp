#include "MyString.h"
#include <iostream>
using namespace std;

int main() {
    MyString s1("Hello");
    MyString s2("World");

    cout << "s1 = " << s1 << endl;
    cout << "s2 = " << s2 << endl;

    MyString s3 = s1 + MyString(" ") + s2;
    cout << "s1 + s2 = " << s3 << endl;

    MyString s4("Hello");
    if (s1 == s4) {
        cout << "s1 and s4 are equal" << endl;
    } else {
        cout << "s1 and s4 are not equal" << endl;
    }

    cout << "s1[0] = " << s1[0] << endl;
    s1[0] = 'J';
    cout << "after changing s1[0]: " << s1 << endl;

    MyString s5(s2);
    s5[0] = 'B';
    cout << "s2 = " << s2 << " (should still be World)" << endl;
    cout << "s5 = " << s5 << endl;

    MyString s6;
    s6 = s2;
    cout << "s6 after s6 = s2: " << s6 << endl;

    cout << "Enter a word: ";
    MyString s7;
    cin >> s7;
    cout << "you entered: " << s7 << ", length = " << s7.length() << endl;

    return 0;
}
