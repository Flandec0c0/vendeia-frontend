(function () {
  'use strict';

  var CLAVE_SOLICITUDES = 'vendeia_solicitudes';

  /* ---------- Menú hamburguesa ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('nav-menu');

  function cerrarMenu() {
    menu.classList.remove('abierto');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }

  function abrirMenu() {
    menu.classList.add('abierto');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('abierto')) {
        cerrarMenu();
      } else {
        abrirMenu();
      }
    });

    menu.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) {
        cerrarMenu();
      }
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
        cerrarMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (evento) {
      if (menu.classList.contains('abierto') && !evento.target.closest('.nav')) {
        cerrarMenu();
      }
    });
  }

  /* ---------- Aparición de secciones al hacer scroll ---------- */
  var reducirMovimiento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var elementos = document.querySelectorAll('.revelar');

  if (!reducirMovimiento && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-animado');

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elementos.forEach(function (elemento) {
      observador.observe(elemento);
    });
  }

  /* ---------- Conversación del celular en bucle ---------- */
  function iniciarChatEnBucle() {
    var pantalla = document.querySelector('.telefono__pantalla');
    if (!pantalla || reducirMovimiento) {
      return;
    }

    var telefono = pantalla.closest('.telefono');
    var portada = pantalla.closest('.hero');
    var visor = pantalla.querySelector('.chat__mensajes');
    var pista = pantalla.querySelector('.chat__pista');
    var estado = pantalla.querySelector('.chat__estado');
    var escribiendo = pantalla.querySelector('.chat__escribiendo');
    var burbujas = Array.prototype.slice.call(pista.querySelectorAll('.burbuja'));
    if (!visor || !pista || !escribiendo || !burbujas.length) {
      return;
    }

    var PAUSA_FINAL = 4000;
    var DURACION_SALIDA = 700;

    // Temporizador que se puede pausar y reanudar sin perder el tiempo restante.
    var siguientePaso = null;
    var temporizador = null;
    var restante = 0;
    var inicio = 0;
    var activo = false;
    var enPantalla = false;
    var portadaEnPantalla = false;

    function arrancarTemporizador() {
      inicio = Date.now();
      temporizador = window.setTimeout(function () {
        var paso = siguientePaso;
        temporizador = null;
        siguientePaso = null;
        paso();
      }, restante);
    }

    function esperar(ms, paso) {
      siguientePaso = paso;
      restante = ms;
      if (activo) {
        arrancarTemporizador();
      }
    }

    function pausar() {
      activo = false;
      pantalla.classList.add('pausado');
      if (temporizador) {
        window.clearTimeout(temporizador);
        temporizador = null;
        restante = Math.max(0, restante - (Date.now() - inicio));
      }
    }

    function reanudar() {
      activo = true;
      pantalla.classList.remove('pausado');
      if (siguientePaso && !temporizador) {
        arrancarTemporizador();
      }
    }

    function actualizarActividad() {
      var pestanaVisible = !document.hidden;
      var debeCorrer = enPantalla && pestanaVisible;
      if (portada) {
        // Las burbujas flotantes y las formas del banner se pausan aparte.
        portada.classList.toggle('pausado', !(portadaEnPantalla && pestanaVisible));
      }
      if (debeCorrer && !activo) {
        reanudar();
      } else if (!debeCorrer && activo) {
        pausar();
      }
    }

    // Desplaza la pista hacia arriba (solo transform) para que el último
    // mensaje quede a la vista, como en WhatsApp.
    function desplazarAlFinal() {
      var exceso = pista.offsetHeight - visor.clientHeight;
      pista.style.transform = 'translateY(' + -Math.max(0, exceso) + 'px)';
    }

    function tieneTarjetas(burbuja) {
      return !!burbuja.querySelector('.producto, .pago');
    }

    function tiempoDeLectura(burbuja) {
      var largo = burbuja.textContent.replace(/\s+/g, ' ').length;
      var ms = 1100 + Math.min(largo * 16, 2200);
      return tieneTarjetas(burbuja) ? ms + 1200 : ms;
    }

    function tiempoEscribiendo(burbuja) {
      var largo = burbuja.textContent.replace(/\s+/g, ' ').length;
      return 1100 + Math.min(largo * 6, 900);
    }

    function mostrarEscribiendo(visible) {
      escribiendo.classList.toggle('mostrado', visible);
      if (estado) {
        estado.textContent = visible ? 'escribiendo…' : 'en línea';
      }
      desplazarAlFinal();
    }

    function mostrarMensaje(indice) {
      if (indice >= burbujas.length) {
        esperar(PAUSA_FINAL, desvanecer);
        return;
      }

      var burbuja = burbujas[indice];
      var publicar = function () {
        mostrarEscribiendo(false);
        burbuja.classList.add('mostrado');
        desplazarAlFinal();
        esperar(tiempoDeLectura(burbuja), function () {
          mostrarMensaje(indice + 1);
        });
      };

      if (burbuja.classList.contains('burbuja--agente')) {
        mostrarEscribiendo(true);
        esperar(tiempoEscribiendo(burbuja), publicar);
      } else {
        publicar();
      }
    }

    function desvanecer() {
      pista.classList.add('saliendo');
      esperar(DURACION_SALIDA, function () {
        burbujas.forEach(function (burbuja) {
          burbuja.classList.remove('mostrado');
        });
        mostrarEscribiendo(false);
        esperar(500, function () {
          pista.classList.remove('saliendo');
          esperar(700, function () {
            mostrarMensaje(0);
          });
        });
      });
    }

    pantalla.classList.add('chat--animado');
    pantalla.classList.add('pausado');
    if (portada) {
      portada.classList.add('pausado');
    }
    desplazarAlFinal();
    esperar(800, function () {
      mostrarMensaje(0);
    });

    window.addEventListener('resize', desplazarAlFinal);
    document.addEventListener('visibilitychange', actualizarActividad);

    if ('IntersectionObserver' in window) {
      var observadorChat = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.target === telefono) {
            enPantalla = entrada.isIntersecting;
          } else {
            portadaEnPantalla = entrada.isIntersecting;
          }
        });
        actualizarActividad();
      }, { threshold: 0.15 });
      observadorChat.observe(telefono);
      if (portada) {
        observadorChat.observe(portada);
      }
    } else {
      enPantalla = true;
      portadaEnPantalla = true;
      actualizarActividad();
    }
  }

  iniciarChatEnBucle();

  /* ---------- localStorage (siempre protegido) ---------- */
  function leerSolicitudes() {
    try {
      var datos = window.localStorage.getItem(CLAVE_SOLICITUDES);
      var lista = datos ? JSON.parse(datos) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      return [];
    }
  }

  function guardarSolicitud(solicitud) {
    try {
      var lista = leerSolicitudes();
      lista.push(solicitud);
      window.localStorage.setItem(CLAVE_SOLICITUDES, JSON.stringify(lista));
      return true;
    } catch (error) {
      return false;
    }
  }

  /* ---------- Formulario de prueba gratis ---------- */
  var formulario = document.getElementById('formulario-prueba');
  var mensaje = document.getElementById('formulario-mensaje');

  if (!formulario) {
    return;
  }

  var campos = {
    nombre: formulario.elements.nombre,
    tienda: formulario.elements.tienda,
    rubro: formulario.elements.rubro,
    whatsapp: formulario.elements.whatsapp
  };

  function limpiarNumero(valor) {
    return valor.replace(/[\s-]/g, '');
  }

  function validarCampo(nombre) {
    var campo = campos[nombre];
    var valor = campo.value.trim();
    var error = '';

    if (!valor) {
      var vacio = {
        nombre: 'Escribe tu nombre.',
        tienda: 'Escribe el nombre de tu tienda.',
        rubro: 'Elige el rubro de tu tienda.',
        whatsapp: 'Escribe tu número de WhatsApp.'
      };
      error = vacio[nombre];
    } else if (nombre === 'whatsapp' && !/^[67]\d{7}$/.test(limpiarNumero(valor))) {
      error = 'El número debe tener 8 dígitos y empezar con 6 o 7.';
    }

    var contenedorError = document.getElementById(nombre + '-error');
    contenedorError.textContent = error;
    if (error) {
      campo.setAttribute('aria-invalid', 'true');
    } else {
      campo.removeAttribute('aria-invalid');
    }
    return !error;
  }

  Object.keys(campos).forEach(function (nombre) {
    var campo = campos[nombre];
    var evento = campo.tagName === 'SELECT' ? 'change' : 'input';
    campo.addEventListener(evento, function () {
      if (campo.getAttribute('aria-invalid') === 'true') {
        validarCampo(nombre);
      }
    });
    campo.addEventListener('blur', function () {
      if (campo.value.trim()) {
        validarCampo(nombre);
      }
    });
  });

  function mostrarMensaje(tipo, texto) {
    mensaje.className = 'formulario__mensaje ' + tipo;
    mensaje.innerHTML = '';
    var parrafo = document.createElement('p');
    parrafo.textContent = texto;
    mensaje.appendChild(parrafo);
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    mensaje.className = 'formulario__mensaje';
    mensaje.textContent = '';

    var primerInvalido = null;
    Object.keys(campos).forEach(function (nombre) {
      if (!validarCampo(nombre) && !primerInvalido) {
        primerInvalido = campos[nombre];
      }
    });

    if (primerInvalido) {
      primerInvalido.focus();
      return;
    }

    var nombre = campos.nombre.value.trim();
    var solicitud = {
      nombre: nombre,
      tienda: campos.tienda.value.trim(),
      rubro: campos.rubro.value,
      whatsapp: '+591' + limpiarNumero(campos.whatsapp.value.trim()),
      fecha: new Date().toISOString()
    };

    if (guardarSolicitud(solicitud)) {
      formulario.reset();
      mostrarMensaje('exito', '¡Listo, ' + nombre + '! Recibimos tu solicitud. Te escribiremos por WhatsApp para activar tu prueba gratis de 15 días.');
    } else {
      mostrarMensaje('error', 'No pudimos guardar tu solicitud en este navegador. Escríbenos por WhatsApp y activamos tu prueba gratis.');
    }
  });
})();
