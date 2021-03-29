const electron = require('electron');
const path = require('path');
const SCALE_FACTOR = 4;

exports.decorateTerm = (Term, { React, notify }) => {
  return class extends React.Component {
    constructor (props, context) {
      super(props, context);

      this.resizeCanvas = this.resizeCanvas.bind(this);
      this.onDecorated = this.onDecorated.bind(this);
      this.onCursorMove = this.onCursorMove.bind(this);
    }

    onDecorated (term) {
      if (this.props.onDecorated) {
        this.props.onDecorated(term);
      }

      this._termDiv = term ? term.termRef : null;

      if (this._termDiv) {
        this.initOverlay();
      }
    }

    onCursorMove(cursorFrame) {
      if (this.props.onCursorMove) {
        this.props.onCursorMove(cursorFrame);
      }

      const overlayRect = this.getOverlayBoundingClientRect();
      const termRect = this._termDiv.getBoundingClientRect();

      const left = termRect.left + cursorFrame.x - overlayRect.left;
      const top = termRect.top + cursorFrame.y - overlayRect.top;
      const width = cursorFrame.width;
      const height = cursorFrame.height;

      if (this._prevCursorRect &&
        this._prevCursorRect.left === left &&
        this._prevCursorRect.top === top &&
        this._prevCursorRect.width === width &&
        this._prevCursorRect.height === height) {
        return;
      }

      this.updateVisual();

      Object.assign(this._catCursor.style, {
        left: left + 'px',
        top: top + 'px',
        width: width + 3 + 'px',
        height: height + 'px'
      });

      if (this._catHead.complete) {
        const scale = (width / this._catHead.naturalWidth) * SCALE_FACTOR;

        Object.assign(this._catHead.style, {
          display: 'block',
          width: this._catHead.naturalWidth * scale + 3 + 'px',
          height: this._catHead.naturalHeight * scale + 'px',
          left: left + width - (this._catHead.naturalWidth * scale) * .75 + 10 + 'px',
          top: top + height - (this._catHead.naturalHeight * scale) + 'px'
        });
      }

      this._prevCursorRect = {
        left,
        top,
        width,
        height
      };
    }

    initOverlay() {
      this._overlay = document.createElement('div');
      this._overlay.classList.add('cat-overlay');
      this._termDiv.insertBefore(this._overlay, this._termDiv.firstChild);

      this._canvas = document.createElement('canvas');
      this._canvasContext = this._canvas.getContext('2d');
      this.resizeCanvas();

      this._overlay.appendChild(this._canvas);

      window.addEventListener('resize', this.resizeCanvas);

      this.initCatCursor();
      this.initCatAsset();
    }

    createCatAsset(filename) {
      const img = new Image();   // Create new img element
      img.src = path.join(__dirname, filename);
      img.classList.add('cat-asset');
      this._overlay.appendChild(img);
      return img;
    }

    initCatAsset() {
      this._catHead = this.createCatAsset('cat.png');
    }

    initCatCursor() {
      const catCursor = document.createElement('div');
      catCursor.classList.add('cat-cursor');

      this._overlay.appendChild(catCursor);
      this._catCursor = catCursor;
    }

    resizeCanvas() {
      const overlayRect = this.getOverlayBoundingClientRect();
      this._canvas.width = overlayRect.width;
      this._canvas.height = overlayRect.height;
    }

    getOverlayBoundingClientRect() {
      // Getting the bounding client rect is futile unless it's visible. If it's not already visible, we'll
      // make it visible, take the measurement, then hide it.
      const overlayIsVisible = this._overlay.classList.contains('cat-active');

      if (!overlayIsVisible) {
        this._overlay.classList.add('cat-active');
      }

      const rect = this._overlay.getBoundingClientRect();

      if (!overlayIsVisible) {
        this._overlay.classList.remove('cat-active');
      }

      return rect;
    }

    
    updateVisual() {
      this._overlay.classList.toggle('cat-active', true);
    }

    render() {
      return [
        React.createElement(Term, Object.assign({}, this.props, {
          onDecorated: this.onDecorated,
          onCursorMove: this.onCursorMove,
          backgroundColor:  'rgba(0, 0, 0, 0)',
          cursorColor: 'rgba(0, 0, 0, 0)',
          foregroundColor: 'rgba(255, 255, 255, 1)'
        })),
        React.createElement('style', {}, `
          .cat-overlay {
            display: none;
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }
          
          .cat-overlay.cat-active {
            display: block;
          }
          
          .cat-asset {
            position: absolute;
            pointerEvents: none;
          }
        `)
      ];
    }
  }
};
