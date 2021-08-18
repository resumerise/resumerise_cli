// deno-lint-ignore-file
class RenderHelper {
  pdfDoc = null;
  pageNum = 1;
  pageRendering = false;
  pageNumPending = null;
  scale = 1.5;
  canvas = document.getElementById("the-canvas");
  ctx;
  data;

  constructor(data) {
    this.data = data;
    this.bindEvents();
    this.ctx = this.canvas.getContext("2d");
  }

  bindEvents() {
    document.getElementById("prev").addEventListener(
      "click",
      this.onPrevPage.bind(this),
    );
    document.getElementById("next").addEventListener(
      "click",
      this.onNextPage.bind(this),
    );
  }

  renderPage(num) {
    const that = this;
    this.pageRendering = true;
    // Using promise to fetch the page
    this.pdfDoc.getPage(num).then(function (page) {
      const viewport = page.getViewport({ scale: that.scale });
      that.canvas.height = viewport.height;
      that.canvas.width = viewport.width;

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: that.ctx,
        viewport: viewport,
      };
      const renderTask = page.render(renderContext);

      // Wait for rendering to finish
      renderTask.promise.then(function () {
        that.pageRendering = false;
        if (that.pageNumPending !== null) {
          // New page rendering is pending
          that.renderPage(that.pageNumPending);
          that.pageNumPending = null;
        }
      });
    });

    // Update page counters
    document.getElementById("page_num").textContent = num;
  }

  /**
   * If another page rendering in progress, waits until the rendering is
   * finised. Otherwise, executes rendering immediately.
   */
  queueRenderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  /**
   * Displays previous page.
   */
  onPrevPage() {
    if (this.pageNum <= 1) {
      return;
    }
    this.pageNum--;
    this.queueRenderPage(this.pageNum);
  }

  /**
   * Displays next page.
   */
  onNextPage() {
    if (this.pageNum >= this.pdfDoc.numPages) {
      return;
    }
    this.pageNum++;
    this.queueRenderPage(this.pageNum);
  }

  renderPDF() {
    const that = this;
    pdfjsLib.getDocument(this.data)
      .promise.then(function (pdfDoc_) {
        that.pdfDoc = pdfDoc_;
        document.getElementById("page_count").textContent =
          that.pdfDoc.numPages;
        that.renderPage(that.pageNum);
      });
  }
}

const pipe = new WebSocket(`ws://127.0.0.1:8080`);

function fire(ev) {
  switch (ev.type) {
    case "message":
      switch (typeof ev.data) {
        case "string":
          location.reload();
          break;
        case "object":
          ev.data.arrayBuffer().then((ab) => {
            console.log(new Uint8Array(ab));
          });
          break;
      }
      break;
    default:
      console.log(ev.type, ev);
  }
}

pipe.addEventListener("open", fire);
pipe.addEventListener("close", fire);
pipe.addEventListener("message", fire);
pipe.addEventListener("error", fire);
