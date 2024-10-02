// App.js

import React, { useState, useEffect } from 'react';
import Operario from './components/Operario';
import Swal from 'sweetalert2';
import ReactPlayer from 'react-player';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://192.168.0.31:3000';

const App = () => {
  // Estados principales
  const [operarios, setOperarios] = useState([]);
  const [operariosSeleccionados, setOperariosSeleccionados] = useState([]);
  const [turno, setTurno] = useState('');
  const [linea, setLinea] = useState('');
  const [pantallaInicial, setPantallaInicial] = useState(true);
  const [fechaInicioOrden, setFechaInicioOrden] = useState(null);

  // Estados para modales
  const [showInicioModal, setShowInicioModal] = useState(false);
  const [showFinModal, setShowFinModal] = useState(false);
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);
  const [showOperarioMotivoModal, setShowOperarioMotivoModal] = useState(false);
  const [showOperarioIncidenciaModal, setShowOperarioIncidenciaModal] = useState(false);

  // Estados para formularios
  const [numeroOrden, setNumeroOrden] = useState('');
  const [qualityChecks, setQualityChecks] = useState({
    check1: false,
    check2: false,
    check3: false,
  });
  const [motivoPausa, setMotivoPausa] = useState('');
  const [motivoIncidencia, setMotivoIncidencia] = useState('');
  const [motivoOperarioPausa, setMotivoOperarioPausa] = useState('');
  const [motivoOperarioIncidencia, setMotivoOperarioIncidencia] = useState('');

  // Otros estados
  const [lineaEstado, setLineaEstado] = useState('Preparado');
  const [isPaused, setIsPaused] = useState(false);
  const [videosDisponibles, setVideosDisponibles] = useState([]);
  const [videoSeleccionado, setVideoSeleccionado] = useState(null);
  const [currentOperarioId, setCurrentOperarioId] = useState(null);
  const [lineas, setLineas] = useState([]);
  const turnos = ['Mañana', 'Tarde'];

  // Estado para operario a agregar
  const [operarioParaAgregar, setOperarioParaAgregar] = useState('');

  // Fetch líneas de montaje
  useEffect(() => {
    const fetchLineas = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/lineas`);
        const data = await response.json();
        setLineas(data);
      } catch (error) {
        console.error('Error al obtener las líneas de montaje:', error);
      }
    };

    fetchLineas();
  }, []);

  // Fetch operarios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseOperarios = await fetch(`${API_BASE_URL}/api/operarios_definidos`);
        const operariosData = await responseOperarios.json();
        setOperarios(
          operariosData.map((op) => ({
            id: op.id,
            nombre: op.nombre || '',
            apellidos: op.apellidos || '',
            imagen: op.imagen || `/imagenes/operario${op.id}.jpg`,
            isSupervisor: op.isSupervisor || false,
            lineaAsignada: op.lineaAsignada,
            turno: op.idTurno,
            seleccionado: false,
            estado: 'Preparado',
            tiempoTrabajado: 0,
            tiempoDescanso: 0,
            tiempoDescansoEnCurso: 0,
            descansos: [],
            inicio: null,
            isRemovable: true,
          }))
        );


        //videos
        const responseVideos = await fetch(`${API_BASE_URL}/api/videos`);
        const videosData = await responseVideos.json();
        setVideosDisponibles(videosData);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchData();
  }, []);

  // Limpiar la selección de operarios al volver al inicio
  useEffect(() => {
    if (pantallaInicial) {
      setOperariosSeleccionados([]);
      setLineaEstado('Preparado');
      setFechaInicioOrden(null);
      setIsPaused(false);
    }
  }, [pantallaInicial]);

  // Filtrar operarios disponibles para agregar
  const operariosDisponiblesParaAgregar = operarios.filter(
    (op) => !operariosSeleccionados.some((selectedOp) => selectedOp.id === op.id)
  );

  // Función para formatear el tiempo en hh:mm:ss
  const formatTime = (seconds) => {
    seconds = Math.max(0, Math.floor(seconds)); // Asegura que los segundos no sean negativos
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Función para enviar datos al servidor
  const enviarDatosAlServidor = (endpoint, data) => {
    fetch(`${API_BASE_URL}/api/ordenes/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
      })
      .then((data) => {
        console.log(`Datos enviados al servidor (${endpoint}):`, data);
      })
      .catch((error) => {
        console.error('Error al enviar los datos:', error);
      });
  };

  // Verificar si hay una orden en curso


const verificarOrdenEnCurso = () => {
  fetch(`${API_BASE_URL}/api/ordenes/en_curso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ linea, turno, numeroOrden }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al verificar la orden en curso');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Datos recibidos de la API:', data); // Log para inspeccionar la respuesta
      if (data.existe) {
        setFechaInicioOrden(new Date(data.orden.fechaInicio));

        // **Nuevo Enfoque: Asignar directamente los operarios recuperados**
        setOperariosSeleccionados(data.operarios.map((opData) => ({
          ...opData,
          seleccionado: true,
          estado: opData.estado || 'trabajando', // Asigna 'trabajando' si 'estado' está undefined
          inicio: opData.inicio ? new Date(opData.inicio) : new Date(data.orden.fechaInicio),
          tiempoTrabajado: 0,
          tiempoDescanso: 0,
          tiempoDescansoEnCurso: 0,
          descansos: opData.descansos || [],
        })));

        setLineaEstado('trabajando');
        setShowInicioModal(false);
        Swal.fire({
          icon: 'info',
          title: 'Orden Recuperada',
          text: 'Se ha recuperado una orden en curso.',
          confirmButtonText: 'Aceptar',
        });
      } else {
        iniciarOrden();
      }
    })
    .catch((error) => {
      console.error('Error al verificar la orden en curso:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al verificar la orden en curso.',
        confirmButtonText: 'Aceptar',
      });
    });
};


  // Iniciar una nueva orden
  const iniciarOrden = () => {
    const ahora = new Date();
    setFechaInicioOrden(ahora);

    const orden = {
      linea,
      turno,
      numeroOrden,
      resumen: resumenOperarios(operariosSeleccionados),
      fechaInicio: ahora.toISOString(),
    };

    enviarDatosAlServidor('iniciar', orden);

    // Establecer 'inicio' y 'estado' para cada operario seleccionado
    const updatedOperariosSeleccionados = operariosSeleccionados.map((op) => ({
      ...op,
      inicio: ahora, // Establece la fecha y hora de inicio
      tiempoTrabajado: 0, // Resetea el tiempo trabajado
      tiempoDescanso: 0, // Resetea el tiempo de descanso
      tiempoDescansoEnCurso: 0,
      descansos: [],
      estado: 'trabajando', // Asegura que el estado es 'trabajando'
    }));

    setOperariosSeleccionados(updatedOperariosSeleccionados);

    setShowInicioModal(false);
    setLineaEstado('trabajando');
    Swal.fire({
      icon: 'success',
      title: 'Orden Iniciada',
      text: 'La orden ha sido iniciada correctamente.',
      confirmButtonText: 'Aceptar',
    });
  };

  // Pausar la línea
  const pausarLinea = () => {
    if (!linea) return;

    fetch(`${API_BASE_URL}/api/ordenes/pausar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linea, motivo: motivoPausa }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al pausar la línea en el servidor');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Línea pausada correctamente:', data);
        setLineaEstado('pausado');

        const updatedOperarios = operariosSeleccionados.map((op) => {
          if (op.estado === 'trabajando') {
            return {
              ...op,
              estado: 'pausado',
              pausaInicio: new Date(),
              tiempoDescansoEnCurso: 0,
            };
          }
          return op;
        });

        setOperariosSeleccionados(updatedOperarios);
        setIsPaused(true);
        setShowMotivoModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Línea Pausada',
          text: 'La línea ha sido pausada correctamente.',
          confirmButtonText: 'Aceptar',
        });
      })
      .catch((error) => {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al pausar la línea.',
          confirmButtonText: 'Aceptar',
        });
      });
  };

  // Reanudar la línea
  const reanudarLinea = () => {
    if (!linea) return;

    fetch(`${API_BASE_URL}/api/ordenes/reanudar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linea }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al reanudar la línea en el servidor');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Línea reanudada correctamente:', data);
        setLineaEstado('trabajando');

        const ahora = new Date();

        const updatedOperarios = operariosSeleccionados.map((op) => {
          if (op.estado === 'pausado') {
            const tiempoEnPausa = (ahora - new Date(op.pausaInicio)) / 1000;
            const nuevoTiempoDescanso = (op.tiempoDescanso || 0) + tiempoEnPausa;

            return {
              ...op,
              estado: 'trabajando',
              inicio: new Date(new Date(op.inicio).getTime() + tiempoEnPausa * 1000),
              tiempoDescanso: nuevoTiempoDescanso,
              pausaInicio: null,
              tiempoDescansoEnCurso: 0,
            };
          }
          return op;
        });

        setOperariosSeleccionados(updatedOperarios);
        setIsPaused(false);

        Swal.fire({
          icon: 'success',
          title: 'Línea Reanudada',
          text: 'La línea ha sido reanudada correctamente.',
          confirmButtonText: 'Aceptar',
        });
      })
      .catch((error) => {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al reanudar la línea.',
          confirmButtonText: 'Aceptar',
        });
      });
  };

  // Alternar pausa de la línea
  const togglePausaLinea = () => {
    if (isPaused) {
      reanudarLinea();
    } else {
      setShowMotivoModal(true);
    }
  };

  // Finalizar la orden
  const finalizarOrden = () => {
    const ahora = new Date();
    const updatedOperarios = operariosSeleccionados.map((op) => {
      if (op.estado === 'trabajando' || op.estado === 'en_descanso') {
        let tiempoDescansoTotal = op.tiempoDescanso || 0;

        if (op.estado === 'en_descanso') {
          const ultimoDescanso = op.descansos[op.descansos.length - 1];
          const tiempoDescansoActual = (ahora - new Date(ultimoDescanso.inicio)) / 1000;
          tiempoDescansoTotal += tiempoDescansoActual;

          // Finalizar el descanso actual
          const descansosActualizados = op.descansos.map((descanso) => {
            if (!descanso.fin) {
              return { ...descanso, fin: ahora, tiempoDescanso: tiempoDescansoActual };
            }
            return descanso;
          });

          return {
            ...op,
            estado: 'trabajando',
            descansos: descansosActualizados,
            tiempoDescanso: tiempoDescansoTotal,
            tiempoDescansoEnCurso: 0,
          };
        }

        const tiempoTotalTrabajado = Math.max(0, (ahora - new Date(op.inicio)) / 1000 - tiempoDescansoTotal);

        return {
          ...op,
          tiempoTrabajado: tiempoTotalTrabajado,
        };
      }
      return op;
    });

    const resumen = resumenOperarios(updatedOperarios);

    const finalizarDatos = {
      linea,
      turno,
      numeroOrden,
      resumen,
      fechaInicio: fechaInicioOrden.toISOString(),
    };

    enviarDatosAlServidor('finalizar', finalizarDatos);

    const resetOperarios = updatedOperarios.map((op) => ({
      ...op,
      estado: 'Preparado',
      tiempoTrabajado: 0,
      tiempoDescanso: 0,
      tiempoDescansoEnCurso: 0,
      descansos: [],
      inicio: null,
      seleccionado: false,
      isRemovable: true,
    }));
    setOperariosSeleccionados(resetOperarios);
    setFechaInicioOrden(null);

    setNumeroOrden('');
    setQualityChecks({ check1: false, check2: false, check3: false });

    setShowFinModal(false);
    setLineaEstado('Preparado');
    Swal.fire({
      icon: 'success',
      title: 'Orden Finalizada',
      text: 'La orden ha sido finalizada correctamente.',
      confirmButtonText: 'Aceptar',
    });
  };

  // Manejar el envío del formulario inicial
  
  const handleSubmit = () => {

    console.log('Operarios disponibles:', operarios);
  console.log('Línea seleccionada:', linea);
  console.log('Turno seleccionado:', turno);

    if (linea && turno) {
     const operariosFiltrados = operarios
  .filter((op) => String(op.lineaAsignada) === String(linea) && op.turno === (turno === 'Mañana' ? 5 : 6))
  .map((op) => ({
    ...op,
    seleccionado: true,
  }));

  
      if (operariosFiltrados.length > 0) {
        setOperariosSeleccionados(operariosFiltrados);
        setPantallaInicial(false); // Cambia a la siguiente pantalla si hay operarios
      } else {
        Swal.fire({
          title: 'No hay operarios',
          text: 'No se encontraron operarios para la línea y turno seleccionados.',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
        });
      }
    } else {
      Swal.fire({
        title: 'Faltan datos',
        text: 'Por favor selecciona la línea de montaje y el turno.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
    }
  };
  

  // Función para manejar la selección de operarios
  const toggleSeleccionarOperario = (id) => {
    const updatedOperariosSeleccionados = operariosSeleccionados.map((op) => {
      if (op.id === id) {
        return { ...op, seleccionado: !op.seleccionado };
      }
      return op;
    });
    setOperariosSeleccionados(updatedOperariosSeleccionados);
  };

  // Resumen de operarios para enviar al servidor
  const resumenOperarios = (operarios) => {
    return operarios.map((op) => ({
      nombre: `${op.nombre} ${op.apellidos}`,
      tiempoTotal: formatTime(op.tiempoTrabajado),
      tiempoDescanso: formatTime(op.tiempoDescanso || 0),
    }));
  };

  // Iniciar descanso de un operario
  const iniciarDescansoOperario = (id) => {
    setCurrentOperarioId(id);
    setMotivoOperarioPausa('');
    setShowOperarioMotivoModal(true);
  };

  const confirmarInicioDescansoOperario = () => {
    const ahora = new Date();
    const updatedOperarios = operariosSeleccionados.map((op) => {
      if (op.id === currentOperarioId && op.estado === 'trabajando') {
        const nuevosDescansos = [
          ...(op.descansos || []),
          { inicio: ahora, fin: null, motivo: motivoOperarioPausa },
        ];
        return {
          ...op,
          estado: 'en_descanso',
          descansos: nuevosDescansos,
          tiempoDescansoEnCurso: 0,
          pausaInicio: ahora, // Recordamos el inicio del descanso
        };
      }
      return op;
    });
    setOperariosSeleccionados(updatedOperarios);
    setShowOperarioMotivoModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Descanso Iniciado',
      text: 'El descanso ha sido iniciado correctamente.',
      confirmButtonText: 'Aceptar',
    });
  };

  // Finalizar descanso de un operario
  const finalizarDescansoOperario = (id) => {
    const ahora = new Date();
    const updatedOperarios = operariosSeleccionados.map((op) => {
      if (op.id === id && op.estado === 'en_descanso') {
        const descansosActualizados = op.descansos.map((descanso) => {
          if (!descanso.fin) {
            const tiempoDescansoActual = (ahora - new Date(descanso.inicio)) / 1000; // en segundos
            return { ...descanso, fin: ahora, tiempoDescanso: tiempoDescansoActual };
          }
          return descanso;
        });

        const tiempoDescansoTotal = descansosActualizados.reduce(
          (total, descanso) => total + (descanso.tiempoDescanso || 0),
          0
        );

        const tiempoTrabajado = Math.max(
          0,
          (ahora - new Date(op.inicio)) / 1000 - tiempoDescansoTotal
        );

        return {
          ...op,
          estado: 'trabajando',
          descansos: descansosActualizados,
          tiempoDescanso: tiempoDescansoTotal,
          tiempoDescansoEnCurso: 0,
          tiempoTrabajado: tiempoTrabajado,
        };
      }
      return op;
    });
    setOperariosSeleccionados(updatedOperarios);
    Swal.fire({
      icon: 'success',
      title: 'Descanso Finalizado',
      text: 'El descanso ha sido finalizado correctamente.',
      confirmButtonText: 'Aceptar',
    });
  };

  // Manejar incidencia en la línea
  const handleIncidenciaLinea = () => {
    setMotivoIncidencia('');
    setShowIncidenciaModal(true);
  };

  const confirmarIncidenciaLinea = () => {
    setShowIncidenciaModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Incidencia Registrada',
      text: 'La incidencia ha sido registrada correctamente.',
      confirmButtonText: 'Aceptar',
    });
  };

  // Manejar incidencia en un operario
  const iniciarIncidenciaOperario = (id) => {
    setCurrentOperarioId(id);
    setMotivoOperarioIncidencia('');
    setShowOperarioIncidenciaModal(true);
  };

  const confirmarIncidenciaOperario = () => {
    setShowOperarioIncidenciaModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Incidencia Registrada',
      text: 'La incidencia del operario ha sido registrada correctamente.',
      confirmButtonText: 'Aceptar',
    });
  };

  // Manejar inicio de orden (mostrar modal)
  const handleIniciarOrden = () => {
    setShowInicioModal(true);
    setQualityChecks({ check1: false, check2: false, check3: false });
    setNumeroOrden('');
  };

  // Manejar finalización de orden (mostrar modal)
  const handleFinalizarOrden = () => {
    if (!fechaInicioOrden) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No has iniciado ninguna orden por lo que no puedes finalizar.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
    setShowFinModal(true);
  };

  // Función para manejar la adición de operarios
  const handleAgregarOperario = () => {
    if (!operarioParaAgregar) return;

    const operarioSeleccionado = operarios.find(
      (op) => op.id.toString() === operarioParaAgregar
    );

    if (operarioSeleccionado) {
      setOperariosSeleccionados((prevOperarios) => [
        ...prevOperarios,
        {
          ...operarioSeleccionado,
          seleccionado: true,
          estado: fechaInicioOrden ? 'trabajando' : 'Preparado', // Estado inicial al añadir
          tiempoTrabajado: fechaInicioOrden
            ? (new Date() - new Date(fechaInicioOrden)) / 1000
            : 0,
          tiempoDescanso: 0,
          tiempoDescansoEnCurso: 0,
          descansos: [],
          inicio: fechaInicioOrden ? new Date(fechaInicioOrden) : null,
        },
      ]);
      setOperarioParaAgregar(''); // Resetear el selector
      Swal.fire({
        icon: 'success',
        title: 'Operario Añadido',
        text: `${operarioSeleccionado.nombre} ${operarioSeleccionado.apellidos} ha sido añadido correctamente.`,
        confirmButtonText: 'Aceptar',
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Operario no encontrado.',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  // Función para remover operarios
  const handleRemoverOperario = (id) => {
    console.log(`ID a remover: ${id} (Tipo: ${typeof id})`);
    const operarioRemovido = operariosSeleccionados.find((op) => op.id === id);
    console.log(
      `Operario encontrado: ${
        operarioRemovido ? operarioRemovido.nombre : 'No encontrado'
      } (Estado: ${
        operarioRemovido ? operarioRemovido.estado : 'N/A'
      })`
    );
  
    if (!operarioRemovido) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Operario no encontrado.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
  
    if (operarioRemovido.estado === 'Preparado') {
      // Confirmación antes de remover
      Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar a ${operarioRemovido.nombre} ${operarioRemovido.apellidos}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          // Actualizar la lista de operarios seleccionados usando la forma funcional
          setOperariosSeleccionados((prevOperarios) =>
            prevOperarios.filter((op) => op.id !== id)
          );
  
          // Opcional: Informar al servidor sobre la remoción
          enviarDatosAlServidor('remover', { id });
  
          // Alerta de éxito
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: `${operarioRemovido.nombre} ${operarioRemovido.apellidos} ha sido eliminado de la orden.`,
            confirmButtonText: 'Aceptar',
          });
        }
      });
    } else {
      // Alertar al usuario que no se puede remover
      Swal.fire({
        icon: 'warning',
        title: 'No se puede quitar',
        text: 'No puedes quitar operarios que no están preparados',
        confirmButtonText: 'Aceptar',
      });
    }
  };
  
  
  

  // Actualizar cronómetros cada segundo
  // App.js

useEffect(() => {
  const interval = setInterval(() => {
    setOperariosSeleccionados((prevOperarios) =>
      prevOperarios.map((op) => {
        if (op.estado === 'trabajando') {
          if (!op.inicio || isNaN(new Date(op.inicio).getTime())) {
            console.error(`Fecha de inicio inválida para el operario ${op.nombre} ${op.apellidos}`);
            return op;
          }
          const tiempoActual = new Date();
          const diferencia = (tiempoActual - new Date(op.inicio)) / 1000; // Diferencia en segundos
          const tiempoTotalTrabajado = Math.max(0, diferencia - (op.tiempoDescanso || 0));
          console.log(`Operario ${op.nombre} ha trabajado ${tiempoTotalTrabajado} segundos.`);
          return { ...op, tiempoTrabajado: tiempoTotalTrabajado };
        } else if (op.estado === 'en_descanso') {
          const tiempoActual = new Date();
          const ultimoDescanso = op.descansos[op.descansos.length - 1];
          if (!ultimoDescanso || !ultimoDescanso.inicio) return op;
          const tiempoDescansoActual = Math.max(0, (tiempoActual - new Date(ultimoDescanso.inicio)) / 1000);
          const tiempoDescansoTotal = (op.tiempoDescanso || 0) + tiempoDescansoActual;
          console.log(`Operario ${op.nombre} está en descanso por ${tiempoDescansoActual} segundos.`);
          return {
            ...op,
            tiempoDescansoEnCurso: tiempoDescansoActual,
            tiempoDescanso: tiempoDescansoTotal,
          };
        }
        return op;
      })
    );
  }, 1000);

  return () => clearInterval(interval);
}, []);


  return (
    <div className="app-container">
      {pantallaInicial ? (
        <div className="pantalla-seleccion">
          <h2>Seleccionar línea de montaje y turno</h2>

          <div className="selector-container">
            <label>Línea de Montaje: </label>
          
            <select value={linea} onChange={(e) => setLinea(e.target.value)}>
  <option value="">Selecciona una línea</option>
  {lineas.map((lineaItem) => (
    <option key={lineaItem.id} value={lineaItem.id}>
      {lineaItem.nombre}
    </option>
  ))}
</select>


          </div>

          <div className="selector-container">
            <label>Turno: </label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="">Selecciona un turno</option>
              {turnos.map((turnoItem, index) => (
                <option key={index} value={turnoItem}>
                  {turnoItem}
                </option>
              ))}
            </select>
          </div>

          <h3>Seleccionar Operarios</h3>
          <button className="confirmar-button" onClick={handleSubmit}>
            Confirmar
          </button>

          <div className="operarios-container">
            {operariosSeleccionados.map((operario) => (
              <Operario
                key={operario.id}
                operario={operario}
                toggleSeleccionarOperario={toggleSeleccionarOperario}
                seleccionado={operario.seleccionado}
                iniciarDescansoOperario={iniciarDescansoOperario}
                finalizarDescansoOperario={finalizarDescansoOperario}
                iniciarIncidenciaOperario={iniciarIncidenciaOperario}
                formatTime={formatTime}
                removerOperario={handleRemoverOperario} // Pasar la función de remover
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="main-content">
          <div className="content-wrapper">
            <div className="center-content">
              {/* Modales */}
              {showInicioModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Antes de iniciar la orden</h2>
                    <div className="checkbox-container">
                      <label>
                        <input
                          type="checkbox"
                          checked={qualityChecks.check1}
                          onChange={(e) =>
                            setQualityChecks({
                              ...qualityChecks,
                              check1: e.target.checked,
                            })
                          }
                        />
                        He realizado la comprobación de los EPIs
                      </label>
                    </div>
                    <div className="checkbox-container">
                      <label>
                        <input
                          type="checkbox"
                          checked={qualityChecks.check2}
                          onChange={(e) =>
                            setQualityChecks({
                              ...qualityChecks,
                              check2: e.target.checked,
                            })
                          }
                        />
                        He realizado la comprobación del material
                      </label>
                    </div>
                    <div className="checkbox-container">
                      <label>
                        <input
                          type="checkbox"
                          checked={qualityChecks.check3}
                          onChange={(e) =>
                            setQualityChecks({
                              ...qualityChecks,
                              check3: e.target.checked,
                            })
                          }
                        />
                        He revisado que todo esté bien
                      </label>
                    </div>
                    <div className="input-container">
                      <label>
                        Nº Orden:
                        <input
                          type="text"
                          value={numeroOrden}
                          onChange={(e) => setNumeroOrden(e.target.value)}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          qualityChecks.check1 &&
                          qualityChecks.check2 &&
                          qualityChecks.check3 &&
                          numeroOrden.trim() !== ''
                        ) {
                          verificarOrdenEnCurso();
                        } else {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Campos Incompletos',
                            text: 'Por favor, completa todos los campos y checks.',
                            confirmButtonText: 'Aceptar',
                          });
                        }
                      }}
                    >
                      Iniciar
                    </button>
                    <button onClick={() => setShowInicioModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showMotivoModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Motivo de la Pausa</h2>
                    <div className="selector-container">
                      <label>Selecciona el motivo de la pausa:</label>
                      <select
                        value={motivoPausa}
                        onChange={(e) => setMotivoPausa(e.target.value)}
                      >
                        <option value="">Selecciona un motivo</option>
                        <option value="Almuerzo/Merienda">
                          Almuerzo/Merienda
                        </option>
                        <option value="Falta de material">
                          Falta de material
                        </option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (motivoPausa.trim() !== '') {
                          pausarLinea();
                        } else {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Motivo Faltante',
                            text: 'Por favor, selecciona un motivo para la pausa.',
                            confirmButtonText: 'Aceptar',
                          });
                        }
                      }}
                    >
                      Confirmar
                    </button>
                    <button onClick={() => setShowMotivoModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showFinModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Confirmar finalización de la orden</h2>
                    <p>¿Estás seguro de que deseas finalizar la orden?</p>
                    <p>Revisa que no haya ningún descanso activo.</p>
                    <button
                      onClick={() => {
                        const operariosEnDescanso = operariosSeleccionados.filter(
                          (op) => op.estado === 'en_descanso'
                        );
                        if (operariosEnDescanso.length > 0) {
                          Swal.fire({
                            icon: 'error',
                            title: 'Operarios en Descanso',
                            text: 'Hay operarios con paros activos. Por favor, finaliza los descansos antes de terminar la orden.',
                            confirmButtonText: 'Aceptar',
                          });
                        } else {
                          finalizarOrden();
                        }
                      }}
                    >
                      Finalizar Orden
                    </button>
                    <button onClick={() => setShowFinModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showIncidenciaModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Registrar Incidencia (Total)</h2>
                    <div className="selector-container">
                      <label>Selecciona el motivo de la incidencia:</label>
                      <select
                        value={motivoIncidencia}
                        onChange={(e) => setMotivoIncidencia(e.target.value)}
                      >
                        <option value="">Selecciona un motivo</option>
                        <option value="Ejemplo 1">Ejemplo 1</option>
                        <option value="Ejemplo 2">Ejemplo 2</option>
                        <option value="Ejemplo 3">Ejemplo 3</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (motivoIncidencia.trim() !== '') {
                          confirmarIncidenciaLinea();
                        } else {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Motivo Faltante',
                            text: 'Por favor, selecciona un motivo para la incidencia.',
                            confirmButtonText: 'Aceptar',
                          });
                        }
                      }}
                    >
                      Confirmar
                    </button>
                    <button onClick={() => setShowIncidenciaModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showOperarioMotivoModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Motivo de la Pausa Individual</h2>
                    <div className="selector-container">
                      <label>Selecciona el motivo de la pausa:</label>
                      <select
                        value={motivoOperarioPausa}
                        onChange={(e) => setMotivoOperarioPausa(e.target.value)}
                      >
                        <option value="">Selecciona un motivo</option>
                        <option value="Fisio">Fisio</option>
                        <option value="Reunión">Reunión</option>
                        <option value="Médico">Médico</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (motivoOperarioPausa.trim() !== '') {
                          confirmarInicioDescansoOperario();
                        } else {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Motivo Faltante',
                            text: 'Por favor, selecciona un motivo para la pausa.',
                            confirmButtonText: 'Aceptar',
                          });
                        }
                      }}
                    >
                      Confirmar
                    </button>
                    <button onClick={() => setShowOperarioMotivoModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showOperarioIncidenciaModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Registrar Incidencia (Parcial)</h2>
                    <div className="selector-container">
                      <label>Selecciona el motivo de la incidencia:</label>
                      <select
                        value={motivoOperarioIncidencia}
                        onChange={(e) => setMotivoOperarioIncidencia(e.target.value)}
                      >
                        <option value="">Selecciona un motivo</option>
                        <option value="Ejemplo 1">Ejemplo 1</option>
                        <option value="Ejemplo 2">Ejemplo 2</option>
                        <option value="Ejemplo 3">Ejemplo 3</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (motivoOperarioIncidencia.trim() !== '') {
                          confirmarIncidenciaOperario();
                        } else {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Motivo Faltante',
                            text: 'Por favor, selecciona un motivo para la incidencia.',
                            confirmButtonText: 'Aceptar',
                          });
                        }
                      }}
                    >
                      Confirmar
                    </button>
                    <button onClick={() => setShowOperarioIncidenciaModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              

              {/* Controles principales */}
              <div className="line-controls">
              <img src="http://localhost:3000/imagenes/logo1.png" alt="Logo corporativo" className="corner-logo" />

                <button onClick={handleIniciarOrden}>INICIO</button>
                <button onClick={togglePausaLinea}>
                  {isPaused ? 'REANUDAR' : 'PARO'}
                </button>
                <button
                  onClick={handleFinalizarOrden}
                  disabled={!fechaInicioOrden}
                  className="fin-button"
                  title={
                    !fechaInicioOrden
                      ? 'No has iniciado ninguna orden para finalizar.'
                      : 'Finalizar Orden'
                  }
                >
                  FIN
                </button>
                <button onClick={handleIncidenciaLinea} className="incidencia-button">
                  INCIDENCIA
                </button>
                <button onClick={() => setPantallaInicial(true)}>
                  VOLVER A INICIO
                </button>
                 {/* Selector para añadir operarios adicionales */}
              <div className="selector-adicional-container">
                <select
                  value={operarioParaAgregar}
                  onChange={(e) => setOperarioParaAgregar(e.target.value)}
                >
                  <option value="">Selecciona un operario</option>
                  {operariosDisponiblesParaAgregar.map((op) => (
                    <option key={op.id} value={op.id}>
                      {`${op.nombre} ${op.apellidos}`}
                    </option
>
                  ))}
                </select>
                <button
                  onClick={handleAgregarOperario}
                  disabled={!operarioParaAgregar}
                >
                  AÑADIR
                </button>
              </div>  
              </div>

              {/* Información de la línea */}
              
              
              <h1 className='center-text'>{` ${linea}`}</h1>
              <h2 className='center-text'>{` ${turno}`}</h2>
              <h2 className='center-text'>{`Orden: ${numeroOrden}`}</h2>
              
                {fechaInicioOrden && (
                  <h3 className='center-text'>{`Fecha de Inicio: ${fechaInicioOrden.toLocaleString()}`}</h3>
                )}
                

              {/* Supervisores */}
              <div className="supervisors-container">
                <h3>Jefes de Línea</h3>
                {operariosSeleccionados
                  .filter((op) => op.isSupervisor)
                  .map((operario) => (
                    <Operario
                      key={operario.id}
                      operario={operario}
                      toggleSeleccionarOperario={toggleSeleccionarOperario}
                      seleccionado={operario.seleccionado}
                      iniciarDescansoOperario={iniciarDescansoOperario}
                      finalizarDescansoOperario={finalizarDescansoOperario}
                      iniciarIncidenciaOperario={iniciarIncidenciaOperario}
                      formatTime={formatTime}
                      removerOperario={handleRemoverOperario} // Pasar la función de remover
                    />
                  ))}
              </div>

              {/* Operarios */}
              <div className="operatives-container">
                <h3>Operarios</h3>
                {operariosSeleccionados
                  .filter((op) => !op.isSupervisor)
                  .map((operario) => (
                    <Operario
                      key={operario.id}
                      operario={operario}
                      toggleSeleccionarOperario={toggleSeleccionarOperario}
                      seleccionado={operario.seleccionado}
                      iniciarDescansoOperario={iniciarDescansoOperario}
                      finalizarDescansoOperario={finalizarDescansoOperario}
                      iniciarIncidenciaOperario={iniciarIncidenciaOperario}
                      formatTime={formatTime}
                      removerOperario={handleRemoverOperario}
                    />
                  ))}
              
              </div>

             
                

      

              {/* Sección de Videos */}
              <div className="video-section">
                <div className="video-selector">
                  <h3>Reproducir paso a paso</h3>
                  <select
                    value={videoSeleccionado || ''}
                    onChange={(e) => setVideoSeleccionado(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecciona un video
                    </option>
                    {videosDisponibles.map((video, index) => (
                      <option key={index} value={video}>
                        {video}
                      </option>
                    ))}
                  </select>
                </div>

                {videoSeleccionado && (
                  <div className="video-player">
                    <ReactPlayer
                      url={`${API_BASE_URL}/videos/${encodeURIComponent(
                        videoSeleccionado
                      )}`}
                      controls
                      width="100%"
                      height="auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
