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
