// Operario.js

import React, { useEffect } from 'react';
import '../Operario.css'; // Asegúrate de tener estilos adecuados

const API_BASE_URL = 'http://192.168.0.31:3000';

const Operario = ({
  operario,
  toggleSeleccionarOperario,
  seleccionado,
  iniciarDescansoOperario,
  finalizarDescansoOperario,
  iniciarIncidenciaOperario,
  formatTime,
  removerOperario, // Función pasada desde App.js
}) => {
  // Maneja la selección del operario al hacer clic en el contenedor
  const handleSeleccionar = () => {
    toggleSeleccionarOperario(operario.id);
  };

  // Inicia el descanso del operario
  const handleIniciarDescanso = (e) => {
    e.stopPropagation(); // Evita que el clic se propague al contenedor
    iniciarDescansoOperario(operario.id);
  };

  // Finaliza el descanso del operario
  const handleFinalizarDescanso = (e) => {
    e.stopPropagation();
    finalizarDescansoOperario(operario.id);
  };

  // Inicia una incidencia para el operario
  const handleIncidencia = (e) => {
    e.stopPropagation();
    iniciarIncidenciaOperario(operario.id);
  };

  // Maneja la remoción del operario
  const handleRemover = (e) => {
    e.stopPropagation(); // Evita que el clic se propague al contenedor
    removerOperario(operario.id); // Llama a la función de remoción en App.js
  };

  // Función para determinar la clase CSS basada en el estado
  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'trabajando':
        return 'estado-trabajando';
      case 'en_descanso':
        return 'estado-en-descanso';
      case 'pausado':
        return 'estado-pausado';
      case 'libre':
        return 'estado-libre';
      case 'Preparado':
        return 'estado-preparado';
      default:
        return '';
    }
  };

  // Efecto para depurar el estado actual del operario
  useEffect(() => {
    console.log(`Operario: ${operario.nombre} ${operario.apellidos}, Estado: ${operario.estado}, Inicio: ${operario.inicio}`);
  }, [operario.nombre, operario.apellidos, operario.estado, operario.inicio]);

  return (
    <div
      className={`operario-container ${seleccionado ? 'seleccionado' : ''} ${getEstadoClass(operario.estado)}`}
      onClick={handleSeleccionar}
    >
      <img
        className={`operario-imagen ${operario.estado === 'trabajando' ? 'borde-parpadeante' : ''}`}
        src={operario.imagen || '/imagenes/default.jpg'} // Proporciona una imagen por defecto si está undefined
        alt={`${operario.nombre} ${operario.apellidos}`}
        onError={(e) => { e.target.src = '/imagenes/default.jpg'; }} // Maneja errores de carga de imagen
      />
      <div className="operario-info">
        <h4>{`${operario.nombre} ${operario.apellidos}`}</h4>
        <p>{operario.estado || 'Desconocido'}</p> {/* Muestra 'Desconocido' si el estado es undefined */}
        <p>{formatTime(operario.tiempoTrabajado)}</p>
      </div>
      <div className="operario-buttons">
        {operario.estado === 'trabajando' && (
          <button onClick={handleIniciarDescanso}>PARO</button>
        )}
        {operario.estado === 'en_descanso' && (
          <button onClick={handleFinalizarDescanso}>FIN PARO</button>
        )}
        <button className="incidencia-button" onClick={handleIncidencia}>
          INCIDENCIA
        </button>
        <button
          onClick={handleRemover}
          className="remove-button"
          disabled={operario.estado !== 'Preparado'}
          title={
            operario.estado !== 'Preparado'
              ? 'No puedes quitar operarios que no están preparados'
              : 'Quitar Operario'
          }
        >
          x
        </button>
      </div>
    </div>
  );
};

export default Operario;
