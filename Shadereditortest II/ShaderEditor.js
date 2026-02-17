class Editor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.position = "absolute";
        this.canvas.style.left = "0px";
        this.canvas.style.top = "0px";
        this.canvas.style.backgroundColor = "#1a1a1a"
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.font = '13px monospace';
        this.ctx.font = this.font;

        this.character_width = this.ctx.measureText('x').width; // monospace (;
        this.character_height = 18;
        this.line_spacing = 0;
        this.line_height = this.character_height + this.line_spacing;

        this.tab_size = 4;
        this.tab_string = "";
        for (let i = 0; i < this.tab_size; i++) this.tab_string += " ";

        this.lines = ["#version 300 es", "void main()",  "{", "    gl_Position = vec4(0.0, 0.0, 0.0, 1.0); ", "}"];
        this.run = this.run.bind(this);

        this.menuItems = [
            {
                text: "Run",
                onClick: () => {
                    console.log("sdfsdfsdfsdfsdfd");
                    
                }
            }
        ]

        this.hoveredMenuItems = [];


        this.changeRecord_index = 0;

        this.changeRecord = [
            {
                cursor_before: { x: 0, y: 0 },
                cursor_after: { x: 3, y: 1 },
                selection_before: { start: { x: 0, y: 1 }, end: { x: 0, y: 0 } },
                selection_after: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },

                affected_lines: [
                    {
                        line: 1,
                        before: "void msadasdin()",
                        after: "void main()",
                    },
                ]
            },
        ];

        this.definition_tree = new Map();

        const definition_example = {
            global: {
                x: {
                    type: "var",
                },
                func1: {
                    type: "function",
                    vars: {
                        x: {
                            type: "var"
                        },
                        y: {
                            type: "var"
                        }
                    }
                },
                func2: {
                    type: "function"
                }
            }
        }

        this.scroll_x = 0;
        this.scroll_y = 0;

        this.viewport_height = 0;
        this.viewport_width = 0;

        this.menu_width = 100;
        this.editor_x_offset = 15;

        this.mouseX = 0;
        this.mouseY = 0;

        this.is_ctrl = false;
        this.is_shift = false;

        this.cursor_x = 0;
        this.preferred_cursor_x = 0;
        this.cursor_y = 0;
        this.cursor_width = 2;
        this.cursor_height = 14;
        this.cursor_color = "rgb(179, 179, 179)";
        this.cursor_blink = 0;
        this.selection = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
        this.ordered_selection = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
        
        this.selection_color = "rgba(0, 132, 255, 0.34)";
        this.has_selection = false;

        this.is_selecting = false;

        setInterval(() => {
            this.cursor_blink = (this.cursor_blink + 1) % 4;
        }, 250);

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            if (this.is_selecting) {
                this.findSelection(e.offsetX, e.offsetY);
            }
        });
        this.mouseButtons = [false, false, false];
        this.mouseClicked = [false, false, false];

        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (this.is_shift)
                this.scroll_x += e.deltaY;
            else
                this.scroll_y += e.deltaY / 2;
            this.scroll_x = Math.max(0, this.scroll_x);
            this.scroll_y = Math.max(0, this.scroll_y);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            
            this.mouseButtons[e.button] = true;
            this.mouseClicked[e.button] = true;
            if (e.x < this.menu_width) return;
            this.is_selecting = true;
            let line = Math.floor((e.y + this.scroll_y) / this.line_height);
            if (line >= this.lines.length) line = this.lines.length - 1;
            if (line < 0) line = 0;
            let col = Math.round((e.x - this.menu_width - this.editor_x_offset + this.scroll_x) / this.character_width);
            line = Math.min(this.lines.length - 1, line);
            line = Math.max(0, line);
            col = Math.min(this.lines[line].length, col);
            col = Math.max(0, col);        
            const cursorxbef = this.cursor_x;
            const cursorybef = this.cursor_y;
            this.cursor_y = line;
            this.cursor_x = col;
            this.preferred_cursor_x = col;
            this.selection.start.y = line;
            this.selection.start.x = col;
            this.selection.end.y = line;
            this.selection.end.x = col;
            if (cursorxbef != this.cursor_x || cursorybef != this.cursor_y) this.cursor_blink = 0;
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
            this.mouseClicked[e.button] = false;
            this.is_selecting = false;
        });
        window.addEventListener('keydown', (e) => this.typeKey(e));
        window.addEventListener('keyup', (e) => {
            if (e.key === "Control") this.is_ctrl = false;
            else if (e.key === "Shift") this.is_shift = false;
        });
        window.visualViewport.addEventListener('resize', () => this.resize());
        window.visualViewport.addEventListener('scroll', () => this.resize());

        this.resize();
    }

    

    resize() {
        const vv = window.visualViewport;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = vv.width + "px";
        this.canvas.style.height = vv.height + "px";
        this.canvas.width = Math.round(vv.width * dpr);
        this.canvas.height = Math.round(vv.height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.font = this.font;
        this.character_width = this.ctx.measureText('x').width;
        this.viewport_height = Number(vv.height);
        this.viewport_width = Number(vv.width);
        console.log(this.viewport_height, "Resioze");
    }

    //#########################################################################
    //                    CURSOR + SELECTION
    //#########################################################################

    findSelection(x, y) {
        let line = Math.floor((y + this.scroll_y) / this.line_height);
        if (line >= this.lines.length) line = this.lines.length - 1;
        if (line < 0) line = 0;
        let col = Math.round((x - this.menu_width - this.editor_x_offset + this.scroll_x) / this.character_width);
        line = Math.min(this.lines.length - 1, line);
        line = Math.max(0, line);
        col = Math.min(this.lines[line].length, col);
        col = Math.max(0, col);
        this.selection.end = { x: col, y: line };
    }


    //#########################################################################
    //                    EDITING + HISTORY MANAGEMENT
    //#########################################################################


    typeKey(e) {
        this.cursor_blink = 0;
        console.log(e.key);
        if (e.ctrlKey) this.is_ctrl = true;
        if (e.shiftKey) this.is_shift = true;
        if (!this.is_ctrl && !this.is_shift)
        {
            switch (e.key) 
            {
                case "ArrowUp":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_y = Math.max(0, this.cursor_y - 1);
                    this.cursor_x = Math.min(this.lines[this.cursor_y].length, Math.max(this.preferred_cursor_x, this.cursor_x));
                    break;
                case "ArrowDown":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_y = Math.min(this.lines.length - 1, this.cursor_y + 1);
                    this.cursor_x = Math.min(this.lines[this.cursor_y].length, Math.max(this.preferred_cursor_x, this.cursor_x));
                    break;
                case "ArrowLeft":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_x--;
                    
                    if (this.cursor_x < 0 && this.cursor_y > 0){
                        this.cursor_y--;
                        this.cursor_x = this.lines[this.cursor_y].length;
                        if (this.cursor_y < 0) this.cursor_y = 0;
                    }
                    if (this.cursor_x <= -1)
                        this.cursor_x = 0;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "ArrowRight":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_x++;
                    if (this.cursor_x > this.lines[this.cursor_y].length){
                        this.cursor_x = 0;
                        this.cursor_y++;
                        if (this.cursor_y > this.lines.length - 1)
                        {
                            this.cursor_y = this.lines.length - 1;
                            this.cursor_x = this.lines[this.cursor_y].length;
                        }
                    }
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "Home":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_x = 0;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "End":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_x = this.lines[this.cursor_y].length;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "PageUp":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_y = Math.max(0, this.cursor_y - 10);
                    this.cursor_x = Math.min(this.lines[this.cursor_y].length, Math.max(this.preferred_cursor_x, this.cursor_x));
                    break;
                case "PageDown":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_y = Math.min(this.lines.length - 1, this.cursor_y + 10);
                    this.cursor_x = Math.min(this.lines[this.cursor_y].length, Math.max(this.preferred_cursor_x, this.cursor_x));
                    break;
                case "Backspace":
                    if (this.selection.start.y == this.selection.end.y && this.selection.start.x == this.selection.end.x) {
                        if (this.cursor_x == 0) {
                            if (this.cursor_y == 0) return;
                            let change = {
                                type: "backspace-line",
                                mergeable: false,
                                cursor_before: { x: this.cursor_x, y: this.cursor_y },
                                cursor_after: null,
                                selection_before: structuredClone(this.selection),
                                selection_after: null,
                                affected_lines: [
                                    { line: this.cursor_y, before: this.lines[this.cursor_y], after: null },
                                    { line: this.cursor_y - 1, before: this.lines[this.cursor_y - 1], after: null },
                                ],
                            };
                            const line = this.lines[this.cursor_y - 1];
                            this.lines.splice(this.cursor_y - 1, 1);
                            this.cursor_y--;
                            this.cursor_x = line.length;
                            this.preferred_cursor_x = this.cursor_x;
                            this.lines[this.cursor_y] = line + this.lines[this.cursor_y];
                            change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                            change.selection_after = structuredClone(this.selection);
                            change.affected_lines[1].after = this.lines[this.cursor_y];
                            this.pushChange(change);
                        }
                        else {
                            if (this.lines[this.cursor_y].substring(this.cursor_x - this.tab_size, this.cursor_x) === this.tab_string) {
                                this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x - this.tab_size) + this.lines[this.cursor_y].substring(this.cursor_x);
                                this.cursor_x -= this.tab_size;
                            }
                            else  {
                                const line_before = this.lines[this.cursor_y];
                                const cursor_before = { x: this.cursor_x, y: this.cursor_y };
                                const selection_before = structuredClone(this.selection);
                                const char = this.lines[this.cursor_y][this.cursor_x-1];
                                this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x - 1) + this.lines[this.cursor_y].substring(this.cursor_x);
                                this.cursor_x--;
                                const change = {
                                    type: "backspace-char",
                                    key: char,
                                    mergeable: true,
                                    cursor_before,
                                    cursor_after: { x: this.cursor_x, y: this.cursor_y },
                                    selection_before,
                                    selection_after: structuredClone(this.selection),
                                    affected_lines: [
                                        {
                                            line: this.cursor_y,
                                            before: line_before,
                                            after: this.lines[this.cursor_y]
                                        }
                                    ]
                                };
                                this.pushChange(change);
                            }
                        }
                    } else {
                        const change = this.deleteSelection();
                        this.changeRecord.splice(this.changeRecord.length - this.changeRecord_index, this.changeRecord_index);
                        this.pushChange(change);
                    }
                    this.preferred_cursor_x = this.cursor_x;

                    break;
                case "Delete":
                    if (this.selection.start.y == this.selection.end.y && this.selection.start.x == this.selection.end.x) {
                        if (this.cursor_x == this.lines[this.cursor_y].length && this.cursor_y == this.lines.length - 1) return;
                        if (this.cursor_x == this.lines[this.cursor_y].length) {
                            let change = {
                                type: "delete-line",
                                mergeable: false,
                                cursor_before: { x: this.cursor_x, y: this.cursor_y },
                                cursor_after: null,
                                selection_before: structuredClone(this.selection),
                                selection_after: null,
                                affected_lines: [
                                    { line: this.cursor_y, before: this.lines[this.cursor_y], after: null },
                                    { line: this.cursor_y + 1, before: this.lines[this.cursor_y + 1], after: null },
                                ],
                            };
                            const line = this.lines[this.cursor_y + 1];
                            this.lines.splice(this.cursor_y + 1, 1);
                            this.lines[this.cursor_y] += line;
                            change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                            change.selection_after = structuredClone(this.selection);
                            change.affected_lines[0].after = this.lines[this.cursor_y];
                            this.pushChange(change);
                        }
                        else {
                            let change = {
                                type: "delete-char",
                                mergeable: true,
                                key: this.lines[this.cursor_y][this.cursor_x],
                                cursor_before: { x: this.cursor_x, y: this.cursor_y },
                                cursor_after: null,
                                selection_before: structuredClone(this.selection),
                                selection_after: null,
                                affected_lines: [
                                    { line: this.cursor_y, before: this.lines[this.cursor_y], after: null },
                                ],
                            };
                            this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x) + this.lines[this.cursor_y].substring(this.cursor_x + 1);    
                            change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                            change.selection_after = structuredClone(this.selection);
                            change.affected_lines[0].after = this.lines[this.cursor_y];
                            this.pushChange(change);
                        }
                    } else {
                        const change = this.deleteSelection();
                        this.pushChange(change);
                    }
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "Enter":
                    let change = this.deleteSelection();
                    change.affected_lines.push(
                        {
                            line: this.cursor_y,
                            before: this.lines[this.cursor_y],
                            after: null 
                        },
                        {
                            line: this.cursor_y + 1,
                            before: null,
                            after: null
                        }
                    );
                    const text_behind = this.lines[this.cursor_y].substring(this.cursor_x);
                    this.lines.splice(this.cursor_y + 1, 0, text_behind);
                    this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x);
                    this.cursor_y++;
                    this.cursor_x = 0;
                    change.type = "insert-line";
                    change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                    change.selection_after = structuredClone(this.selection);
                    change.affected_lines[0].after = this.lines[this.cursor_y - 1];
                    change.affected_lines[1].after = this.lines[this.cursor_y];
                    this.pushChange(change);
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "Tab":{
                    e.preventDefault();
                    let end = this.ordered_selection.end;
                    let start = this.ordered_selection.start;
                    if (end.y - start.y >= 1)
                    {
                        let change = {
                            type: "multi-tab",
                            mergeable: false,
                            cursor_before: { x: this.cursor_x, y: this.cursor_y },
                            cursor_after: null,
                            selection_before: structuredClone(this.selection),
                            selection_after: null,
                            affected_lines: [],
                        }
                        for (let i = start.y; i <= end.y; i++)
                        {
                            change.affected_lines.push(
                                {
                                    line: i,
                                    before: this.lines[i],
                                    after: null
                                }
                            )
                            this.lines[i] = this.tab_string + this.lines[i];
                            change.affected_lines[i - start.y].after = this.lines[i];
                        }
                        this.cursor_x += this.tab_size;
                        this.ordered_selection.end.x += this.tab_size;
                        this.selection = { start: this.ordered_selection.start, end: this.ordered_selection.end };
                        change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                        change.selection_after = structuredClone(this.selection);
                        this.pushChange(change);
                    }
                    else {
                        this.selection.end.x += this.tab_size;
                        this.selection.start.x += this.tab_size;
                        let change = {
                            type: "tab",
                            mergeable: false,
                            cursor_before: { x: this.cursor_x, y: this.cursor_y },
                            cursor_after: null,
                            selection_before: structuredClone(this.selection),
                            selection_after: null,
                            affected_lines: [
                                {
                                    line: this.cursor_y,
                                    before: this.lines[this.cursor_y],
                                    after: null
                                }
                            ]
                        }
                        this.lines[this.cursor_y] = this.tab_string + this.lines[this.cursor_y]; 
                        this.cursor_x += this.tab_size;
                        change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                        change.selection_after = structuredClone(this.selection);
                        change.affected_lines[change.affected_lines.length - 1].after = this.lines[this.cursor_y];
                        this.pushChange(change);
                    }
                    this.preferred_cursor_x = this.cursor_x;

                    break;
                }
                default: 
                    this.typeLetter(e);
                    break;
            }
        }
        else if (!this.is_shift && this.is_ctrl) {
            switch (e.key) {
                case "c":
                    this.copy();
                    break;
                case "v":
                    this.paste();
                    break;
                case "x":
                    this.cut();
                    break;
                case "a":
                    this.selection = { start: { x: 0, y: 0 }, end: { x: this.lines[this.lines.length - 1].length, y: this.lines.length - 1 } };
                    break;
                case "z":
                    this.undo();
                    break;
                case "y":
                    this.redo();
                    break;
                case "ArrowLeft": {
                    let x = this.cursor_x;
                    let y = this.cursor_y;
                    const mode = this.lines[y][x-1] === " ";
                    while (this.canStop(x - 1, y, mode)) {
                        x--;
                        if (x < 1) {
                            y --;
                            if (y < 0) {
                                y = 0;
                                break;
                            }
                            x = this.lines[y].length;
                            break;
                        }
                    }
                    this.cursor_x = Math.max(0, x);
                    this.cursor_y = Math.max(0, y);
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                }
                case "ArrowRight": {
                    let x = this.cursor_x;
                    let y = this.cursor_y;
                    if (this.cursor_x == this.lines[y].length) {
                        y++;
                        if (y > this.lines.length - 1) {
                            y = this.lines.length - 1;
                            break;
                        }
                        x = 0;
                        this.cursor_x = Math.min(this.lines[y].length, x);
                        this.cursor_y = Math.min(this.lines.length - 1, y);
                        if (!(this.lines[y][x] === " ")) break;
                    }
                    const mode = this.lines[y][x] === " ";
                    while (this.canStop(x, y, mode)) {
                        x++;
                        if (x > this.lines[y].length) {
                            x = this.lines[y].length;
                            break;
                        }
                    }
                    this.cursor_x = Math.min(this.lines[y].length, x);
                    this.cursor_y = Math.min(this.lines.length - 1, y);
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                }
                case "Home":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_x = 0;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "End":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_x = this.lines[this.cursor_y].length;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "PageUp":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_y = Math.max(0, this.cursor_y - 10);
                    this.cursor_x = Math.min(this.lines[this.cursor_y].length, Math.max(this.preferred_cursor_x, this.cursor_x));
                    break;
                case "PageDown":
                    this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                    this.has_selection = false;
                    this.cursor_y = Math.min(this.lines.length - 1, this.cursor_y + 10);
                    this.cursor_x = Math.min(this.lines[this.cursor_y].length, Math.max(this.preferred_cursor_x, this.cursor_x));
                    break;
            }
        }
        else if (this.is_shift && !this.is_ctrl) {
            switch (e.key) {
                case "ArrowUp":
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = false;
                    }
                    this.selection.end.y = Math.max(0, this.selection.end.y - 1);
                    this.selection.end.x = Math.min(this.lines[this.selection.end.y].length, Math.max(this.selection.end.x, this.preferred_cursor_x));
                    this.selection.end.x = Math.max(0, this.selection.end.x);
                    this.cursor_y = this.selection.end.y;
                    this.cursor_x = this.selection.end.x;
                    break;
                case "ArrowDown":
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = false;
                    }
                    this.selection.end.y = Math.min(this.lines.length - 1, this.selection.end.y + 1);
                    this.selection.end.x = Math.min(this.lines[this.selection.end.y].length, Math.max(this.selection.end.x, this.preferred_cursor_x));
                    this.selection.end.x = Math.max(0, this.selection.end.x);
                    this.cursor_y = this.selection.end.y;
                    this.cursor_x = this.selection.end.x;
                    break;
                case "ArrowLeft":
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = false;
                    }
                    if (this.selection.end.x > 0)
                        this.selection.end.x = this.selection.end.x - 1;
                    else if (this.selection.end.y > 0) {
                        this.selection.end.y = this.selection.end.y - 1;
                        this.selection.end.x = this.lines[this.selection.end.y].length;
                    }
                    this.cursor_x = this.selection.end.x;
                    this.cursor_y = this.selection.end.y;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "ArrowRight":
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = false;
                    }
                    if (this.selection.end.x < this.lines[this.selection.end.y].length)
                        this.selection.end.x = this.selection.end.x + 1;
                    else if (this.selection.end.y < this.lines.length - 1) {
                        this.selection.end.y = this.selection.end.y + 1;
                        this.selection.end.x = 0;
                    }
                    this.cursor_x = this.selection.end.x;
                    this.cursor_y = this.selection.end.y;
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                case "Tab":
                    e.preventDefault();
                    let end = this.ordered_selection.end;
                    let start = this.ordered_selection.start;
                    if (end.y - start.y >= 1)
                    {
                        if (this.lines[this.cursor_y].startsWith(this.tab_string))
                            this.cursor_x -= this.tab_size;
                        this.cursor_x = Math.max(0, this.cursor_x);

                        if (this.lines[end.y].startsWith(this.tab_string)) {
                            this.ordered_selection.end.x -= this.tab_size;
                            this.selection = { start: this.ordered_selection.start, end: this.ordered_selection.end };
                        }
                        for (let i = start.y; i <= end.y; i++)
                        {
                            if (this.lines[i].startsWith(this.tab_string)) this.lines[i] = this.lines[i].substring(this.tab_size);
                        }
                        
                    }
                    else {
                        this.selection.end.x -= this.tab_size;
                        this.selection.start.x -= this.tab_size;
                        if (this.lines[this.cursor_y].startsWith(this.tab_string)) {
                            this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(this.tab_size);
                            this.cursor_x -= this.tab_size;
                            this.cursor_x = Math.max(0, this.cursor_x);
                        }
                    }
                    break;
                default:
                    this.typeLetter(e);
                    break;
            }
        }
        else if (this.is_shift && this.is_ctrl) {
            switch (e.key) {
                case "ArrowUp":
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = false;
                    }
                    this.selection.end.y = Math.max(0, this.selection.end.y - 1);
                    this.selection.end.x = Math.min(this.lines[this.selection.end.y].length, math.max(this.selection.end.x, this.preferred_cursor_x));
                    this.selection.end.x = Math.max(0, this.selection.end.x);
                    this.cursor_y = this.selection.end.y;
                    this.cursor_x = this.selection.end.x;
                    break;
                case "ArrowDown":
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = false;
                    }
                    this.selection.end.y = Math.min(this.lines.length - 1, this.selection.end.y + 1);
                    this.selection.end.x = Math.min(this.lines[this.selection.end.y].length, math.max(this.selection.end.x, this.preferred_cursor_x));
                    this.selection.end.x = Math.max(0, this.selection.end.x);
                    this.cursor_y = this.selection.end.y;
                    this.cursor_x = this.selection.end.x;
                    break;
                case "ArrowLeft": {
                    if (!this.has_selection) {                        
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = true;
                    }
                    let x = this.selection.end.x;
                    let y = this.selection.end.y;
                    const mode = this.lines[y][x-1] === " ";
                    while (this.canStop(x - 1, y, mode)) {
                        x--;
                        if (x < 1) {
                            y --;
                            if (y < 0) {
                                y = 0;
                                break;
                            }
                            x = this.lines[y].length;
                            break;
                        }
                    }
                    this.selection.end.x = Math.max(0, x);
                    this.selection.end.y = Math.max(0, y);
                    this.cursor_y = this.selection.end.y;
                    this.cursor_x = this.selection.end.x;
                    break;
                }
                case "ArrowRight": {
                    if (!this.has_selection) {
                        this.selection = { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } };
                        this.has_selection = true;
                    }
                    let x = this.selection.end.x;
                    let y = this.selection.end.y;
                    if (this.selection.end.x == this.lines[y].length) {
                        y++;
                        if (y > this.lines.length - 1) {
                            y = this.lines.length - 1;
                            break;
                        }
                        x = 0;
                        this.selection.end.x = Math.min(this.lines[y].length, x);
                        this.selection.end.y = Math.min(this.lines.length - 1, y);
                        if (!(this.lines[y][x] === " ")) break;
                    }
                    const mode = this.lines[y][x] === " ";
                    while (this.canStop(x, y, mode)) {
                        x++;
                        if (x > this.lines[y].length) {
                            y++;
                            if (y > this.lines.length - 1) {
                                y = this.lines.length - 1;
                                break;
                            }
                            x = 0;
                            break;
                        }
                    }
                    this.selection.end.x = Math.min(this.lines[y].length, x);
                    this.selection.end.y = Math.min(this.lines.length - 1, y);
                    this.cursor_y = this.selection.end.y;
                    this.cursor_x = this.selection.end.x;
                    break;
                }
                default:
                    break;
            }
        }
    }

    typeLetter(e)
    {
        if (e.key.length > 1) return;
            let change = this.deleteSelection();
            change.type = "insert";
            change.key = e.key;
            if (change.affected_lines.length === 0)
            {
                change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                change.selection_after = structuredClone(this.selection);
                change.affected_lines = [
                    {
                        line: this.cursor_y,
                        before: this.lines[this.cursor_y],
                        after: null
                    }
                ];
            }
            this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x) + e.key + this.lines[this.cursor_y].substring(this.cursor_x);
            this.cursor_x++;
            change.affected_lines[0].after = this.lines[this.cursor_y];
            this.pushChange(change);
    }

    canStop(x, y, isSearchingWord) {
        if (!isSearchingWord) {
            return this.lines[y][x] != " " && this.lines[y][x] != "\t";
        }
        else {
            return this.lines[y][x] === " " || x == this.lines[y].length -1;
        }
    }

    deleteSelection()
    {
        if (!this.has_selection) 
            return {
                type: "none",
                mergeable: true,
                affected_lines: [],
                cursor_before: { x: this.cursor_x, y: this.cursor_y },
                cursor_after: { x: this.cursor_x, y: this.cursor_y },
                selection_before: { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } },
                selection_after: { start: { x: this.cursor_x, y: this.cursor_y }, end: { x: this.cursor_x, y: this.cursor_y } },
            };
        let start = this.ordered_selection.start;
        let end = this.ordered_selection.end;
        let changed_lines = [];

        let cursor = { x: this.cursor_x, y: this.cursor_y };
        let selection = structuredClone(this.selection);

        console.log("Selectiondelete");
        
        if (start.y == end.y) {
            changed_lines.push({ line: start.y, before: this.lines[start.y], after: null });
            this.lines[start.y] = this.lines[start.y].substring(0, start.x) + this.lines[start.y].substring(end.x);
            changed_lines[0].after = this.lines[start.y];
        }
        else {
            if (end.x !== this.lines[end.y].length)
            {
                for (let i = start.y; i <= end.y; i++)
                {
                    changed_lines.push({ line: i, before: this.lines[i], after: null });
                }
                this.lines[start.y] = this.lines[start.y].substring(0, start.x) + this.lines[end.y].substring(end.x);
                changed_lines[0].after = this.lines[start.y];
                changed_lines[changed_lines.length - 1].after = null;
                this.lines.splice(start.y + 1, end.y - start.y);
            }
            else
            {
                for (let i = start.y; i <= end.y; i++)
                {
                    changed_lines.push({ line: i, before: this.lines[i], after: null });
                }
                this.lines[start.y] = this.lines[start.y].substring(0, start.x);
                changed_lines[0].after = this.lines[start.y];
                this.lines.splice(start.y + 1, end.y - start.y);
            }
        }

        this.cursor_x = this.selection.start.x = this.selection.end.x = start.x;
        this.cursor_y = this.selection.start.y = this.selection.end.y = start.y;
        return {
            type: "delete-selection",
            mergeable: false,
            cursor_before: { x: cursor.x, y: cursor.y },
            cursor_after: { x: this.cursor_x, y: this.cursor_y },
            selection_before: selection,
            selection_after: structuredClone(this.selection),
            affected_lines: changed_lines
        };
    }

    copy() {
        let text = "";
        let start = this.ordered_selection.start;
        let end = this.ordered_selection.end;
        for (let i = start.y; i <= end.y; i++) {
            if (i == start.y)
                text += this.lines[i].substring(start.x) + "\n";
            else if (i == end.y)
                text += this.lines[i].substring(0, end.x);
            else
                text += this.lines[i] + "\n";
        }        
        navigator.clipboard.writeText(text);
    }

    cut() {
        this.copy();
        const change = this.deleteSelection();
        this.pushChange(change);
    }

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;

            const lines = text.split("\n");
            let cursor_x = this.cursor_x;
            let cursor_y = this.cursor_y;
            let changeRecord = {
                type: "paste",
                mergeable: false,
                cursor_before: { x: cursor_x, y: cursor_y },
                cursor_after: null,
                selection_before: structuredClone(this.selection),
                selection_after: null,
                affected_lines: [],
            };
            const lineBefore = this.lines[cursor_y];
            this.lines[cursor_y] = this.lines[cursor_y].substring(0, cursor_x) + lines[0] + this.lines[cursor_y].substring(cursor_x);
            changeRecord.affected_lines.push({ line: cursor_y, before: lineBefore, after: this.lines[cursor_y] });
            for (let i = 1; i < lines.length; i++) {
                this.lines.splice(cursor_y + i, 0, lines[i]);
                changeRecord.affected_lines.push({
                    line: cursor_y + i,
                    before: null,
                    after: lines[i]
                });
            }
            this.cursor_y += lines.length - 1;
            this.cursor_x = lines[lines.length - 1].length;
            changeRecord.cursor_after = { x: this.cursor_x, y: this.cursor_y };
            changeRecord.selection_after = structuredClone(this.selection);
            this.changeRecord.splice(
                this.changeRecord.length - this.changeRecord_index,
                this.changeRecord_index
            );
            this.changeRecord_index = 0;
            this.changeRecord.push(changeRecord);
        } catch (err) {
            console.warn("Clipboard read failed:", err);
        }
    }

    redo() {
        const record = this.changeRecord[this.changeRecord.length - this.changeRecord_index];        
        if (!record) return;
        this.cursor_x = record.cursor_after.x;
        this.cursor_y = record.cursor_after.y;
        this.selection = structuredClone(record.selection_after);
        for (let i = record.affected_lines.length - 1; i >= 0; i--) {
            const e = record.affected_lines[i];
            if (e.after === null) {
                this.lines.splice(e.line, 1);
            }
        } 
        for (const e of record.affected_lines) {
            if (e.before !== null && e.after !== null) {
                this.lines[e.line] = e.after;
            }
        }
        for (const e of record.affected_lines) {
            if (e.before === null) {
                this.lines.splice(e.line, 0, e.after);
            }
        }
        this.changeRecord_index--;

    }

    undo() {
        console.log(this.changeRecord);

        const record = this.changeRecord[this.changeRecord.length - 1 - this.changeRecord_index];
        if (!record) return;
        
        this.cursor_x = record.cursor_before.x;
        this.cursor_y = record.cursor_before.y;
        this.selection = structuredClone(record.selection_before);

        for (let i = record.affected_lines.length - 1; i >= 0; i--) {
            const e = record.affected_lines[i];
            if (e.before === null) {
                this.lines.splice(e.line, 1);
            }
        }
        for (const e of record.affected_lines) {
            if (e.before !== null && e.after !== null) {
                this.lines[e.line] = e.before;
            }
        }
        for (const e of record.affected_lines) {
            if (e.after === null) {
                this.lines.splice(e.line, 0, e.before);
            }
        }
        this.changeRecord_index++;
    }

    pushChange(change) {
        let merged = false;

        const last = this.changeRecord[this.changeRecord.length - 1];

        if (last && last.mergeable) {
            merged = this.mergeChanges(change);
        }

        if (merged) return;

        if (merged) return;
        // else
        if (this.changeRecord_index > 0) {
            this.changeRecord.splice(
                this.changeRecord.length - this.changeRecord_index,
                this.changeRecord_index
            );
        }
        this.changeRecord.splice(this.changeRecord.length - this.changeRecord_index, this.changeRecord_index);
        this.changeRecord.push(change);
        this.changeRecord_index = 0;
    }

    mergeChanges(change) {
        console.log(change.type);
        switch (change.type) {
            case "insert":
                return this.mergeInsertion(change);
            case "delete-char":
            case "backspace-char":
                return this.mergeDeletion(change);
        }
        return false;
    }

    mergeDeletion(change)
    {
        const last = this.changeRecord[this.changeRecord.length - 1];
        if (!last) return false;
        if (last.cursor_after.y !== change.cursor_before.y) return false;
        if (last.cursor_after.x !== change.cursor_before.x) return false;
        console.log(change.key, last.key);
        
        if (/[\s\t]+/.test(change.key) && !/[\s\t]+/.test(last.key)) return false;
        change.affected_lines[0].before = last.affected_lines[0].before;
        change.cursor_before = last.cursor_before;
        change.selection_before = last.selection_before;
        this.changeRecord[this.changeRecord.length - 1] = change;
        return true;
    }

    mergeInsertion(change)
    {
        const last = this.changeRecord[this.changeRecord.length - 1];
        if (!last) return false;
        if (last.cursor_after.y !== change.cursor_before.y) return false;
        if (last.cursor_after.x !== change.cursor_before.x - 1) return false;
        if (/[\s\t]+/.test(change.key) && !/[\s\t]+/.test(last.key)) return false;
        change.affected_lines[0].before = last.affected_lines[0].before;
        change.cursor_before = last.cursor_before;
        change.selection_before = last.selection_before;
        this.changeRecord[this.changeRecord.length - 1] = change;
        return true;
    }


    //#########################################################################
    //                    RENDERING + TOKENIZER
    //#########################################################################

    render() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let start_y = Math.floor(this.scroll_y/this.line_height);
        let end_y = Math.ceil((this.scroll_y + this.viewport_height)/this.line_height)
        end_y = Math.min(this.lines.length, end_y);
        
        for (let i = start_y; i < end_y; i++) {
            const tokens = [];
            for (const m of this.lines[i].matchAll(/\s+|[()]+|[,]+|(?:\d+\.\d+)|\d+|[a-zA-Z_]\w*|\.|[^()\s,]+/g)) {
                tokens.push({
                    text: m[0],
                    start: m.index,
                    end: m.index + m[0].length
                });
            }
            let x = this.menu_width + this.editor_x_offset - this.scroll_x;
            for (let j = 0; j < tokens.length; j++) {
                const token = tokens[j].text;
                const token_width = token.length * this.character_width;
                this.ctx.fillStyle = this.getSyntaxColor(token);
                this.ctx.fillText(token, x, this.line_height * i + this.line_height - this.scroll_y);
                x += token_width;
            }
        }
        this.drawLineNumbers();
        this.drawSelection();
        this.drawCursor();
        this.drawMenu();
    }

    getSyntaxColor(token) {                  
        switch (token) {
            case "if":
            case "else":
            case "for":
            case "while":
            case "switch":
            case "case":
            case "default":
            case "break":
            case "continue":
                return  "#ff7777";
            case "vec2":
            case "vec3":
            case "vec4":
            case "mat2":
            case "mat3":
            case "mat4":
                return  "#ff77ff";
            case "uniform":
            case "attribute":
            case "varying":
                return "#77ff77";
            case "void":
            case "float":
            case "int":
            case "bool":
            case "vec2":
            case "vec3":
            case "vec4":
            case "mat2":
            case "mat3":
            case "mat4":
                return "#77ffff";
            default:
                if (token[0] == "#") return "#8077ff";
                if (/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(token)) return "#ff7777"; // What the Fu**!
                return "#ffffff";
        }
    }

    drawCursor() {
        if (this.cursor_blink > 1) return;
        this.ctx.fillStyle = this.cursor_color;
        let x = this.cursor_x * this.character_width + this.menu_width + this.editor_x_offset - this.cursor_width / 2 - this.scroll_x;
        this.ctx.fillRect(x, this.cursor_y * this.line_height + this.line_height + 5  - this.scroll_y, this.cursor_width, -this.character_height - 5);
    }


    drawLineNumbers() {
        this.ctx.fillStyle = "#777777ff";
        let start_y = Math.floor(this.scroll_y/this.line_height);
        let end_y = Math.ceil((this.scroll_y + this.viewport_height)/this.line_height)
        end_y = Math.min(this.lines.length, end_y);
        for (let i = start_y; i < end_y; i++) {
            const element = this.lines[i];
            this.ctx.fillText(i+1, this.menu_width, this.line_height * i + this.line_height - this.scroll_y);
        }
    }

    drawSelection() {
        if (!this.has_selection) return;
        this.ctx.fillStyle = this.selection_color;

        let sel_start = this.selection.start;

        let sel_end = this.selection.end;

        if (sel_start.y > sel_end.y) {
            const temp = sel_start;
            sel_start = sel_end;
            sel_end = temp;
        }

        for (let y = sel_start.y; y <= sel_end.y; y++) {
            let width = this.lines[y].length * this.character_width;
            let start = 0;
            if (y == sel_start.y) {
                start = sel_start.x * this.character_width;
                width -= start;
                if (width == 0) width = 3;
            }
            if (y == sel_end.y) {
                width -= (this.lines[y].length - sel_end.x) * this.character_width;
            }
            if (this.lines[y].length == 0) width = 3;
            
            this.ctx.fillRect(this.menu_width + this.editor_x_offset + start - this.scroll_x, y * this.line_height + this.line_spacing + 3  - this.scroll_y, width, this.character_height);
        }
    }

    drawMenu() {
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.menu_width, this.canvas.height);
        const button_size = 20;
        const button_space = this.menu_width / 3 - button_size;
        if (this.hoveredMenuItems.includes("newFile")) {
            this.ctx.fillStyle = '#ffffff31';
            this.ctx.fillRect(button_space/2, 0, 20, 20);
        }
        this.ctx.fillStyle = '#ffffff';
        
        this.ctx.fillText("+", button_space/2 + 5, 16);
        
        for (let i = 0; i < this.menuItems.length; i++) {
            if (this.hoveredMenuItems.includes(this.menuItems[i])) {
                this.ctx.fillStyle = '#ffffff31';
                this.ctx.fillRect(0, i * 25 + 20, this.menu_width, 25);
            }
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.menuItems[i].text, 5, i * 25 + 36);
        }
    }

    update() {
        this.ordered_selection = { start: this.selection.start, end: this.selection.end };
        if (this.ordered_selection.start.y > this.ordered_selection.end.y || (this.ordered_selection.start.y == this.ordered_selection.end.y && this.ordered_selection.start.x > this.ordered_selection.end.x)) {
            const temp = this.ordered_selection.start;
            this.ordered_selection.start = this.ordered_selection.end;
            this.ordered_selection.end = temp;
        }
        this.editor_x_offset = Math.max(this.character_width*2 + 5, Math.ceil(Math.log10(this.lines.length + 1)) * this.character_width + this.character_width + 5); // well that is quite a function....
        this.updateMenu();
        this.has_selection = this.selection.start.x != this.selection.end.x || this.selection.start.y != this.selection.end.y;
        this.mouseClicked = [false, false, false];
    }

    updateMenu() {
        this.canvas.style.cursor = 'default';
        this.hoveredMenuItems.length = 0;

        const button_size = 20;
        const button_space = this.menu_width / 3 - button_size;
        const addButtonRect = {x: button_space/2, y: 0, width: 20, height: 20};
        if (this.mouseX > addButtonRect.x && this.mouseX < addButtonRect.x + addButtonRect.width && this.mouseY > addButtonRect.y && this.mouseY < addButtonRect.y + addButtonRect.height) {
            this.canvas.style.cursor = 'pointer';
            this.hoveredMenuItems.push("newFile");
            if (this.mouseClicked[0]) {
                this.menuItems.push({text: "newFile", onClick: () => console.log("newFile")});
            }
        }
        for (let i = 0; i < this.menuItems.length; i++) {
            if (this.mouseX < this.menu_width && this.mouseY > i * 25 + 20 && this.mouseY < (i + 1) * 25 + 20) {
                this.hoveredMenuItems.push(this.menuItems[i]);
                if (this.mouseClicked[0]) {
                    this.menuItems[i].onClick();
                }
                this.canvas.style.cursor = 'pointer';
            }
        }
    }

    run() {
        this.render();
        this.update();
        requestAnimationFrame(() => this.run());
    }




}

let editor = new Editor();
editor.run();