// Home.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home({ selectedUsers, setSelectedUsers, setOrderStarted, setOrderStartTime }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  // Obtener la lista de usuarios desde la API al montar el componente
  useEffect(() => {
    fetch('http://10.1.1.112:3000/api/operarios_definidos')
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error('Error al obtener los operarios:', error));
  }, []);

  // Limpiar la selección de usuarios al montar la pantalla de inicio
  useEffect(() => {
    setSelectedUsers([]);
    setOrderStarted(false);
    setOrderStartTime(null);
  }, [setSelectedUsers, setOrderStarted, setOrderStartTime]);

  const toggleUserSelection = (user) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleStartOrder = () => {
    if (selectedUsers.length === 0) {
      alert('Por favor, selecciona al menos un operario para iniciar la orden.');
      return;
    }
    navigate('/order');
  };

  return (
    <div>
      <h1>Inicio</h1>
      <h2>Selecciona Operarios</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedUsers.find((u) => u.id === user.id) ? true : false}
                onChange={() => toggleUserSelection(user)}
              />
              {user.nombre} {user.apellidos}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={handleStartOrder}>Iniciar Orden</button>
    </div>
  );
}

export default Home;
