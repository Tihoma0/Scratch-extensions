(function(Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('This must run unsandboxed');
    }

    class WebGLOverlay {
        constructor() {
            this.canvas = null;
        }

        initOverlay(util) {
            const runtime = util.runtime;
            const stageCanvas = runtime.renderer.canvas;

            const overlay = document.createElement('canvas');
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99998';
            stageCanvas.parentElement.appendChild(overlay);

            this.canvas = overlay;
            gl = overlay.getContext('webgl2');

            if (!gl) throw new Error("WebGL2 not supported");

            gl.viewport(0, 0, overlay.width, overlay.height);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        getGL() {
            return gl;
        }

        getCanvas() {
            return this.canvas;
        }
    }

    class PenStyle {
        constructor() {
            this.fillStyle = 'rgba(255,0,0,1)';
            this.strokeStyle = 'rgba(150, 0, 0, 1)';
            this.lineWidth = 1;
        }
    }

    class OverlayEngine {
        constructor() {
            this.ctx = null;
            this.draw_commands = [];
            this.dirty = true;
        }

        initOverlay(util) {
            const runtime = util.runtime; // safe reference
            const stageCanvas = runtime.renderer.canvas;

            const overlay = document.createElement('canvas');
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99999';
            stageCanvas.parentElement.appendChild(overlay);

            this.overlay = overlay;
            this.ctx = overlay.getContext('2d');

            const syncOverlay = () => {
                const rect = stageCanvas.getBoundingClientRect();
                overlay.width = stageCanvas.width;
                overlay.height = stageCanvas.height;
                overlay.style.left = 0 + 'px';
                overlay.style.top = 0 + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
                overlay.style.background = 'rgba(255, 3, 3, 0.15)';
                this.ctx.setTransform(
                    overlay.width / 480, 0, //xx, xy
                    0, overlay.height / 360, // yx, yy
                    overlay.width / 2, //xoffset
                    overlay.height / 2 //yoffset
                );
                this.forceRedraw();
                // this.dirty = true;
            };

            new ResizeObserver(syncOverlay).observe(stageCanvas);
            window.addEventListener('resize', syncOverlay);
            syncOverlay();            
        }


        redraw() {
            if (!this.dirty) return;
            this.ctx.clearRect(-240, -180, 480, 360);
            for (const [command, penstyle] of this.draw_commands) command(penstyle);
            this.dirty = false;
        }

        forceRedraw() {
            this.dirty = true;
            this.redraw();
        }

        addCommand(cmd, penstyle) {
            this.draw_commands.push([cmd, penstyle]);
            this.dirty = true;
        }

        clear_commands() {
            this.draw_commands = [];
            this.dirty = true;
        }
        

    }

    class OverlayExtension {
        constructor() {
            this.overlay = null;
            this.ctx = null;
            this.t = 0;
            this.loop  = this.loop.bind(this);
            this.is_running = false;
            this.currentPenstyle = new PenStyle();
        }

        getInfo() {
            return {
                id: 'extension',
                name: 'Overlay Extension',
                blocks: [
                    { // clear
                        opcode: 'clear',
                        blockType: Scratch.BlockType.COMMAND,
                        text:"Clear Overlay",
                    },
                    { // set fill
                        opcode: 'setFillColor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set fill color to r: [r] g: [g] b: [b] a: [a]',
                        arguments: {
                            "r": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 255},
                            "g": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "b": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "a": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 1},
                        }
                    }, 
                    { // set stroke
                        opcode: 'setStrokeColor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set outline color to r: [r] g: [g] b: [b] a: [a]',
                        arguments: {
                            "r": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 150},
                            "g": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "b": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "a": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 1},
                        }
                    },
                    { // set line width
                        opcode: 'setLineWidth',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set line width to [width]',
                        arguments: {
                            "width": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 1},
                        }
                    },
                    { // fill rect
                        opcode: 'fillRect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Fill Rect x: [x] y: [y] w: [width] h: [height]',
                        arguments: {
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "width": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            "height": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                        }
                    },
                    { // draw rect
                        opcode: 'drawRect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Draw Rect x: [x] y: [y] w: [width] h: [height]',
                        arguments: {
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "width": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            "height": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            
                        }
                    },
                    { // fill circle
                        opcode: 'fillCircle',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Fill Circle x: [x] y: [y] radius: [radius]',
                        arguments: {
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "radius": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 50},
                            
                        }

                    },
                    { // circle
                        opcode: 'drawCircle',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Draw Circle x: [x] y: [y] radius: [radius]',
                        arguments: {
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "radius": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 50},
                        
                        }
                    },
                    {// fill oval
                        opcode: 'fillOval',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Fill Oval x: [x] y: [y] w: [width] h: [height]',
                        arguments: {
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "width": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            "height": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            
                        }
                    },
                    { // draw oval
                        opcode: 'drawOval',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Draw Oval x: [x] y: [y] w: [width] h: [height]',
                        arguments: {
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "width": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            "height": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            
                        }
                    },
                    { // line
                        opcode: 'drawLine',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Draw Line x1: [x1] y1: [y1] x2: [x2] y2: [y2]',
                        arguments: {
                            "x1": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y1": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "x2": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            "y2": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 100},
                            
                        }
                    },
                    { // text
                        opcode: 'fillText',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Draw Text [text] x: [x] y: [y] size: [size] font: [font]',
                        arguments: {
                            "text": {"type": Scratch.ArgumentType.STRING, "defaultValue": "Hello World"},
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "size": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 20},
                            "font": {"type": Scratch.ArgumentType.STRING, "defaultValue": "Arial"},
                        }
                    },
                    { // outline text
                        opcode: 'outlineText',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Outline Text [text] x: [x] y: [y] size: [size] font: [font]',
                        arguments: {
                            "text": {"type": Scratch.ArgumentType.STRING, "defaultValue": "Hello World"},
                            "x": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "y": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 0},
                            "size": {"type": Scratch.ArgumentType.NUMBER, "defaultValue": 20},
                            "font": {"type": Scratch.ArgumentType.STRING, "defaultValue": "Arial"},
                        }
                    },
                    { // init webGLOverlay
                        opcode: 'initWebGLOverlay',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Init WebGLOverlay',    
                    },
                    { // is WebGLOverlay initialized?
                        opcode: 'isWebGLOverlayInitialized',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is WebGLOverlay initialized?',    
                    }

                ]
            };
        }

        initOverlay(args, util) {
            if (this.overlay) return;
            this.overlay = new OverlayEngine();
            this.overlay.initOverlay(util);
        }

        initWebGLOverlay(args, util) {
            if (this.overlay) return;
            this.webgloverlay = new WebGLOverlay();
            this.webgloverlay.initOverlay(util);
        }

        isWebGLOverlayInitialized(util) {
            return !!this.webgloverlay;
        }

        ensureOverlay(util) {
            if (!this.overlay) this.initOverlay(util);
            if (!this.is_running){
                requestAnimationFrame(this.loop);
                this.is_running = true;
            }
        }

        setFillColor(args, util) {
            this.currentPenstyle.fillStyle = `rgba(${args.r}, ${args.g}, ${args.b}, ${args.a/255})`;
        }

        setStrokeColor(args, util) {
            this.currentPenstyle.strokeStyle = `rgba(${args.r}, ${args.g}, ${args.b}, ${args.a/255})`;
        }

        setLineWidth(args, util) {
            this.currentPenstyle.lineWidth = args.width;
        }

        drawRect(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.strokeRect(args.x, -args.y, args.width, -args.height);
            }, { ...this.currentPenstyle });
        }

        drawCircle(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.arc(args.x, -args.y, args.radius, 0, 2 * Math.PI);
                this.overlay.ctx.stroke();
            }, { ...this.currentPenstyle });
        }

        drawOval(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.ellipse(args.x, -args.y, args.width, -args.height, 0, 0, 2 * Math.PI);
                this.overlay.ctx.stroke();
            }, { ...this.currentPenstyle });
        }

        fillRect(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.fillRect(args.x, -args.y, args.width, -args.height);
            }, { ...this.currentPenstyle });
        }

        fillCircle(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.arc(args.x, -args.y, args.radius, 0, 2 * Math.PI);
                this.overlay.ctx.fill();
            }, { ...this.currentPenstyle });
        }

        fillOval(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.ellipse(args.x, -args.y, args.width, -args.height, 0, 0, 2 * Math.PI);
                this.overlay.ctx.fill();
            }, { ...this.currentPenstyle });
        }

        fillText(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.font = `${args.size}px ${args.font}`;
                this.overlay.ctx.fillText(args.text, args.x, -args.y);
            }, { ...this.currentPenstyle });
        }

        outlineText(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.font = `${args.size}px ${args.font}`;
                this.overlay.ctx.strokeText(args.text, args.x, -args.y);
            }, { ...this.currentPenstyle });
        }

        drawLine(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.moveTo(args.x1, -args.y1);
                this.overlay.ctx.lineTo(args.x2, -args.y2);
                this.overlay.ctx.stroke();
            }, { ...this.currentPenstyle });
        }

        clear(args, util) {
            this.ensureOverlay(util);
            this.overlay.clear_commands();
            this.overlay.forceRedraw();
        }

        loop(timestamp) {
            this.overlay.redraw();
            requestAnimationFrame(this.loop);
        }

    }

    Scratch.extensions.register(new OverlayExtension());
})(Scratch);
