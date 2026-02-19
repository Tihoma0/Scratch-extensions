//######################################################################################################
//                     WARNING: THE FOLLOWING CODE IS UGLY AND MIGHT CAUSE SEIZURES
//######################################################################################################

// WARNINGS
// 1. Naming conventions:
//      - Magic numbers
//      - very confusing, doubling names
//      - SNAKE AND CAMEL CASE ARE TOTALLY MIXED UP!
// 2. Few comments
// 3. No documentation (except for this comment)
// 4. MASSIVE SWITCH CASES
// 5. MASSIVE typeKey() Functioj (about 750+ lines)
// 6. I DO care about performance but in some cases it's not worth it

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
        this.font = '19px monospace';
        this.ctx.font = this.font;

        this.character_width = this.ctx.measureText('x').width; // monospace (;
        this.character_height = 23;
        this.line_spacing = 0;
        this.line_height = this.character_height + this.line_spacing;

        this.tab_size = 4;
        this.tab_string = "";
        for (let i = 0; i < this.tab_size; i++) this.tab_string += " ";

        this.lines = ["#version 300 es", "void main()",  "{", "    gl_Position = vec4(0.0, 0.0, 0.0, 1.0); ", "}"];
        this.run = this.run.bind(this);
        this.punctuation = new Map("{}[]();,: .".split("").map((c) => [c, c.charCodeAt(0)]));
        this.numbers = new Map("0123456789".split("").map((c) => [c, c.charCodeAt(0)]));
        this.operators = new Map("+-*/%&|^".split("").map((c) => [c, c.charCodeAt(0)]));
        this.token_colors = {
            "number": "#948eae",
            "operator": "#adffac",
            "punctuation": "#cc75cf",
            "control_flow": "#534fa2",
            "storage_qualifier": "#006eff",
            "char": "#ffffff",
            "scalar": "#3d5bba",
            "vector": "#4d43ba",
            "matrix": "#5943ba",
            "sampler": "#7543ba",
            "gl vars": "#9243ba",
            "preprocessor": "#201577",
            "string": "#ff9900",
            "identifier": "#aaf1ff"
        };

        this.parantheses = new Map();
        this.parantheses_chars = new Map("()[]{}".split("").map((c) => [c, c.charCodeAt(0)]));
        this.closing_parantheses = new Map(")]}".split("").map((c) => [c, c.charCodeAt(0)]));
        this.opening_parantheses = new Map("({[".split("").map((c) => [c, c.charCodeAt(0)]));
        this.parantheses_stack = [];
        this.parantheses_colors = [
            "#e11eff",
            "#FF69B4",
            "#FF8C00",
            "#FFD700",
            "#7FFF00",
            "#00CED1",
            "#1E90FF",
        ];

        this.identifiers = new Map();

        this.is_dirty = true;

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
    }

    //#########################################################################
    //                                SELECTION                                
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
                    this.is_dirty = true;
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
                                let indent = 0;
                                for (let i = this.cursor_x; i >= 0 && this.lines[this.cursor_y][i-1] == " "; i--) indent++;
                                console.log(indent, this.cursor_x);
                                
                                if (indent == this.cursor_x) {
                                    const line_before = this.lines[this.cursor_y];
                                    const cursor_before = { x: this.cursor_x, y: this.cursor_y };
                                    const selection_before = structuredClone(this.selection);
                                    const after = this.lines[this.cursor_y].substring(this.cursor_x);
                                    this.lines.splice(this.cursor_y, 1);
                                    this.cursor_y--;
                                    this.cursor_x = this.lines[this.cursor_y].length;
                                    this.lines[this.cursor_y] += after;
                                    const change = {
                                        type: "backspace-tab",
                                        mergeable: false,
                                        cursor_before,
                                        cursor_after: { x: this.cursor_x, y: this.cursor_y },
                                        selection_before,
                                        selection_after: structuredClone(this.selection),
                                        affected_lines: [
                                            {
                                                line: this.cursor_y,
                                                before: line_before,
                                                after: this.lines[this.cursor_y]
                                            },
                                            {
                                                line: this.cursor_y + 1,
                                                before: this.lines[this.cursor_y + 1],
                                                after: null
                                            }
                                        ]
                                    };
                                    this.pushChange(change);
                                }
                                else {
                                    const line_before = this.lines[this.cursor_y];
                                    const cursor_before = { x: this.cursor_x, y: this.cursor_y };
                                    const selection_before = structuredClone(this.selection);
                                    this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x - this.tab_size) + this.lines[this.cursor_y].substring(this.cursor_x);
                                    this.cursor_x -= this.tab_size;
                                    const change = {
                                        type: "backspace-tab",
                                        mergeable: false,
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
                            else
                            {                                
                                if (this.lines[this.cursor_y][this.cursor_x] && this.doParanthesesMatch(this.lines[this.cursor_y][this.cursor_x - 1], this.lines[this.cursor_y][this.cursor_x]))
                                {
                                    
                                    const line_before = this.lines[this.cursor_y];
                                    const cursor_before = { x: this.cursor_x, y: this.cursor_y };
                                    const selection_before = structuredClone(this.selection);
                                    this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x - 1) + this.lines[this.cursor_y].substring(this.cursor_x+1);
                                    this.cursor_x--;
                                    const change = {
                                        type: "backspace-brackets",
                                        mergeable: false,
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
                                else
                                {
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
                        }
                    } else {
                        const change = this.deleteSelection();
                        this.changeRecord.splice(this.changeRecord.length - this.changeRecord_index, this.changeRecord_index);
                        this.pushChange(change);
                    }
                    this.preferred_cursor_x = this.cursor_x;

                    break;
                case "Delete":
                    this.is_dirty = true;
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
                    this.is_dirty = true;
                    let change = this.deleteSelection();
                    if (!this.has_selection)
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
                    if (!this.has_selection && this.lines[this.cursor_y][this.cursor_x] && this.doParanthesesMatch(this.lines[this.cursor_y][this.cursor_x - 1], this.lines[this.cursor_y][this.cursor_x]))
                    {
                        let indent = 0;
                        while (indent < this.lines[this.cursor_y].length && this.lines[this.cursor_y][indent] == " ")
                        {
                            indent++;
                        }                        
                        const text_behind = this.lines[this.cursor_y].substring(this.cursor_x);
                        this.lines.splice(this.cursor_y + 1, 0, " ".repeat(indent) + text_behind);
                        this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x);
                        this.cursor_y++;
                        this.cursor_x = 0;
                        change.type = "insert-bracket-lines";
                        change.mergeable = false;
                        change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                        change.affected_lines[0].after = this.lines[this.cursor_y - 1];
                        change.affected_lines.push({ line: this.cursor_y, before: null, after: this.lines[this.cursor_y] });
                        change.affected_lines.splice(2, 0, { line: this.cursor_y + 1, before: null, after: "" });
                        this.lines.splice(this.cursor_y, 0, " ".repeat(indent) + this.tab_string);
                        this.cursor_x = indent + this.tab_size;
                        this.pushChange(change);
                        this.preferred_cursor_x = this.cursor_x;
                    }
                    else if (!this.has_selection && this.lines[this.cursor_y][this.cursor_x-1] && this.is_opening_bracket(this.lines[this.cursor_y][this.cursor_x-1]))
                    {
                        let indent = 0;
                        while (indent < this.lines[this.cursor_y].length && this.lines[this.cursor_y][indent] == " ")
                        {
                            indent++;
                        }                        
                        const text_behind = this.lines[this.cursor_y].substring(this.cursor_x);
                        this.lines.splice(this.cursor_y + 1, 0, " ".repeat(indent) + this.tab_string+text_behind);
                        this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x);
                        this.cursor_y++;
                        this.cursor_x = 0;
                        change.type = "insert-bracket-lines";
                        change.mergeable = false;
                        change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                        change.affected_lines[0].after = this.lines[this.cursor_y - 1];
                        change.affected_lines.push({ line: this.cursor_y, before: null, after: this.lines[this.cursor_y] });
                        this.cursor_x = indent + this.tab_size;
                        this.pushChange(change);
                        this.preferred_cursor_x = this.cursor_x;
                    }
                    else {
                        let indent = 0;
                        while (indent < this.lines[this.cursor_y].length && this.lines[this.cursor_y][indent] == " ")
                        {
                            indent++;
                        }
                        const text_behind = this.lines[this.cursor_y].substring(this.cursor_x);
                        this.lines.splice(this.cursor_y + 1, 0, " ".repeat(indent) + text_behind);
                        this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x);
                        this.cursor_y++;
                        this.cursor_x = indent;
                        change.type = "insert-line";
                        change.cursor_after = { x: this.cursor_x, y: this.cursor_y };
                        change.selection_after = structuredClone(this.selection);
                        change.affected_lines[0].after = this.lines[this.cursor_y - 1];
                        change.affected_lines.push({ line: this.cursor_y, before: null, after: this.lines[this.cursor_y] });
                        this.pushChange(change);
                        this.preferred_cursor_x = this.cursor_x;
                    }
                    break;
                case "Tab":{
                    e.preventDefault();
                    this.is_dirty = true;
                    let end = this.ordered_selection.end;
                    let start = this.ordered_selection.start;
                    if (end.y - start.y >= 1)
                    {
                        this.typeMultipleTabs();
                    }
                    else {
                        this.typeSingleTab();
                    }
                    break;
                }
                default:
                    this.is_dirty = true;
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
                    this.is_dirty = true;
                    this.paste();
                    break;
                case "x":
                    this.is_dirty = true;
                    this.cut();
                    break;
                case "a":
                    this.selection = { start: { x: 0, y: 0 }, end: { x: this.lines[this.lines.length - 1].length, y: this.lines.length - 1 } };
                    break;
                case "z":
                    this.is_dirty = true;
                    this.undo();
                    break;
                case "y":
                    this.is_dirty = true;
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
                case "Backspace":
                    this.is_dirty = true;
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
                                const line_before = this.lines[this.cursor_y];
                                const cursor_before = { x: this.cursor_x, y: this.cursor_y };
                                const selection_before = structuredClone(this.selection);
                                this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x - this.tab_size) + this.lines[this.cursor_y].substring(this.cursor_x);
                                this.cursor_x -= this.tab_size;
                                const change = {
                                    type: "backspace-tab",
                                    mergeable: false,
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
                            else
                            {                                
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
                    this.is_dirty = true;
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
                    this.is_dirty = true;
                    let change = this.deleteSelection();
                    if (!this.has_selection)
                        change.affected_lines.push(
                            {
                                line: this.cursor_y,
                                before: this.lines[this.cursor_y],
                                after: null 
                            },
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
                    change.affected_lines.push(
                            {
                                line: this.cursor_y,
                                before: null,
                                after: this.lines[this.cursor_y],
                            },
                        );
                    this.pushChange(change);
                    this.preferred_cursor_x = this.cursor_x;
                    console.log(change);
                    
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
                default: 
                    this.is_dirty = true;
                    this.typeLetter(e);
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
                    this.is_dirty = true;
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
                    this.is_dirty = true;
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
                    this.preferred_cursor_x = this.cursor_x;
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
                    this.preferred_cursor_x = this.cursor_x;
                    break;
                }
                default: 
                    this.is_dirty = true;
                    this.typeLetter(e);
                    break;
            }
        }
        switch (e.key)
        {
            case "Shift":
            case "Control":
            case "Meta":
            case "Alt":
            case "AltGraph":
                return;
        }
        if (e.key.length > 1 && e.key.startsWith("F"))
            return;
        this.autoScroll();
    }

    // shut up. I know this is not the fastest way to do this, but it's O(1)... Maybe O(1*brackets_I_want_to_handle) but I DONT CARE. 
    is_closing_bracket(key) {
        if (key === ")") return true;
        if (key === "]") return true;
        if (key === "}") return true;
        if (key === ">") return true;
        return false;
    }

    is_opening_bracket(key) {
        if (key === "(") return true;
        if (key === "[") return true;
        if (key === "{") return true;
        if (key === "<") return true;
        return false;
    }

    doParanthesesMatch(b1, b2)
    {
        if (b1 === "(" && b2 === ")") return true;
        if (b1 === "[" && b2 === "]") return true;
        if (b1 === "{" && b2 === "}") return true;
        if (b1 === "<" && b2 === ">") return true;
        return false;
    }

    typeSingleTab()
    {
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
        this.preferred_cursor_x = this.cursor_x;
    }

    typeMultipleTabs() {
        let end = this.ordered_selection.end;
        let start = this.ordered_selection.start;
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

    typeLetter(e)
    {
        if (e.key.length > 1) return;
        if (!this.has_selection && this.is_closing_bracket(e.key) && e.key === this.lines[this.cursor_y][this.cursor_x])
        {
            this.cursor_x++;
            this.preferred_cursor_x = this.cursor_x;
        }
        else {
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
        switch (e.key) {
            case "{":
                this.autoType("}");
                break;
            case "(":
                this.autoType(")");
                break;
            case "[":
                this.autoType("]");
                break;
            case "<":
                this.autoType(">");
                break;
        }
    }

    autoType(key)
    {        
        if (this.lines[this.cursor_y][this.cursor_x] && !/[\s]+|[\(\)\{\}\[\]\<\>]/.test(this.lines[this.cursor_y][this.cursor_x])) return;        
        if (key.length > 1) return;
            let change = this.deleteSelection();
            change.type = "insert";
            change.key = key;
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
            this.lines[this.cursor_y] = this.lines[this.cursor_y].substring(0, this.cursor_x) + key + this.lines[this.cursor_y].substring(this.cursor_x);
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

    autoScroll()
    {        
        if (this.cursor_y - 2 < this.scroll_y/this.line_height) this.scroll_y = (this.cursor_y - 2) * this.line_height;
        if (this.cursor_y + 7 > (this.scroll_y + this.viewport_height)/this.line_height) this.scroll_y = (this.cursor_y + 7) * this.line_height - this.viewport_height;
        if (isNaN(this.scroll_y)) this.scroll_y = 0;
        this.scroll_y = Math.max(0, this.scroll_y)
        if (this.cursor_x + 20 > (this.viewport_width - this.menu_width - this.editor_x_offset) / this.character_width) this.scroll_x = (this.cursor_x + 20) * this.character_width - this.viewport_width + this.menu_width + this.editor_x_offset;
        if (this.cursor_x - 2 < this.scroll_x/this.character_width) this.scroll_x = (this.cursor_x - 2) * this.character_width;
        if (isNaN(this.scroll_x)) this.scroll_x = 0;
        this.scroll_x = Math.max(0, this.scroll_x)
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


    computeParantheses()
    {
        this.parantheses.clear();
        this.parantheses_stack = [];
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (this.opening_parantheses.has(char)) {
                    const key = `${i}:${j}`;
                    this.parantheses_stack.push(char);
                    this.parantheses.set(key, {char, layer: this.parantheses_stack.length});
                }
                else if (this.closing_parantheses.has(char)) {
                    const key = `${i}:${j}`;
                    const opening = this.parantheses_stack.pop();
                    if (!this.doParanthesesMatch(opening, char)) {
                        this.parantheses.set(key, {char, layer: -1});
                        this.parantheses_stack.push(opening);
                        
                    }
                    else
                        this.parantheses.set(key, {char, layer: this.parantheses_stack.length + 1});                    
                }
            }
        }
    }

    renderParantheses()
    {
        let start_y = Math.floor(this.scroll_y/this.line_height);
        let end_y = Math.ceil((this.scroll_y + this.viewport_height)/this.line_height)
        end_y = Math.min(this.lines.length, end_y);
        
        for (let i = start_y; i < end_y; i++) {
            const line = this.lines[i];
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const key = `${i}:${j}`;
                if (this.parantheses.has(key)) {
                    const data = this.parantheses.get(key);
                    if (!data) continue;
                    if (data.layer === -1) {
                        this.ctx.fillStyle = "#ff0000ff";
                    }
                    else {
                        const color = this.parantheses_colors[data.layer % this.parantheses_colors.length];
                        this.ctx.fillStyle = color;
                    }
                    const x = this.menu_width + this.character_width * j + this.editor_x_offset - this.scroll_x;
                    this.ctx.fillText(data.char, x, this.line_height * i + this.line_height - this.scroll_y);
                }
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#18181b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let start_y = Math.floor(this.scroll_y/this.line_height);
        let end_y = Math.ceil((this.scroll_y + this.viewport_height)/this.line_height)
        end_y = Math.min(this.lines.length, end_y);
        for (let i = start_y; i < end_y; i++) {
            const tokens = [];
            const line = this.lines[i];
            let token = "";
            let token_type = "";
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if((this.canSplit(char, {type: token_type, text: token}))) {
                    if (token !== "") {
                        token_type = this.get_token_type("", {type: token_type, text: token});
                        tokens.push({text: token, type: token_type});
                        token = "";
                        token_type = "operator";  
                    }
                    tokens.push({text: char, type: this.get_token_type(char, {type: "operator", text: ""})});
                }
                else if (j >= line.length - 1) {
                    token_type = this.get_token_type(char, {type: token_type, text: token});
                    token += char;
                    token_type = this.get_token_type("", {type: token_type, text: token});
                    tokens.push({text: token, type: token_type});
                }
                else
                    {
                        token_type = this.get_token_type(char, {type: token_type, text: token});                                            
                        token += char;
                    }
            }

            let x = this.menu_width + this.editor_x_offset - this.scroll_x;
            for (let j = 0; j < tokens.length; j++) {
                const token = tokens[j];
                const token_width = token.text.length * this.character_width;
                this.ctx.fillStyle = this.getSyntaxColor(token);
                this.ctx.fillText(token.text, x, this.line_height * i + this.line_height - this.scroll_y);
                x += token_width;
            }
        }
        if (this.is_dirty) {
            this.recalculateIdentifiers();
            this.computeParantheses();
            this.is_dirty = false;
        }
        this.drawLineNumbers();
        this.renderParantheses();
        this.drawSelection();
        this.drawCursor();
        this.drawMenu();
    }

    recalculateIdentifiers()
    {
        this.identifiers.clear();
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            let token = "";
            let token_type = "";
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if((this.canSplit(char, {type: token_type, text: token}))) {
                    if (token !== "") {
                        token_type = this.get_token_type("", {type: token_type, text: token});
                        if (token_type === "char")
                            this.addIdentifier(token);
                        token = "";
                        token_type = "operator";  
                    }
                }
                else if (j >= line.length - 1) {
                    token_type = this.get_token_type(char, {type: token_type, text: token});
                    token += char;
                    token_type = this.get_token_type("", {type: token_type, text: token});
                    if (token_type === "char")
                        this.addIdentifier(token);
                }
                else
                    {
                        token_type = this.get_token_type(char, {type: token_type, text: token});                                            
                        token += char;
                    }
            }
        }
    }

    addIdentifier(token)
    {
        if (this.identifiers.has(token))
        {
            this.identifiers.set(token, true);
            return;
        }
        this.identifiers.set(token, false);
    }

    get_token_type(char, token, next_char)
    {
        
        switch (token.type) {
            case "number":
                if (token.text.startsWith("s"))
                    console.log(token, char);
                    
                // everything is possible
                if (this.numbers.has(char)) return "number";
                if (this.operators.has(char)) return "operator";
                if (char === "e" || char === "E" || char === "." || char === "f") return "number";
                if (this.punctuation.has(char)) return "punctuation";
                return "char";
            case "operator":;
                if (this.numbers.has(char) && ((token.text === "-" || token.text === "+") || token.text.length < 1)) return "number";
                if (this.operators.has(char)) return "operator";
                if (this.punctuation.has(char)) return "punctuation";
                return "char";
            case "punctuation":
                // number and operator is impossible 
                if (!this.punctuation.has(char)) return "char";
                return "punctuation";
            case "char":
                // nothing is possible
                return "char";
            default:
                return "number";
        }
    }

    canSplit(char, token)
    {
        
        if (this.punctuation.has(char) || this.operators.has(char)) {
            if (token.type === "number" && char === ".") return false;
            if (token.type === "operator" && (char === "-" || char === "+")) return false;
            return true;
        }
        return false;
    }

    getSyntaxColor(token) {
        if (token.text.startsWith("+"))
            console.log(token.text);
            
        switch (token.type) {
            case "char":
                return this.getWordColor(token);
            case "punctuation":
                return this.token_colors["punctuation"];
            case "number":                
                return this.token_colors["number"];
            case "operator":
                return this.token_colors["operator"];
            default:
                return "#ff0000";
        }
    }

    // I know... it is not made by me... but it just takes SOOOOOO much time to think of all the keywords... it isn't worth it. It's not that deep.
    getWordColor(token)
    {
        switch (token.text)
        {
            // ───────── Control Flow ─────────
            case "if":
            case "else":
            case "for":
            case "while":
            case "do":
            case "switch":
            case "case":
            case "default":
            case "break":
            case "continue":
            case "return":
            case "discard":
                return this.token_colors["control flow"];

            // ───────── Storage / Qualifiers ─────────
            case "const":
            case "uniform":
            case "attribute":   // WebGL1
            case "varying":     // WebGL1
            case "in":
            case "out":
            case "inout":
            case "precision":
            case "highp":
            case "mediump":
            case "lowp":
            case "struct":
            case "layout":      // WebGL2
            case "centroid":
            case "flat":
            case "smooth":
                return this.token_colors["storage qualifier"];

            // ───────── Scalar Types ─────────
            case "void":
            case "bool":
            case "int":
            case "uint":        // WebGL2
            case "float":
                return this.token_colors["scalar"];

            // ───────── Vector Types ─────────
            case "vec2":
            case "vec3":
            case "vec4":
            case "ivec2":
            case "ivec3":
            case "ivec4":
            case "uvec2":       // WebGL2
            case "uvec3":
            case "uvec4":
            case "bvec2":
            case "bvec3":
            case "bvec4":
                return this.token_colors["vector"];

            // ───────── Matrix Types ─────────
            case "mat2":
            case "mat3":
            case "mat4":
            case "mat2x2":
            case "mat2x3":
            case "mat2x4":
            case "mat3x2":
            case "mat3x3":
            case "mat3x4":
            case "mat4x2":
            case "mat4x3":
            case "mat4x4":
                return this.token_colors["matrix"];

            // ───────── Samplers ─────────
            case "sampler2D":
            case "samplerCube":
            case "sampler3D":        // WebGL2
            case "sampler2DArray":   // WebGL2
            case "sampler2DShadow":
            case "samplerCubeShadow":
                return this.token_colors["sampler"];

            // ───────── Built-in Variables ─────────
            case "gl_Position":
            case "gl_PointSize":
            case "gl_FragCoord":
            case "gl_FrontFacing":
            case "gl_PointCoord":
            case "gl_FragDepth":
            case "gl_VertexID":      // WebGL2
            case "gl_InstanceID":    // WebGL2
            case "gl_FragColor":     // WebGL1 only
                return this.token_colors["gl vars"];
            case "main":
                return this.token_colors["identifier"];
            default:
                if (token.text.startsWith("#"))
                    return this.token_colors["preprocessor"];                
                if (this.identifiers.get(token.text))
                    return this.token_colors["identifier"];
                return this.token_colors["char"];
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

    //#########################################################################
    //                         MAINLOOP FUNCTIONS
    //#########################################################################

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
