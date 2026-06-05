(function(Scratch) {
    'use strict';
    class PenStyle {
        constructor() {
            this.fillStyle = 'rgba(255,0,0,1)';
            this.strokeStyle = 'rgba(150, 0, 0, 1)';
            this.lineWidth = 1;
            
        } 
    } class OverlayEngine {
        constructor() {
            this.ctx = null;
            this.draw_commands = [];
            this.dirty = true;
            
        } initOverlay(util) {
            const runtime = util.runtime;
            
// safe reference 
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
                overlay.style.background = 'rgba(0, 0, 0, 0)';
                this.ctx.setTransform( overlay.width / 480, 0, 

                    0, overlay.height / 360, 
                    overlay.width / 2, 
                    overlay.height / 2 
                    );
                this.forceRedraw();
                
// this.dirty = true;
                
            };
            new ResizeObserver(syncOverlay).observe(stageCanvas);
            window.addEventListener('resize', syncOverlay);
            syncOverlay();
            
        } redraw() {
            if (!this.dirty) return;
            this.ctx.clearRect(-240, -180, 480, 360);
            for (const [command, penstyle] of this.draw_commands)
                console.log(penstyle);
            for (const [command, penstyle] of this.draw_commands) command(penstyle);
            this.dirty = false;
            
        } forceRedraw() {
            this.dirty = true;
            this.redraw();
            
        } addCommand(cmd, penstyle) {
            this.draw_commands.push([cmd, penstyle]);
            this.dirty = true;
            
        } clear_commands() {
            this.draw_commands = [];
            this.dirty = true;
            
        } 
    } class OverlayExtension {
        constructor() {
            this.overlay = null;
            this.ctx = null;
            this.t = 0;
            this.loop = this.loop.bind(this);
            this.is_running = false;
            this.currentPenstyle = new PenStyle();
            
        } getInfo() {
            return {
                id: 'extension', name: 'Overlay Extension', color1: "#52a178", color2: "#4e9e83", color3: "#359b68", blocks: 
                [ 
                    {
                        opcode: 'clearOverlay', blockType: Scratch.BlockType.COMMAND, text:"Clear Overlay", 
                    }, {
                        
                        opcode: 'setFillColor', blockType: Scratch.BlockType.COMMAND, text: 'Set fill color to r: [r] g: [g] b: [b] a: [a]', arguments: {
                            "r": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 255
                            }, "g": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                            }, "b": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                            }, "a": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 255
                            }, 
                        } 
                    }, {
                        opcode: 'setStrokeColor', blockType: Scratch.BlockType.COMMAND, text: 'Set outline color to r: [r] g: [g] b: [b] a: [a]', arguments: 
                        {
                            "r": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 150
                            }, "g": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                            }, "b": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                            }, "a": {
                                "type": Scratch.ArgumentType.NUMBER, "defaultValue": 255
                            }, 
                        } 
                    }, {
                        opcode: 'setLineWidth', blockType: Scratch.BlockType.COMMAND, text: 'Set line width to [width]', arguments: {
                        "width": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 1
                        }, 
                    } 
                },
                {
                    
// fill rect 
                        opcode: 'fillRect', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Fill Rect x: [x] y: [y] w: [width] h: [height]', arguments: {
                        "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "width": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, "height": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, 
                    } 
                }, {
                    
// draw rect 
                        opcode: 'drawRect', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Draw Rect x: [x] y: [y] w: [width] h: [height]', arguments: {
                        "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "width": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, "height": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, 
                    } 
                }, {
                    
// fill circle 
                        opcode: 'fillCircle', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Fill Circle x: [x] y: [y] radius: [radius]', arguments: {
                        "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "radius": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 50
                        }, 
                    } 
                }, {
                    
// circle 
                        opcode: 'drawCircle', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Draw Circle x: [x] y: [y] radius: [radius]', arguments: {
                        "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "radius": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 50
                        }, 
                    } 
                }, {
                    
// fill oval 
                        opcode: 'fillOval', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Fill Oval x: [x] y: [y] w: [width] h: [height]', arguments: {
                        "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "width": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, "height": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, 
                    } 
                }, {
                    
// draw oval 
                        opcode: 'drawOval', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Draw Oval x: [x] y: [y] w: [width] h: [height]', arguments: {
                        "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "width": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, "height": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, 
                    } 
                }, {
                    
// line 
                        opcode: 'drawLine', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Draw Line x1: [x1] y1: [y1] x2: [x2] y2: [y2]', arguments: {
                        "x1": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y1": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "x2": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, "y2": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 100
                        }, 
                    } 
                }, {
                    
// text 
                        opcode: 'fillText', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Draw Text [text] x: [x] y: [y] size: [size] font: [font]', arguments: {
                        "text": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "Hello World"
                        }, "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "size": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 20
                        }, "font": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "Arial"
                        }, 
                    } 
                }, {
                    
// outline text 
                        opcode: 'outlineText', 
                        blockType: Scratch.BlockType.COMMAND, text: 'Outline Text [text] x: [x] y: [y] size: [size] font: [font]', arguments: {
                        "text": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "Hello World"
                        }, "x": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "y": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "size": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 20
                        }, "font": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "Arial"
                        }, 
                    } 
                } ], 
            };
            
        } initOverlay(util) {
            if (this.overlay) return;
            this.overlay = new OverlayEngine();
            this.overlay.initOverlay(util);
            
        } ensureOverlay(util) {
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
            
        } drawRect(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.strokeRect(args.x, -args.y, args.width, -args.height);
            }, {
                ...this.currentPenstyle
            });
            
        } drawCircle(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.arc(args.x, -args.y, args.radius, 0, 2 * Math.PI);
                this.overlay.ctx.stroke();
                
            }, {
                ...this.currentPenstyle 
            });
            
        } drawOval(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.ellipse(args.x, -args.y, args.width, args.height, 0, 0, 2 * Math.PI);
                this.overlay.ctx.stroke();
                
            }, {
                ...this.currentPenstyle 
            });
            
        } fillRect(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                console.log(penstyle);
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.fillRect(args.x, -args.y, args.width, -args.height);
                
            }, {
                ...this.currentPenstyle 
            });
            
        } fillCircle(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.arc(args.x, -args.y, args.radius, 0, 2 * Math.PI);
                this.overlay.ctx.fill();
                
            }, {
                ...this.currentPenstyle 
            });
            
        } fillOval(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.ellipse(args.x, -args.y, args.width, args.height, 0, 0, 2 * Math.PI);
                this.overlay.ctx.fill();
                
            }, {
                ...this.currentPenstyle 
            });
            
        } fillText(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.fillStyle = penstyle.fillStyle;
                this.overlay.ctx.font = `${args.size}px ${args.font}`;
                this.overlay.ctx.fillText(args.text, args.x, -args.y);
                
            }, {
                ...this.currentPenstyle 
            });
            
        } outlineText(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.font = `${args.size}px ${args.font}`;
                this.overlay.ctx.strokeText(args.text, args.x, -args.y);
                
            }, {
                ...this.currentPenstyle 
            });
            
        } drawLine(args, util) {
            this.ensureOverlay(util);
            this.overlay.addCommand((penstyle) => {
                this.overlay.ctx.strokeStyle = penstyle.strokeStyle;
                this.overlay.ctx.lineWidth = penstyle.lineWidth;
                this.overlay.ctx.beginPath();
                this.overlay.ctx.moveTo(args.x1, -args.y1);
                this.overlay.ctx.lineTo(args.x2, -args.y2);
                this.overlay.ctx.stroke();
                
            }, {
                ...this.currentPenstyle 
            });
            
        } clearOverlay(args, util) {
            console.log("Clearing overlay");
            this.ensureOverlay(util);
            this.overlay.clear_commands();
            this.overlay.forceRedraw();
            
        } loop(timestamp) {
            this.overlay.redraw();
            requestAnimationFrame(this.loop);
        } 
    } const vertexShaderSrc = `#version 300 es precision highp float;
    in vec3 a_position;
    in vec3 a_color;
    out vec3 v_color;
    void main() {
        gl_Position = vec4(a_position, 1.0);
        v_color = a_color;
        
    }`;
    const fragmentShaderSrc = `#version 300 es precision highp float;
    in vec3 v_color;
    out vec4 f_color;
    void main() {
        f_color = vec4(v_color, 1.0);
        
    }`;
    let gl = null;
    if (!Scratch.extensions.unsandboxed) {
        throw new Error('This must run unsandboxed');
        
    } class Shader {
        constructor(gl, vertexShaderSrc, fragmentShaderSrc, source) {
            this.program = gl.createProgram();
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(vertexShader, vertexShaderSrc);
            gl.shaderSource(fragmentShader, fragmentShaderSrc);
            gl.compileShader(vertexShader);
            gl.compileShader(fragmentShader);
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);
            gl.useProgram(this.program);
            this.checkShader(vertexShader, gl);
            this.checkShader(fragmentShader, gl);
            this.checkProgram(this.program, gl);
            this.uniforms = {
                
            };
            
        } checkShader(shader, gl) {
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                
            } 
        } checkProgram(program, gl) {
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(program));
                
            } 
        } use(gl) {
            gl.useProgram(this.program);
            
        } getUniform(name) {
            if (this.uniforms[name]) return this.uniforms[name];
            const loc = gl.getUniformLocation(this.program, name);
            if (loc === null) {
                console.error(`Could not find uniform ${name} in shader`);
                
            } return loc;
            
        } 
    } class WebGLOverlay {
        constructor() {
            this.canvas = null;
            gl = null;
            this.program = null;
            this.shader = null;
            this.GL = {
                
            };
            
        } initOverlay(util) {
            const runtime = util.runtime;
            const stageCanvas = runtime.renderer.canvas;
            const overlay = document.createElement('canvas');
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99998';
            stageCanvas.parentElement.appendChild(overlay);
            this.canvas = overlay;
            gl = overlay.getContext('webgl2', {
                alpha: true, premultipliedAlpha: false 
            });
            if (!gl) throw new Error("WebGL2 not supported");
            const syncOverlay = () => {
                const rect = stageCanvas.getBoundingClientRect();
                overlay.width = stageCanvas.width;
                overlay.height = stageCanvas.height;
                overlay.style.left = 0 + 'px';
                overlay.style.top = 0 + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
                overlay.style.background = 'rgba(255, 3, 3, 0)';
                gl.viewport(0, 0, overlay.width, overlay.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                
            };
            new ResizeObserver(syncOverlay).observe(stageCanvas);
            window.addEventListener('resize', syncOverlay);
            syncOverlay();
            this.shader = new Shader(gl, vertexShaderSrc, fragmentShaderSrc);
            this.GL = {
                GL_COLOR_BUFFER_BIT: gl.COLOR_BUFFER_BIT, GL_DEPTH_BUFFER_BIT: gl.DEPTH_BUFFER_BIT, GL_STENCIL_BUFFER_BIT: gl.STENCIL_BUFFER_BIT, GL_ARRAY_BUFFER: gl.ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER: gl.ELEMENT_ARRAY_BUFFER, GL_UNIFORM_BUFFER: gl.UNIFORM_BUFFER, GL_COPY_READ_BUFFER: gl.COPY_READ_BUFFER, GL_COPY_WRITE_BUFFER: gl.COPY_WRITE_BUFFER, GL_TRANSFORM_FEEDBACK_BUFFER: gl.TRANSFORM_FEEDBACK_BUFFER, GL_STATIC_DRAW: gl.STATIC_DRAW, GL_DYNAMIC_DRAW: gl.DYNAMIC_DRAW, GL_STREAM_DRAW: gl.STREAM_DRAW, GL_BYTE: gl.BYTE, GL_UNSIGNED_BYTE: gl.UNSIGNED_BYTE, GL_SHORT: gl.SHORT, GL_UNSIGNED_SHORT: gl.UNSIGNED_SHORT, GL_INT: gl.INT, GL_UNSIGNED_INT: gl.UNSIGNED_INT, GL_FLOAT: gl.FLOAT, GL_LOW_FLOAT: gl.LOW_FLOAT, GL_MEDIUM_FLOAT: gl.MEDIUM_FLOAT, GL_HIGH_FLOAT: gl.HIGH_FLOAT, GL_LOW_INT: gl.LOW_INT, GL_MEDIUM_INT: gl.MEDIUM_INT, GL_HIGH_INT: gl.HIGH_INT, GL_POINTS: gl.POINTS, GL_LINES: gl.LINES, GL_LINE_LOOP: gl.LINE_LOOP, GL_LINE_STRIP: gl.LINE_STRIP, GL_TRIANGLES: gl.TRIANGLES, GL_TRIANGLE_STRIP: gl.TRIANGLE_STRIP, GL_TRIANGLE_FAN: gl.TRIANGLE_FAN, 
            };
            
        } 
    } class WebGLOverlayExtension {
        constructor() {
            this.vaos = new Map();
            this.vbos = new Map();
            this.webgloverlay = null;
            const stage = Scratch.vm.runtime.getTargetForStage();
            
        } getInfo() {
            return {
                id: 'webglExtension', name: 'WebglOverlay Extension', color1: "#3b8f92", color2: "#30767d", color3: "#2b616d", blocks: 
                [ 
                    {
                    
// init webGLOverlay 
                    opcode: 'initWebGLOverlay', blockType: Scratch.BlockType.COMMAND, text: 'Init WebGLOverlay', 
                }, {
                    
// is WebGLOverlay initialized? 
                    opcode: 'isWebGLOverlayInitialized', blockType: Scratch.BlockType.BOOLEAN, text: 'Is WebGLOverlay initialized?', 
                }, {
                    opcode: "glclearcolor", blockType: Scratch.BlockType.COMMAND, text: "glClearColor r: [r] g: [g] b: [b] a: [a]", arguments: {
                        "r": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 255
                        }, "g": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "b": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 0
                        }, "a": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": 255
                        }, 
                    } 
                }, {
                    opcode: "glclear", blockType: Scratch.BlockType.COMMAND, text: "glClear args: [args]", arguments: {
                        "args": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glClearBits', "defaultValue": "GL_COLOR_BUFFER_BIT"
                        }, 
                    } 
                }, {
                    opcode: "drawTriangle", blockType: Scratch.BlockType.COMMAND, text: "DrawTriangle", 
                }, {
                    opcode: "glcreateVertexArray", blockType: Scratch.BlockType.COMMAND, text: "glCreateVertexArray [name]", arguments: {
                        "name": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "vertexArray1"
                        }, 
                    } 
                }, {
                    opcode: "glDeleteVertexArray", blockType: Scratch.BlockType.COMMAND, text: "glDeleteVertexArray [name]", arguments: {
                        "name": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "vertexArray1"
                        }, 
                    } 
                }, {
                    opcode: "deleteAllVertexArrays", blockType: Scratch.BlockType.COMMAND, text: "deleteAllVertexArrays", 
                }, {
                    opcode: "glBindVertexArray", blockType: Scratch.BlockType.COMMAND, text: "glBindVertexArray [name]", arguments: {
                        "name": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "vertexArray1"
                        }, 
                    } 
                }, {
                    opcode: "glCreateBuffer", blockType: Scratch.BlockType.COMMAND, text: "glCreateBuffer [target] [name]", arguments: {
                        "target": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glBufferTargets', "defaultValue": "GL_ARRAY_BUFFER"
                        }, "name": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "vertexArray1"
                        }, 
                    } 
                }, {
                    opcode: "glDeleteBuffer", blockType: Scratch.BlockType.COMMAND, text: "glDeleteBuffer [target] [name]", arguments: {
                        "target": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glBufferTargets', "defaultValue": "GL_ARRAY_BUFFER"
                        }, "name": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "vertexArray1"
                        }, 
                    } 
                }, {
                    opcode: "deleteAllBuffers", blockType: Scratch.BlockType.COMMAND, text: "deleteAllBuffers", 
                }, {
                    opcode: "glBindBuffer", blockType: Scratch.BlockType.COMMAND, text: "glBindBuffer [target] [name]", arguments: {
                        "target": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glBufferTargets', "defaultValue": "GL_ARRAY_BUFFER"
                        }, "name": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "vertexArray1"
                        }, 
                    } 
                }, {
                    opcode: "glBufferData", blockType: Scratch.BlockType.COMMAND, text: "glBufferData [target] [data] [usage] [type]", arguments: {
                        "target": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glBufferTargets', "defaultValue": "GL_ARRAY_BUFFER"
                        }, "data": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "[]"
                        }, "usage": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glBufferUsages', "defaultValue": "GL_STATIC_DRAW"
                        }, "type": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glDataTypes', "defaultValue": "GL_FLOAT"
                        }, 
                    } 
                }, {
                    opcode: "glEnableVertexAttribArray", blockType: Scratch.BlockType.COMMAND, text: "glEnableVertexAttribArray [index]", arguments: {
                        "index": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "1"
                        }, 
                    } 
                }, {
                    opcode: "glVertexAttribPointer", blockType: Scratch.BlockType.COMMAND, text: "glVertexAttribPointer [index] [size] [type] [normalized] [stride] [offset]", arguments: {
                        "index": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "1"
                        }, "size": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "2"
                        }, "type": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glDataTypes', "defaultValue": "GL_FLOAT"
                        }, "normalized": {
                            "type": Scratch.ArgumentType.STRING, "defaultValue": "false"
                        }, "stride": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "0"
                        }, "offset": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "0"
                        }, 
                    } 
                }, {
                    opcode: "glDrawArrays", blockType: Scratch.BlockType.COMMAND, text: "glDrawArrays [mode] [first] [count]", arguments: {
                        "mode": {
                            "type": Scratch.ArgumentType.STRING, menu: 'glDrawModes', "defaultValue": "GL_TRIANGLES"
                        }, "first": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "0"
                        }, "count": {
                            "type": Scratch.ArgumentType.NUMBER, "defaultValue": "3"
                        }, 
                    } 
                }, {
                    opcode: "printBoundBuffers", blockType: Scratch.BlockType.COMMAND, text: "print bound buffers", 
                }, {
                    opcode: "setListFromArray", blockType: Scratch.BlockType.COMMAND, text: "set list named: [list] to array [array]", arguments: {
                        list: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "List1"
                        }, array: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "[]", 
                        } 
                    } 
                }, ], menus: {
                    glClearBits: {
                        acceptReporters: true, items: [ {
                            text: 'Color', value: 'GL_COLOR_BUFFER_BIT' 
                        }, {
                            text: 'Depth', value: 'GL_DEPTH_BUFFER_BIT' 
                        }, {
                            text: 'Stencil', value: 'GL_STENCIL_BUFFER_BIT' 
                        }, ] 
                    }, glBufferTargets: {
                        acceptReporters: true, items: [ {
                            text: 'ARRAY_BUFFER', value: 'GL_ARRAY_BUFFER' 
                        }, {
                            text: 'ELEMENT_ARRAY_BUFFER', value: 'GL_ELEMENT_ARRAY_BUFFER' 
                        }, {
                            text: 'UNIFORM_BUFFER', value: 'GL_UNIFORM_BUFFER' 
                        }, {
                            text: 'COPY_READ_BUFFER', value: 'GL_COPY_READ_BUFFER' 
                        }, {
                            text: 'COPY_WRITE_BUFFER', value: 'GL_COPY_WRITE_BUFFER' 
                        }, {
                            text: 'TRANSFORM_FEEDBACK_BUFFER', value: 'GL_TRANSFORM_FEEDBACK_BUFFER' 
                        }, ] 
                    }, glBufferUsages: {
                        acceptReporters: true, items: [ {
                            text: 'STATIC_DRAW', value: 'GL_STATIC_DRAW' 
                        }, {
                            text: 'DYNAMIC_DRAW', value: 'GL_DYNAMIC_DRAW' 
                        }, {
                            text: 'STREAM_DRAW', value: 'GL_STREAM_DRAW' 
                        }, ] 
                    }, glDataTypes: {
                        acceptReporters: false, items: [ {
                            text: 'BYTE', value: 'GL_BYTE' 
                        }, {
                            text: 'UNSIGNED_BYTE', value: 'GL_UNSIGNED_BYTE' 
                        }, {
                            text: 'SHORT', value: 'GL_SHORT' 
                        }, {
                            text: 'UNSIGNED_SHORT', value: 'GL_UNSIGNED_SHORT' 
                        }, {
                            text: 'INT', value: 'GL_INT' 
                        }, {
                            text: 'UNSIGNED_INT', value: 'GL_UNSIGNED_INT' 
                        }, {
                            text: 'FLOAT', value: 'GL_FLOAT' 
                        }, ] 
                    }, glDrawModes: {
                        acceptReporters: false, items: [ {
                            text: 'POINTS', value: 'GL_POINTS' 
                        }, {
                            text: 'LINES', value: 'GL_LINES' 
                        }, {
                            text: 'LINE_LOOP', value: 'GL_LINE_LOOP' 
                        }, {
                            text: 'LINE_STRIP', value: 'GL_LINE_STRIP' 
                        }, {
                            text: 'TRIANGLES', value: 'GL_TRIANGLES' 
                        }, {
                            text: 'TRIANGLE_STRIP', value: 'GL_TRIANGLE_STRIP' 
                        }, {
                            text: 'TRIANGLE_FAN', value: 'GL_TRIANGLE_FAN' 
                        }, ] 
                    }, 
                } 
            };
            
        } initWebGLOverlay(args, util) {
            if (this.webgloverlay) return;
            this.webgloverlay = new WebGLOverlay();
            this.webgloverlay.initOverlay(util);
            return new Promise(resolve => {
                setTimeout(resolve, 0);
                
// Wtf stupid f*cking scratch 
            });
            
        } isWebGLOverlayInitialized(util) {
            return !!this.webgloverlay;
            
        } glclearcolor(args, util) {
            if (!this.webgloverlay) return;
            gl.clearColor(args.r/255, args.g/255, args.b/255, args.a/255);
            
        } glclear(args, util) {
            if (!this.webgloverlay) return;
            switch (args.args) {
                case "GL_COLOR_BUFFER_BIT": gl.clear(gl.COLOR_BUFFER_BIT);
                break;
                case "GL_DEPTH_BUFFER_BIT": gl.clear(gl.DEPTH_BUFFER_BIT);
                break;
                case "GL_STENCIL_BUFFER_BIT": gl.clear(gl.STENCIL_BUFFER_BIT);
                break;
                
            } 
        } glcreateVertexArray(args, util) {
            if (!this.webgloverlay) return;
            const vao = gl.createVertexArray();
            this.vaos.set(args.name, vao);
            
        } glDeleteVertexArray(args, util) {
            if (!this.webgloverlay) return;
            gl.deleteVertexArray(this.vaos.get(args.name));
            this.vaos.delete(args.name);
            
        } deleteAllVertexArrays() {
            if (!this.webgloverlay) return;
            for (const vao of this.vaos.values()) {
                gl.deleteVertexArray(vao);
                
            } this.vaos.clear();
            
        } glBindVertexArray(args, util) {
            if (!this.webgloverlay) return;
            gl.bindVertexArray(this.vaos.get(args.name));
            this.printBoundBuffers(args, util);
            
        } glCreateBuffer(args, util) {
            if (!this.webgloverlay) return;
            const vbo = gl.createBuffer();
            this.vbos.set(args.name, vbo);
            
        } glDeleteBuffer(args, util) {
            if (!this.webgloverlay) return;
            gl.deleteBuffer(this.vbos.get(args.name));
            this.vbos.delete(args.name);
            
        } deleteAllBuffers() {
            if (!this.webgloverlay) return;
            for (const vbo of this.vbos.values()) {
                gl.deleteBuffer(vbo);
                
            } this.vbos.clear();
            
        } glBindBuffer(args, util) {
            if (!this.webgloverlay) return;
            gl.bindBuffer(this.webgloverlay.GL[args.target], this.vbos.get(args.name));
            
        } printBoundBuffers(args, util) {
            if (!this.webgloverlay) return;
            console.log(gl.getParameter(gl.VERTEX_ARRAY_BINDING));
            console.log(gl.getParameter(gl.ARRAY_BUFFER_BINDING));
            console.log(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING));
            console.log(gl.getParameter(gl.COPY_READ_BUFFER_BINDING));
            console.log(gl.getParameter(gl.COPY_WRITE_BUFFER_BINDING));
            console.log(gl.getParameter(gl.TRANSFORM_FEEDBACK_BINDING));
            console.log(gl.getParameter(gl.UNIFORM_BUFFER_BINDING));
            console.log(this.vaos);
            console.log(this.vbos);
            
        } glBufferData(args, util) {
            if (!this.webgloverlay) return;
            let data;
            const list = util.target.lookupVariableByNameAndType( args.data, "list" );
            if (list) {
                data = list.value.map(Number);
                
            } else {
                data = JSON.parse(args.data);
                
            } let buf;
            switch (args.type) {
                case "GL_FLOAT": buf = new Float32Array(data);
                break;
                case "GL_INT": buf = new Int32Array(data);
                break;
                case "GL_UNSIGNED_INT": buf = new Uint32Array(data);
                break;
                case "GL_BYTE": buf = new Int8Array(data);
                break;
                case "GL_UNSIGNED_BYTE": buf = new Uint8Array(data);
                break;
                case "GL_SHORT": buf = new Int16Array(data);
                break;
                case "GL_UNSIGNED_SHORT": buf = new Uint16Array(data);
                break;
                default: throw new Error(`Invalid gl type: ${args.type}`);
                
            } const target = this.webgloverlay.GL[args.target];
            const usage = this.webgloverlay.GL[args.usage];
            if (!target || !usage) throw new Error(`Invalid gl target or usage: ${args.target}, ${args.usage}`);
            gl.bufferData(target, buf, usage);
            
        } glEnableVertexAttribArray(args, util) {
            if (!this.webgloverlay) return;
            gl.enableVertexAttribArray(args.index);
            
        } glVertexAttribPointer(args, util) {
            if (!this.webgloverlay) return;
            gl.vertexAttribPointer(args.index, args.size, this.webgloverlay.GL[args.type], args.normalized == "true", args.stride, args.offset);
            
        } glDrawArrays(args, util) {
            if (!this.webgloverlay) return;
            gl.drawArrays(this.webgloverlay.GL[args.mode], args.first, args.count);
            
        } drawTriangle(args, util) {
            if (!this.webgloverlay) return;
            const vertices = [ -0.5, 0.5, 0.0, 1.0, 0.0, 0.0, -0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 0.5, -0.5, 0.0, 0.0, 0.0, 1.0 ];
            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            
        }

        setListFromArray(args, util) {
            console.log(args.list);
            const target = util.target;
            const stage = util.runtime.getTargetForStage();
            const list = target.lookupVariableByNameAndType(args.list, 'list') || stage.lookupVariableByNameAndType(args.list, 'list');
            if (!list) {
                console.warn(`List "${args.list}" not found`);
                this.showError(`List "${args.list}" not found`);
                return;
                
            } args.array = JSON.parse(args.array);
            args.list.value = args.array.map(v => v.toString());
            
        } 
    } 
    const css = `.container {
        top: 0;
        left: 0;
        position: fixed;
        width: 40vw;
        height: 40vh;
        overflow: hidden;
        background-color: rgb(15, 15, 15);
        z-index: 1002;
        border: 8px solid rgb(160, 60, 60);
        border-radius: 2vw;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        
    } .menu {
        position: relative;
        width: 100%;
        height: 2.6vw;
        background-color: rgb(43, 43, 43);
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgb(255, 255, 255);
        font-size: 1.2vw;
        font-family: Arial, sans-serif;
        padding-left: 0.5vw;
        box-sizing: border-box;
        
    } .menu .close {
        position: relative;
        width: 2vw;
        height: 2vw;
        border-radius: 1vw;
        right: 0.3vw;
        background-color: rgb(160, 60, 60);
        transform: rotate(45deg);
        transition: transform 0.5s ease-out 
    } .menu .close {
        transform: rotate(135deg);
        background-color: rgb(212, 64, 64);
        
    } .menu .close .cross {
        position: absolute;
        background-color: rgb(223, 216, 216);
        border-radius: 2px;
        
    } .menu .close .cross.horizontal {
        width: 70%;
        height: 5px;
        left: 15%;
        top: 50%;
        transform: translateY(-50%);
        
    } .menu .close .cross.vertical {
        width: 5px;
        height: 70%;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        
    } .qArrayDisplayBox {
        position: relative;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgb(18, 18, 18);
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.3em;
        padding-top: 0.3em;
        overflow-y: auto;
        
    } .qArrayDisplay {
        width: auto;
        height: 1.2em;
        background-color: rgb(30, 30, 30);
        color: rgb(255, 255, 255);
        font-size: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        
    } .qArrayDisplayerror {
        background-color: rgb(255, 0, 0);
        
    } .qArrayDisplay .Name {
        width: 20%;
        font-size: 0.8em;
        padding-left: 0.3em;
        padding-right: 0.3em;
        
    } .qArrayDisplay .Value {
        width: auto;
        font-size: 0.8em;
        padding-left: 0.3em;
        padding-right: 0.3em;
        
    }`;
    class QArrayInspector {
        constructor() {
            this.displayElements = new Map();
            this.is_visible = false;
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
            this.div = document.createElement('div');
            this.div.setAttribute('class', 'container');
            document.body.appendChild(this.div);
            this.div_menu = document.createElement('div');
            this.div_menu.setAttribute('class', 'menu');
            this.div.appendChild(this.div_menu);
            this.div_menu.innerHTML = "Inspector";
            this.div_close = document.createElement('div');
            this.div_close.setAttribute('class', 'close');
            this.div_menu.appendChild(this.div_close);
            const crossH = document.createElement('div');
            const crossV = document.createElement('div');
            crossH.setAttribute('class', 'cross horizontal');
            crossV.setAttribute('class', 'cross vertical');
            this.div_close.appendChild(crossH);
            this.div_close.appendChild(crossV);
            this.QArrayDisplayBox = document.createElement('div');
            this.QArrayDisplayBox.setAttribute('class', 'qArrayDisplayBox');
            this.div.appendChild(this.QArrayDisplayBox);
            this.isDragging = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.resizeDir = {
                top: false, bottom: false, left: false, right: false 
            };
            this.div_menu.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                const rect = this.div.getBoundingClientRect();
                this.offsetX = e.clientX - rect.left;
                this.offsetY = e.clientY - rect.top;
                this.div.style.zIndex = '9999';
                
            });
            this.div_close.addEventListener('click', () => {
                this.hide();
                this.isDragging = false;
                this.isResizing = false;
                
            });
            this.div.addEventListener('mousedown', (e) => {
                const rect = this.div.getBoundingClientRect();
                const onRight = rect.right - e.clientX < 8;
                const onBottom = rect.bottom - e.clientY < 8;
                const onLeft = e.clientX - rect.left < 8;
                const onTop = e.clientY - rect.top < 8;
                this.offsetX = e.clientX - rect.left;
                this.offsetY = e.clientY - rect.top;
                this.div.style.zIndex = '9999';
                this.isResizing = true;
                this.resizeDir = {
                    top: onTop, bottom: onBottom, left: onLeft, right: onRight 
                };
                
            });
            document.addEventListener('mousemove', (e) => {
                if (this.isDragging) {
                    this.div.style.left = `${e.clientX - this.offsetX}px`;
                    this.div.style.top = `${e.clientY - this.offsetY}px`;
                    
                } else if (this.isResizing) {
                    const rect = this.div.getBoundingClientRect();
                    let newWidth = rect.width;
                    let newHeight = rect.height;
                    let newLeft = rect.left;
                    let newTop = rect.top;
                    if (this.resizeDir.right) newWidth = e.clientX - rect.left;
                    if (this.resizeDir.bottom) newHeight = e.clientY - rect.top;
                    if (this.resizeDir.left) {
                        newWidth = rect.right - e.clientX;
                        newLeft = e.clientX;
                        
                    } if (this.resizeDir.top) {
                        newHeight = rect.bottom - e.clientY;
                        newTop = e.clientY;
                        
                    } this.div.style.width = `${
                        Math.max(newWidth, 150)
                    }px`;
                    this.div.style.height = `${
                        Math.max(newHeight, 150)
                    }px`;
                    if (this.resizeDir.left) this.div.style.left = `${
                        newLeft
                    }px`;
                    if (this.resizeDir.top) this.div.style.top = `${
                        newTop
                    }px`;
                    
                } else {
                    const rect = this.div.getBoundingClientRect();
                    const onRight = rect.right - e.clientX < 8;
                    const onBottom = rect.bottom - e.clientY < 8;
                    const onLeft = e.clientX - rect.left < 8;
                    const onTop = e.clientY - rect.top < 8;
                    if ((onRight && onBottom) || (onLeft && onTop)) this.div.style.cursor = 'nwse-resize';
                    else if ((onRight && onTop) || (onLeft && onBottom)) this.div.style.cursor = 'nesw-resize';
                    else if (onRight || onLeft) this.div.style.cursor = 'ew-resize';
                    else if (onTop || onBottom) this.div.style.cursor = 'ns-resize';
                    else this.div.style.cursor = 'default';
                    
                } 
            });
            document.addEventListener('mouseup', () => {
                this.isDragging = false;
                this.isResizing = false;
                
            });
            
        } hide() {
            this.div.style.zIndex = '-1';
            this.is_visible = false;
            
        } 
        
        show() {
            this.div.style.zIndex = '9999';
            this.is_visible = true;
        }

        showError(message) {
            this.div_menu.style.backgroundColor = 'rgb(183, 22, 22)';
            this.div_menu.innerHTML = `ERROR: ${message}`;
            this.is_visible = true;
        }
        
        update(qArrays) {
            const names = new Set(qArrays.keys());
            for (const name of this.displayElements.keys()) {
                if (!names.has(name)) {
                    this.QArrayDisplayBox.removeChild(this.displayElements.get(name)[0]);
                    this.displayElements.delete(name);
                } 
            } for (const [name, array] of qArrays.entries()) {
                if (this.displayElements.has(name)) {
                    const [qArrayDisplay, ValueDisplay, nameDisplay] = this.displayElements.get(name);
                    const text = `${
                        JSON.stringify(array)
                    }`;
                    if (text.startsWith("ERROR:")) { qArrayDisplay.setAttribute('class', 'qArrayDisplayerror'); }
                    ValueDisplay.textContent = `${text}`;
                    nameDisplay.textContent = `${name}`;
                } 
                else { this.addQArrayDisplay(array, name); } 
            } 
        } 
        addQArrayDisplay(qArray, name = null) { 
            const qArrayDisplay = document.createElement('div'); 
            qArrayDisplay.setAttribute('class', 'qArrayDisplay'); 
            const nameDisplay = document.createElement('div'); 
                        nameDisplay.setAttribute('class', 'nameDisplay'); 
                        const ValueDisplay = document.createElement('div'); 
                        ValueDisplay.setAttribute('class', 'ValueDisplay'); 
                        const text = `${JSON.stringify(qArray)}`; 
                        if (text.startsWith("ERROR:")) {
                            qArrayDisplay.setAttribute('class', 'qArrayDisplayerror');
                        
                    } ValueDisplay.textContent = `${
                        text
                    }`;
                    nameDisplay.textContent = `${
                        name
                    }`;
                    this.displayElements.set(name, [qArrayDisplay, ValueDisplay, nameDisplay]);
                    qArrayDisplay.appendChild(nameDisplay);
                    qArrayDisplay.appendChild(ValueDisplay);
                    this.QArrayDisplayBox.appendChild(qArrayDisplay);
                    
                } 
    } 
                
    class ArrayExtension {
            constructor() {
                this.QArrays = new Map();
                this.QArrayInspector = null;
                this._lastUpdate = null;
                this.updateQArrayInspector.bind(this);
                
        } 
        
        getInfo() {
                return {
                    id: 'qArrays', name: 'QArrays', color1: "#923b7c", color2: "#7d3077", color3: "#6d2b6d", blocks: [ 
                {
                    // createQArray 
                    opcode: "createQArray", 
                    blockType: Scratch.BlockType.COMMAND, text: "create QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                }, {
                    // createQArrayFromJSArray 
                    opcode: "createQArrayFromJSArray", 
                    blockType: Scratch.BlockType.COMMAND, text: "create QArray [NAME] from JSArray [ARRAY]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, ARRAY: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "[]" 
                        }, 
                    } 
                }, {
                    // fillQArray
                    opcode: "fillQArray",
                    blockType: Scratch.BlockType.COMMAND, text: "fill QArray [NAME] with value [VALUE], size [SIZE]", 
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myArray"
                        }, VALUE: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myValue"
                        }, SIZE: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }
                    }
                }, {
                        
    // deleteQArray 
                opcode: "deleteQArray", 
                    blockType: Scratch.BlockType.COMMAND, text: "delete QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                }, {
                        
    // pushQArray 
                opcode: "pushQArray", 
                    blockType: Scratch.BlockType.COMMAND, text: "push [VALUE] to QArray [NAME], should cast: [SHOULDCAST]", arguments: {
                            VALUE: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myValue" 
                        }, NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, SHOULDCAST: {
                                type: Scratch.ArgumentType.STRING, menu: "falseetrue", defaultValue: "true" 
                        }, 
                    } 
                }, {
                        
    // popQArray 
                opcode: "popQArray", 
                    blockType: Scratch.BlockType.REPORTER, text: "pop QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                }, {
    // lengthOfQArray 
                opcode: "lengthOfQArray", 
                    blockType: Scratch.BlockType.REPORTER, text: "length of QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        },
                    }
                }, {
    // containsQArray 
                opcode: "containsQArray", 
                    blockType: Scratch.BlockType.BOOLEAN, text: "QArray [NAME] contains [VALUE], should cast: [SHOULDCAST]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, VALUE: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myValue" 
                        }, SHOULDCAST: {
                                type: Scratch.ArgumentType.STRING, menu: "falseetrue", defaultValue: "true" 
                        }, 
                    } 
                }, {
    // indexOfInQArray 
                opcode: "indexOfInQArray", 
                    blockType: Scratch.BlockType.REPORTER, text: "index of [VALUE] in QArray [NAME], should cast: [SHOULDCAST]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, VALUE: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myValue" 
                        }, SHOULDCAST: {
                                type: Scratch.ArgumentType.STRING, menu: "falseetrue", defaultValue: "true"
                        }
                    }
                }, {
                // getQarray 
                opcode: "getQArray", 
                    blockType: Scratch.BlockType.REPORTER, text: "get Element of QArray [NAME] at index [INDEX]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, INDEX: {
                                type: Scratch.ArgumentType.NUMBER, defaultValue: "0" 
                        }, 
                    } 
                }, {
                    // clearQArray 
                    opcode: "clearQArray", 
                    blockType: Scratch.BlockType.COMMAND, text: "clear QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                },{
                    //replaceSectionQArray
                    opcode: "replaceSectionQArray",
                    blockType: Scratch.BlockType.COMMAND, text: "replace [DELETECOUNT] elements of QArray [NAME] at index [INDEX],  with value [VALUE]", 
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myArray"
                        }, INDEX: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }, DELETECOUNT: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }, VALUE: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myValue"
                        }
                    }
                }, {
                    //deleteSectionQArray
                    opcode: "deleteSectionQArray",
                    blockType: Scratch.BlockType.COMMAND, text: "delete section of QArray [NAME] at index [INDEX], delete count [DELETECOUNT]", 
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myArray"
                        }, INDEX: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }, DELETECOUNT: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }
                    }
                },  {
                    // copyQArraytoQarray 
                    opcode: "copyQArraytoQarray", 
                    blockType: Scratch.BlockType.COMMAND, text: "copy QArray [NAME1] to QArray [NAME2]", arguments: {
                            NAME1: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, NAME2: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray2" 
                        }, 
                    } 
                }, {
                    // copy section of QArray
                    opcode: "copySectionOfQArray",
                    blockType: Scratch.BlockType.COMMAND, text: "copy section of QArray [NAME] at index [INDEX], copy count [COPYCOUNT], to QArray [NAME2]", 
                    arguments: {
                        NAME: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myArray"
                        }, INDEX: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }, COPYCOUNT: {
                            type: Scratch.ArgumentType.NUMBER, defaultValue: "0"
                        }, NAME2: {
                            type: Scratch.ArgumentType.STRING, defaultValue: "myArray2"
                        }
                    }
                }, {
                    // sortQArray 
                    opcode: "sortQArray", 
                    blockType: Scratch.BlockType.COMMAND, text: "sort QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                }, {
                    // reverseQArray 
                    opcode: "reverseQArray",  
                    blockType: Scratch.BlockType.COMMAND, text: "reverse QArray [NAME]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                }, {
                    // copyToScratchList 
                    opcode: "copyToScratchList",  
                    blockType: Scratch.BlockType.COMMAND, text: "copy QArray [NAME] to Scratch List named [NAME2]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, NAME2: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myList" 
                        }, 
                    } 
                }, {
                    // copyFromScratchList 
                    opcode: "copyFromScratchList",  
                    blockType: Scratch.BlockType.COMMAND, text: "copy Scratch List named [NAME] to QArray [NAME2]", arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myList" 
                        }, NAME2: {
                                type: Scratch.ArgumentType.STRING, defaultValue: "myArray" 
                        }, 
                    } 
                }, {
                    // showQArrays 
                    opcode: "showQArrays",  
                    blockType: Scratch.BlockType.COMMAND, text: "show QArrays", 
                }, {
                    // hideQArrays 
                    opcode: "hideQArrays",  
                    blockType: Scratch.BlockType.COMMAND, text: "hide QArrays", 
                }, ], menus: {
                        dtypes: {
                            acceptReporters: false, items: ["number", "string", "boolean"] 
                    }, falseetrue: {
                            acceptReporters: false, items: ["false", "true"] 
                    } 
                } 
            };
                
        } 

        
        
        castValue(v) {
                const num = Number(v);
                if (!isNaN(num)) return num;
                const bool = v.toLowerCase() === "true" ? true : v.toLowerCase() === "false" ? false : undefined;
                if (bool !== undefined) return bool;
                return v;
                
        }

        check_existence(args) {
            if (!this.QArrays.has(args.NAME)) {
                if (!this.QArrayInspector)
                    this.QArrayInspector = new QArrayInspector();
                this.QArrayInspector.showError("QArray " + args.NAME + " does not exist");
                return false;
            }
            if (args.NAME2 && !this.QArrays.has(args.NAME2)) {
                if (!this.QArrayInspector)
                    this.QArrayInspector = new QArrayInspector();
                this.QArrayInspector.showError("QArray " + args.NAME2 + " does not exist");
                return false;
            }
            return true;
        }

        copySectionOfQArray(args, util) {
            this.check_existence(args)
            if (args.INDEX < 0)
                args.INDEX = this.QArrays.get(args.NAME).length + args.INDEX;
            const target = Math.min(args.INDEX + args.COPYCOUNT, this.QArrays.get(args.NAME).length);
            for (let i = args.INDEX; i < target; i++) {
                this.QArrays.get(args.NAME2)[i] = this.QArrays.get(args.NAME)[i];
            }
        }

        replaceSectionQArray(args, util) {
            this.check_existence(args)
            if (args.INDEX < 0)
                args.INDEX = this.QArrays.get(args.NAME).length + args.INDEX;
            const value = args.SHOULDCAST === "true" ? this.castValue(args.VALUE) : String(args.VALUE);
            const target = Math.min(args.INDEX + args.DELETECOUNT, this.QArrays.get(args.NAME).length);
            for (let i = args.INDEX; i < target; i++) {
                this.QArrays.get(args.NAME)[i] = value;
            }
        }

        fillQArray(args, util) {
            this.check_existence(args)
            const value = args.SHOULDCAST === "true" ? this.castValue(args.VALUE) : String(args.VALUE);
            this.QArrays.set(args.NAME, new Array(args.SIZE).fill(value));
        }

        deleteSectionQArray(args, util) {
            this.check_existence(args)
            if (args.INDEX < 0)
                args.INDEX = this.QArrays.get(args.NAME).length + args.INDEX;
            this.QArrays.get(args.NAME).splice(args.INDEX, args.DELETECOUNT);
        }

        lengthOfQArray(args, util) {
                const arr = this.QArrays.get(args.NAME);
                if (!arr) {
                    this.QArrayInspector.showError("QArray " + args.NAME + " does not exist")
                    return "ERROR: QArray " + args.NAME + " does not exist";
                }
                return arr.length;
        }

        containsQArray(args, util) {
                this.check_existence(args)
                const value = args.SHOULDCAST === "true" ? this.castValue(args.VALUE) : String(args.VALUE);
                return this.QArrays.get(args.NAME).includes(value);
        }

        indexOfInQArray(args, util) {
                this.check_existence(args)
                const value = args.SHOULDCAST === "true" ? this.castValue(args.VALUE) : String(args.VALUE);
                return this.QArrays.get(args.NAME).indexOf(value);
        }
        
        createQArray(args, util) {
                this.QArrays.set(args.NAME, []);
        } 
        
        createQArrayFromJSArray(args, util) {
                try {
                    const arr = JSON.parse(args.ARRAY);
                    if (!Array.isArray(arr))
                        this.QArrayInspector.showError("Provided JS array is not a valid array");
                    this.QArrays.set(args.NAME, arr.map(this.castValue));
            } catch {
                    this.QArrays.set(args.NAME, "ERROR: No valid JS array syntax at createQArrayFromJSArray: " + args.ARRAY);
            } 
        } 
        
        copyQArraytoQarray(args, util) {
            this.check_existence(args);
            this.QArrays.set( args.NAME2, [...this.QArrays.get(args.NAME1)] );
        } 
        
        deleteQArray(args, util) {
                this.QArrays.delete(args.NAME);
        } 
        
        pushQArray(args, util) {
            this.check_existence(args);
            if (args.SHOULDCAST === "true") {
                args.VALUE = this.castValue(args.VALUE) 
            } else {
                args.VALUE = String(args.VALUE);
            }
            this.QArrays.get(args.NAME).push(args.VALUE);
        } 
        
        popQArray(args, util) {
                this.check_existence(args);
                if (this.QArrays.get(args.NAME).length === 0) return "";
                return this.QArrays.get(args.NAME).pop();
        }

        getQArray(args, util) {
                const arr = this.QArrays.get(args.NAME);
                if (!arr)
                    this.QArrayInspector.showError("QArray " + args.NAME + " does not exist");
                if (args.INDEX < 0 || args.INDEX >= arr.length)
                    this.QArrayInspector.showError("Index out of bounds for QArray " + args.NAME);
                return arr[args.INDEX];
        }
        
        clearQArray(args, util) {
            this.check_existence(args);
            this.QArrays.set(args.NAME, []);
        } 
        
        sortQArray(args, util) {
                this.QArrays.get(args.NAME).sort();
        } 
        reverseQArray(args, util) {
            this.check_existence(args)
            this.QArrays.get(args.NAME).reverse();
        } 
        copyToScratchList(args, util) {
            const target = util.target;
            const stage = Scratch.vm.runtime.getTargetForStage();
            const list = target.lookupVariableByNameAndType(args.NAME2, 'list') || stage.lookupVariableByNameAndType(args.NAME2, 'list');
            if (!list)
                this.QArrayInspector.showError(`List "${args.NAME2}" not found`);
            if (!this.QArrays.has(args.NAME))
            {
                if (!this.QArrayInspector)
                    this.QArrayInspector = new QArrayInspector();
                this.QArrayInspector.showError(`QArray "${args.NAME}" not found`);
            }
            list.value = this.QArrays.get(args.NAME).map(v => String(v));
        }

        copyFromScratchList(args, util) {
                const target = util.target;
                const stage = Scratch.vm.runtime.getTargetForStage();
                const list = target.lookupVariableByNameAndType(args.NAME, 'list') || stage.lookupVariableByNameAndType(args.NAME, 'list');
                if (!list) {
                    console.warn(`List "${args.NAME}" not found`);
                    return;
                    
            } this.QArrays.set(args.NAME2, Array.from(list.value, v => this.castValue(v)));
        }

        showQArrays(args, util) {
                if (!this.QArrayInspector) {
                    this.QArrayInspector = new QArrayInspector();
                    requestAnimationFrame(() => this.updateQArrayInspector());
            };
                this.QArrayInspector.update(this.QArrays);
                this.QArrayInspector.show();
                
        } 
        hideQArrays(args, util) {
                if (this.QArrayInspector) this.QArrayInspector.hide();
                
        } 
        updateQArrayInspector() {
                if (this.QArrayInspector && this.QArrayInspector.is_visible) {
                    if (!this._lastUpdate || performance.now() - this._lastUpdate > 100) {
                    this.QArrayInspector.update(this.QArrays);
                        this._lastUpdate = performance.now();
                        
                } 
            } requestAnimationFrame(() => this.updateQArrayInspector());
                
        } 
        log(args, util) {
                console.log(this.QArrays);
                
        } 
    } 
    Scratch.extensions.register(new OverlayExtension());
    Scratch.extensions.register(new WebGLOverlayExtension());
    Scratch.extensions.register(new ArrayExtension());
                
})(Scratch);
        