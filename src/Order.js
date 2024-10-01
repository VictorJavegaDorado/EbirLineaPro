// Order.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Timer from './Timer';

function Order({ selectedUsers, orderStarted, orderStartTime, setOrderStarted, setOrderStartTime }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay usuarios seleccionados, redirigir al inicio
    if (selectedUsers.length === 0) {
      navigate('/');
    }
  }, [selectedUsers, navigate]);

  const handleBackHome = () => {
    navigate('/');
  };

  const handleStartOrder = () => {
    // Datos de la orden que se enviarán al backend
    const orderData = {
      linea: 'Linea 1', // Debes adaptar esto según tu lógica
      turno: 'Mañana',  // Debes adaptar esto según tu lógica
      numeroOrden: '12345', // Debes adaptar esto según tu lógica
      resumen: selectedUsers,
      fechaInicio: new Date(),
    };

    fetch('http://10.1.1.112:3000/api/ordenes/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Orden iniciada:', data);
        // Actualizar el estado para iniciar el temporizador
        setOrderStarted(true);
        setOrderStartTime(new Date());
      })
      .catch((error) => {
        console.error('Error al iniciar la orden:', error);
        alert('Error al iniciar la orden. Consulta la consola para más detalles.');
      });
  };

  return (
    <div>
      <h1>Orden</h1>
      <button onClick={handleBackHome}>Volver al Inicio</button>
      {!orderStarted ? (
        <div>
          <h2>Operarios Seleccionados</h2>
          <ul>
            {selectedUsers.map((user) => (
              <li key={user.id}>
                {user.nombre} {user.apellidos}
              </li>
            ))}
          </ul>
          <button onClick={handleStartOrder}>Iniciar Orden</button>
        </div>
      ) : (
        <div>
          <h2>Orden en Curso</h2>
          <Timer startTime={orderStartTime} />
        </div>
      )}
    </div>
  );
}

export default Order;
