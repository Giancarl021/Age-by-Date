import View from './services/View';
import './style.css';

async function main() {
    const view = View();

    view.init();
    view.on('inputChange', console.log);
    view.on('clear', () => console.log('VIEW CLEAR'));
}

document.addEventListener('DOMContentLoaded', main);
