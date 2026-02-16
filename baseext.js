class OverlayCanvasExtension {
    constructor() {
        this.runtime = Scratch.vm.runtime;
        this.overlayCanvas = null;
        this.ctx = null;
        this.stageContainer = null;

        this._onResize = this._onResize.bind(this);

        // Wait for renderer to be ready, then create overlay canvas
        this.runtime.once('PROJECT_START', () => {
            this._createOverlayCanvas();
            window.addEventListener('resize', this._onResize);
        });
    }



    getInfo() {
        return {
        id: 'overlayCanvas',
        name: 'Overlay Canvas',
        blocks: [
            {
            opcode: 'drawText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'draw text [TEXT] on overlay',
            arguments: {
                TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Hello overlay!'
                }
            }
            }
        ]
        };
    }

    _createOverlayCanvas() {
        this.stageContainer = document.querySelector('.stage-container, .stage-wrapper, .stage-layer');
        if (!this.stageContainer) {
        console.warn('Could not find stage container for overlay canvas.');
        return;
        }

        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.id = 'customOverlayCanvas';
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.pointerEvents = 'none'; // so clicks pass through
        this.overlayCanvas.style.zIndex = 1000; // above stage
        document.body.appendChild(this.overlayCanvas);

        this.ctx = this.overlayCanvas.getContext('2d');

        this._onResize();
    }

    _onResize() {
        if (!this.stageContainer || !this.overlayCanvas) return;
        const rect = this.stageContainer.getBoundingClientRect();
        this.overlayCanvas.style.left = rect.left + 'px';
        this.overlayCanvas.style.top = rect.top + 'px';
        this.overlayCanvas.width = rect.width;
        this.overlayCanvas.height = rect.height;
    }

    drawText(args) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(args.TEXT, 10, 30);
    }
}


Scratch.extensions.register(new OverlayCanvasExtension());
