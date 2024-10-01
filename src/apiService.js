// apiService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://10.1.1.112:3000';

const fetchData = async (endpoint, method = 'GET', body = null) => {
  const url = `${API_BASE_URL}/api/${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al realizar la solicitud a ${url}:`, error);
    throw error;
  }
};

export const getLineas = () => fetchData('lineas');
export const getOperariosDefinidos = () => fetchData('operarios_definidos');
export const getVideosDisponibles = () => fetchData('videos');
export const iniciarOrden = (data) => fetchData('ordenes/iniciar', 'POST', data);
export const pausarLinea = (data) => fetchData('ordenes/pausar', 'POST', data);
export const reanudarLinea = (data) => fetchData('ordenes/reanudar', 'POST', data);
export const finalizarOrden = (data) => fetchData('ordenes/finalizar', 'POST', data);
export const verificarOrdenEnCurso = (data) => fetchData('ordenes/en_curso', 'POST', data);
