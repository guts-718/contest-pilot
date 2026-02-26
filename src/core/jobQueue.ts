type Job<T> = () => Promise<T>;

export class JobQueue {
  private queue: Job<any>[] = [];
  private running = false;

  async add<T>(job: Job<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await job();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.run();
    });
  }

  private async run() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length) {
      const job = this.queue.shift();
      if (!job) continue;
      await job();
    }

    this.running = false;
  }
}

export const jobQueue = new JobQueue();