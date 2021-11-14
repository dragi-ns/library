(function IIFE() {
    const root = document.documentElement;
    if (localStorage.getItem('mode')) {
        root.dataset.mode = localStorage.getItem('mode');
    }

    const toggleMode = document.querySelector('#toggle-mode');
    toggleMode.addEventListener('click', () => {
        let mode = null;
        if (!root.dataset.mode || root.dataset.mode === 'light') {
            mode = 'dark';
        } else {
            mode = 'light';
        }
        root.dataset.mode = mode;
        localStorage.setItem('mode', mode);

    });
}());
