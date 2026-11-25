/** Punto de entrada: crea el modelo con los datos de ejemplo y arranca el MVC. */

import './view/styles.css';
import { Sistema } from './model/sistema';
import { iniciarRouter } from './controller/router';

const sistema = new Sistema();
sistema.cargarDemo();
iniciarRouter(sistema);
