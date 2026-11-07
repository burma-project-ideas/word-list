// Run in the browser console on /spell-check after the app loads.
(() => {
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const editor = document.createElement('div');
    editor.id = 'spellcheck-regression-test';
    editor.contentEditable = 'true';
    document.body.append(editor);
    try {
        const text = 'ကက က\nကက <img src=x onerror=alert(1)>';
        editor.innerText = text;
        window.spellCheck.updateHighlights(editor.id, ['ကက']);
        assert(editor.textContent === text, 'Highlighting must preserve text and line breaks');
        assert(editor.querySelectorAll('.squiggly').length === 2, 'Repeated misspellings must be highlighted');
        assert(!editor.querySelector('img'), 'Pasted HTML must remain text');
        assert(editor.querySelector('.squiggly').tabIndex === 0, 'Suggestions must be keyboard accessible');
        window.spellCheck.replaceWord(editor.id, 'ကက', 'ခ');
        assert(editor.textContent.startsWith('ခ က\nကက'), 'Only the first matching word should be replaced');
        window.spellCheck.updateHighlights(editor.id, []);
        assert(!editor.querySelector('.squiggly'), 'Clearing highlights must remove suggestion controls');
        console.info('Spell checker regression checks passed');
    } finally {
        editor.remove();
    }
})();
