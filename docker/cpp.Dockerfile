FROM gcc:13

RUN apt-get update && apt-get install -y time

WORKDIR /app

CMD ["bash"]