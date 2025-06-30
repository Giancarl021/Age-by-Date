import View from './services/View';
import './style.css';

async function main() {
    const view = View();

    view.init();
    view.on('inputChange', date => console.log(date.toISODate()));
    view.on('clear', () => console.log('VIEW CLEAR'));
}

document.addEventListener('DOMContentLoaded', main);
