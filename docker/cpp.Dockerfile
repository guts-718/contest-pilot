FROM gcc:13

WORKDIR /app

CMD sh -c "g++ -O2 -std=c++17 main.cpp -o main"