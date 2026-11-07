window.spellCheck = {
    updateHighlights: function (elementId, misspelledWords) {
        const editor = document.getElementById(elementId);
        if (!editor) return;

        // Save cursor position
        const selection = window.getSelection();
        let offset = 0;
        if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const preRange = range.cloneRange();
            preRange.selectNodeContents(editor);
            preRange.setEnd(range.startContainer, range.startOffset);
            offset = preRange.toString().length;
        }

        const text = editor.innerText;
        const misspelled = new Set(misspelledWords);
        const fragment = document.createDocumentFragment();
        for (const token of text.split(/([ \n\r\t.,!?()[\]{}]+)/)) {
            if (!misspelled.has(token)) {
                fragment.append(document.createTextNode(token));
                continue;
            }
            const span = document.createElement('span');
            span.className = 'squiggly';
            span.dataset.word = token;
            span.tabIndex = 0;
            span.setAttribute('role', 'button');
            span.setAttribute('aria-label', `Spelling suggestions for ${token}`);
            span.textContent = token;
            fragment.append(span);
        }
        const hadSelection = selection.rangeCount > 0 && editor.contains(selection.anchorNode);
        editor.replaceChildren(fragment);
        if (hadSelection) {
            // Restore cursor position
            const newRange = document.createRange();
            const textNodes = Array.from(editor.childNodes)
                .flatMap(node => node.nodeType === 3 ? [node] : Array.from(node.childNodes))
                .filter(node => node.nodeType === 3);

            let currentOffset = 0;
            let found = false;
            for (const node of textNodes) {
                const length = node.textContent.length;
                if (currentOffset + length >= offset) {
                    newRange.setStart(node, offset - currentOffset);
                    newRange.setEnd(node, offset - currentOffset);
                    found = true;
                    break;
                }
                currentOffset += length;
            }

            if (found) {
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }
    },
    initEditor: function (elementId, dotNetHelper) {
        const editor = document.getElementById(elementId);
        if (!editor) return;

        function showSuggestions(e) {
            const span = e.target.closest('.squiggly');
            if (!span) {
                if (e.type === 'click') dotNetHelper.invokeMethodAsync('HideSuggestions');
                return;
            }
            if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
            if (e.type === 'keydown') e.preventDefault();
            const rect = span.getBoundingClientRect();
            const left = Math.max(8, Math.min(rect.left, window.innerWidth - 248));
            const top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 290));
            dotNetHelper.invokeMethodAsync('ShowSuggestions', span.dataset.word, left, top).then(() => {
                requestAnimationFrame(() => document.querySelector('.suggestion-popover button')?.focus());
            });
        }
        editor.addEventListener('click', showSuggestions);
        editor.addEventListener('keydown', showSuggestions);
    },
    replaceWord: function (elementId, oldWord, newWord) {
        const editor = document.getElementById(elementId);
        if (!editor) return;

        // Simple replacement in HTML to preserve squigglies of other words
        // In a more robust impl, we'd search for the specific span
        const spans = editor.querySelectorAll('.squiggly');
        for (const span of spans) {
            if (span.getAttribute('data-word') === oldWord) {
                span.replaceWith(document.createTextNode(newWord));
                break;
            }
        }
    },
    downloadText: function (filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
};
