import RenderWorker from "./render_worker";

class Renderer {
  static register(processName, processFunc) {
    this.prototype[processName] = function (...args) {
      this.enqueue(processName, processFunc.apply(this, args));
      return this;
    }
  }

  static registerAlias(processName, processFunc) {
    this.prototype[processName] = function (...args) {
      processFunc.apply(this, args);
    }
  }

  static get Blocks() {
    return 1;
  }

  constructor(context) {
    this.context = context;
    this.renderQueue = [];
    this.pixelData = this.context.pixelData;
    this.workers = [];

    this.createWorkers();
  }

  createWorkers() {
    let n = this.pixelData.length;
    let blockPixelLength = Math.floor((n / 4) / Renderer.Blocks);
    let blockN = blockPixelLength * 4;
    let lastBlockN = blockN + ((n / 4) % Renderer.Blocks) * 4;
    let start, end;

    for (let i = 0; i < Renderer.Blocks; i++) {
      start = i * blockN;
      end = start + (i == Renderer.Blocks - 1 ? lastBlockN : blockN);

      this.workers.push(new RenderWorker(this.context, i, start, end));
    }
  }

  enqueue(name, item) {
    this.renderQueue.push({ name: name, item: item });
  }

  render() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        while (this.renderQueue.length > 0) {
          this.processNext();
        }

        this.context.update();
        resolve();
      }, 0);
    });
  }

  processNext() {
    let job = this.renderQueue.shift();
    job.item.setContext(this.context);

    console.log("Processing:", job.name);
    for (let worker of this.workers) {
      worker.process(job);
    }
  }
}

export default Renderer;
