#include "MyString.h"
#include <iostream>
#include <sstream>

int main() {
    MyString a("Hello");
    MyString b("World");

    std::cout << "length a=" << a.length() << "\n";

    MyString c = a + b;
    std::ostringstream out;
    out << c;
    std::cout << "concat=" << out.str() << " len=" << c.length() << "\n";

    MyString hello("Hello");
    std::cout << "a==hello " << (a == hello) << " a==b " << (a == b) << "\n";

    MyString copy(a);
    copy[0] = 'Y';
    std::cout << "after mutate copy=" << copy << " a=" << a << "\n";

    MyString assigned("Temp");
    assigned = b;
    std::cout << "assigned=" << assigned << "\n";

    a = a;
    std::cout << "self-assign a=" << a << " len=" << a.length() << "\n";

    std::istringstream in("InputWord extra");
    MyString streamed;
    in >> streamed;
    std::cout << "streamed=" << streamed << " len=" << streamed.length() << "\n";

    std::cout << "a[1]=" << a[1] << "\n";
    return 0;
}
