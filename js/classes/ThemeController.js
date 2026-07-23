export class ThemeController {
    constructor() {
        this.btn = document.getElementById('theme-toggle');
        this.icon = this.btn ? this.btn.querySelector('i') : null;
        
        if (this.btn) {
            this.initTheme();
            this.btn.addEventListener('click', () => this.toggleTheme());
        }
    }

    initTheme() {
        const savedTheme = localStorage.getItem('romanticTheme');
        
        if (savedTheme === 'dark') {
            this.setDark();
        } else {
            this.setLight();
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            this.setLight();
        } else {
            this.setDark();
        }
    }

    setDark() {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('romanticTheme', 'dark');
        if (this.icon) {
            this.icon.classList.remove('fa-moon');
            this.icon.classList.add('fa-sun');
        }
    }

    setLight() {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('romanticTheme', 'light');
        if (this.icon) {
            this.icon.classList.remove('fa-sun');
            this.icon.classList.add('fa-moon');
        }
    }
}
