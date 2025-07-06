import Inputs from './services/Inputs';
import Outputs from './services/Outputs';

import './style.css';

async function main() {
    const inputs = Inputs();
    const outputs = Outputs();

    inputs.init();
    inputs.on('inputChange', outputs.setAge);
    inputs.on('clear', outputs.clear);
}

document.addEventListener('DOMContentLoaded', main);
