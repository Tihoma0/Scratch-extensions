class WebGLShaderEditor {
    constructor() {
        

        this.div = document.getElementById('container');
        this.div_menu = document.getElementById('menu');
        this.div_close = document.getElementById('close');
        const crossH = document.getElementById('horizontal');
        const crossV = document.getElementById('vertical');
        const resizeHandle = document.getElementById('resizeHandle');
        this.sidebar = document.getElementById('sidebar');
        this.editorarea = document.getElementById('editorArea');
        this.editorarea.contentEditable = true;

        this.isResizingBox = false;
        this.isResizingSidebar = false;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.resizeDir = { top: false, bottom: false, left: false, right: false };

        resizeHandle.addEventListener('mousedown', () => {
            this.isDragging = false;
            this.isResizingBox = false;
            this.isResizingSidebar = true;
        })

    //     editorArea.addEventListener('keydown', (e) => {
    //     if (e.key === "Enter" && !e.shiftKey) {
    //         e.preventDefault(); // prevent default div/p
    //         const br = document.createElement("br");
    //         const sel = window.getSelection();
    //         if (!sel.rangeCount) return;
    //         const range = sel.getRangeAt(0);
    //         range.deleteContents();
    //         range.insertNode(br);
    //         // move caret after the <br>
    //         range.setStartAfter(br);
    //         range.collapse(true);
    //         sel.removeAllRanges();
    //         sel.addRange(range);
    //     }
    // });

        editorArea.addEventListener('keyup', (e) => {
            const sel = this.saveSelection(this.editorarea);
            const letter = e.key;

            // Split existing lines (divs) instead of textContent
            const lines = Array.from(this.editorarea.childNodes).map(node => {
                if (node.nodeName === "DIV") return node.textContent;
                if (node.nodeName === "BR") return "\n";
                return node.textContent;
            });
            console.log(this.editorarea.innerHTML);
            

            const highlighted = lines.map(line => {
                // escape HTML
                line = line.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace("\n", "<br>");

                // syntax highlight
                return line.replace(/([a-zA-Z0-9]+)([ \t]+)([a-zA-Z0-9]+)/g, `<span class='keyword'>$1</span><span class='whitespace'>$2</span><span class='identifier'>$3</span>`);
            });

            // Replace innerHTML with DIVs
            this.editorarea.innerHTML = highlighted.map(l => `<div>${l || '<br>'}</div>`).join('');

            this.restoreSelection(this.editorarea, sel, letter);
    
        });


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
            this.isResizingBox = false;
        })

        this.div.addEventListener('mousedown', (e) => {
            const rect = this.div.getBoundingClientRect();
            const onRight = rect.right - e.clientX < 8;
            const onBottom = rect.bottom - e.clientY < 8;
            const onLeft = e.clientX - rect.left < 8;
            const onTop = e.clientY - rect.top < 8;
            if (!(onRight || onBottom || onLeft || onTop)) return;
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            this.div.style.zIndex = '9999';
            this.isResizingBox = true;
            this.resizeDir = { top: onTop, bottom: onBottom, left: onLeft, right: onRight };
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.div.style.left = `${e.clientX - this.offsetX}px`;
                this.div.style.top = `${e.clientY - this.offsetY}px`;
            } else if (this.isResizingBox) {
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
                }
                if (this.resizeDir.top) {
                    newHeight = rect.bottom - e.clientY;
                    newTop = e.clientY;
                }

                this.div.style.width = `${Math.max(newWidth, 350)}px`;
                this.div.style.height = `${Math.max(newHeight, 160)}px`;
                if (this.resizeDir.left) this.div.style.left = `${newLeft}px`;
                if (this.resizeDir.top) this.div.style.top = `${newTop}px`;
            } else if (this.isResizingSidebar) {
                resizeHandle.classList.add("resizeHandleDragged");
                const rect = this.div.getBoundingClientRect();
                let newWidth = e.clientX - rect.left;
                if (newWidth < 45) {
                    newWidth = 5;
                    this.sidebar.classList.add("sidebarcollapsed");
                    this.sidebar.classList.remove("sidebar");
                }
                else {
                    this.sidebar.classList.remove("sidebarcollapsed");
                    this.sidebar.classList.add("sidebar");
                    newWidth = Math.max(90, newWidth)
                }
                this.sidebar.style.width = `${newWidth}px`;                
                if (newWidth > rect.width - 100) 
                this.sidebar.style.width = "100%";
                
            } 
            else {
                const rect = this.div.getBoundingClientRect();
                const onRight = rect.right - e.clientX < 8;
                const onBottom = rect.bottom - e.clientY < 8;
                const onLeft = e.clientX - rect.left < 8;
                const onTop = e.clientY - rect.top < 8;
                resizeHandle.classList.remove("resizeHandleDragged");                

                if ((onRight && onBottom) || (onLeft && onTop)) this.div.style.cursor = 'nwse-resize';
                else if ((onRight && onTop) || (onLeft && onBottom)) this.div.style.cursor = 'nesw-resize';
                else if (onRight || onLeft) this.div.style.cursor = 'ew-resize';
                else if (onTop || onBottom) this.div.style.cursor = 'ns-resize';
                else this.div.style.cursor = 'default';
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isResizingBox = false;
            this.isResizingSidebar = false;
        });

    }

    hide() {
        console.log("hide");
        
    }

    updateSyntax() {
        let text = this.editorarea.textContent;
        text = text.replace('vec3', "<span class='vectors'>vec3</span>");
        this.editorarea.textContent = text;
    }

    saveSelection(containerEl) {
        const sel = window.getSelection();
        if (sel.rangeCount === 0) return null;

        const range = sel.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;

        return { start: start, end: start + range.toString().length };
    }

    restoreSelection(containerEl, savedSel, typedLetter) {
        console.log(typedLetter);
        
        if (!savedSel) return;
        let charIndex = 0
        const range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);

        function traverse(node, node_before = null) {
            if (node.nodeType === Node.TEXT_NODE) {
                const nextCount = charIndex + node.length;
                if (savedSel.start >= charIndex && savedSel.start <= nextCount) {
                    range.setStart(node, savedSel.start - charIndex);                    
                }
                if (savedSel.end >= charIndex && savedSel.end <= nextCount) {
                    range.setEnd(node, savedSel.end - charIndex);
                    console.log(savedSel.end - charIndex, charIndex, nextCount);
                    
                }
                charIndex = nextCount;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'BR') {
                    
                    // range.setStartBefore(node_before);
                    // range.setEndBefore(node_before);
                    
                    // return;
                }
                for (let i = 0; i < node.childNodes.length; i++) {
                    traverse(node.childNodes[i], node);
                }
            }
        }
        traverse(containerEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }


}
editor = new WebGLShaderEditor();