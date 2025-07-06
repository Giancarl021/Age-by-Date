import Inputs from './services/Inputs';
import './style.css';

async function main() {
    const inputs = Inputs();

    inputs.init();
    inputs.on('inputChange', date => console.log(date.toISODate()));
    inputs.on('clear', () => console.log('VIEW CLEAR'));
}

document.addEventListener('DOMContentLoaded', main);
