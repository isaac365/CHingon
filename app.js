// app.js
$(document).ready(function() {
  let currentUser = null;

  // Función de notificaciones
  function showNotification(message, type) {
    const colors = {
      success: '#28A745',
      error: '#DC3545',
      warning: '#FFC107',
      info: '#3498DB'
    };

    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: colors[type] || '#6C757D',
      stopOnFocus: true
    }).showToast();
  }

  // Login
  // app.js
  $(document).ready(function() {
    let currentUser = null;

    // Función de notificaciones (idéntica a la tuya)
    function showNotification(message, type) {
      const colors = {
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        info: '#3498DB'
      };
      Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: colors[type] || '#6C757D',
        stopOnFocus: true
      }).showToast();
    }

    // ==== REEMPLAZAMOS AQUÍ EL BLOQUE "Login" PARA LLAMAR AL BACKEND NODE ====
    $('#login-form').on('submit', function(e) {
      e.preventDefault();
      const email = $('#email').val().trim();
      const password = $('#password').val().trim();
      const role = $('.role-btn.active').data('role');

      if (!email || !password) {
        !email && $('#email').addClass('is-invalid');
        !password && $('#password').addClass('is-invalid');
        return;
      }

      $('#loader').show();

      $.ajax({
        url: 'http://localhost:3000/auth/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password }),
        success(res) {
          $('#loader').hide();

          // Si el backend devolvió un error:
          if (res.error) {
            showNotification(res.error, 'error');
            return;
          }

          // Login OK: guardamos datos del usuario
          // Puedes también guardar el token si lo necesitas:
          // localStorage.setItem('jwtToken', res.token);
          currentUser = {
            id: res.id,
            email: res.email,
            role: res.rol,
            name: res.nombre
          };

          // Ocultamos la pantalla de login y mostramos el app principal
          $('#auth-screen').hide();
          $('#app-main').show();
          $('#user-name').text(currentUser.name);

          // Esperamos unos milisegundos y luego mostramos la vista por rol
          setTimeout(() => {
            $('.estudiante-sidebar, .psicologo-sidebar, .admin-sidebar').hide();
            $('.estudiante-view, .psicologo-view, .admin-view').hide();

            if (currentUser.role === 'estudiante') {
              $('.estudiante-sidebar, .estudiante-view').show();
              initializeEstudianteCalendar();
              loadStudentDashboard();    // función que obtiene citas y pinta historial
            }
            else if (currentUser.role === 'psicologo') {
              $('.psicologo-sidebar, .psicologo-view').show();
              initializePsicologoCalendar();
              loadPsicologoDashboard();  // función que carga datos específicos de psicólogo
            }
            else { // administrador
              $('.admin-sidebar, .admin-view').show();
              initializeAdminCharts();
            }
          }, 50);

          showNotification(`¡Bienvenido ${currentUser.name}!`, 'success');
        },
        error(xhr) {
          $('#loader').hide();
          // Si el servidor devolvió JSON con { error: "..."}:
          let msg = 'Error en el servidor';
          if (xhr.responseJSON && xhr.responseJSON.error) {
            msg = xhr.responseJSON.error;
          }
          showNotification(msg, 'error');
        }
      });
    });
    // ======================================================================

    // … EL RESTO DE TU app.js VA IGUAL …
    // Por ejemplo, las funciones initializeEstudianteCalendar(), initializePsicologoCalendar(),
    // initializeAdminCharts(), loadStudentDashboard(), loadPsicologoDashboard(), etc.
    //           ↑
    // A continuación te muestro ejemplos de cómo implementar loadStudentDashboard()
    // y algunos “placeholders” para el psicólogo.

    // Ejemplo de “cargar historial + próxima cita” para estudiante
    function loadStudentDashboard() {
      // 1) Obtener historial de citas vía GET /appointments?estudiante_id=...
      $.ajax({
        url: `http://localhost:3000/appointments?estudiante_id=${currentUser.id}`,
        method: 'GET',
        success(citas) {
          // citas es un array de objetos:
          // [{ id, fecha, hora_inicio, hora_fin, estado, tipo_cita, psicologo_nombre }, ...]

          // Si quieres mostrar “Próxima Cita”, podrías buscar la primera que NO esté completada.
          // Aquí un ejemplo muy sencillo (ordena por fecha/hora, aunque el backend ya la ordena):
          if (Array.isArray(citas) && citas.length) {
            // Supongamos que la cita más reciente está en citas[0]
            const next = citas[0];
            $('#next-appointment-info').text(
              `${next.fecha} ${next.hora_inicio} con ${next.psicologo_nombre} (${next.estado})`
            );
          } else {
            $('#next-appointment-info').text('No tienes citas programadas.');
          }

          // 2) Pintar “Historial de Citas”:
          $('#appointment-history').empty();
          citas.forEach(cita => {
            const estadoBadge = {
              'programada': 'bg-primary',
              'confirmada': 'bg-info',
              'completada': 'bg-success',
              'cancelada': 'bg-danger'
            }[cita.estado] || 'bg-secondary';

            $('#appointment-history').append(`
            <li class="appointment-item">
              <div class="d-flex justify-content-between">
                <h5 class="mb-1">${cita.tipo_cita.charAt(0).toUpperCase() + cita.tipo_cita.slice(1)}</h5>
                <span class="badge ${estadoBadge}">${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}</span>
              </div>
              <p class="mb-1"><i class='bx bx-calendar me-2'></i>${cita.fecha}</p>
              <p class="mb-1"><i class='bx bx-time me-2'></i>${cita.hora_inicio} - ${cita.hora_fin}</p>
              <p class="mb-0"><i class='bx bx-user me-2'></i>${cita.psicologo_nombre}</p>
            </li>
          `);
          });
        },
        error() {
          showNotification('Error al obtener historial de citas', 'error');
        }
      });
    }

    // Ejemplo de función para el psicólogo (cargar datos)
    function loadPsicologoDashboard() {
      // 1) Podrías querer cargar las citas del día via GET /appointments?psicologo_id=...
      // 2) O bien la disponibilidad via GET /availability?psicologo_id=...
      // 3) Luego pintas esas cajas en la vista del psicólogo.
      // Aquí te dejo un placeholder:
      $.ajax({
        url: `http://localhost:3000/availability?psicologo_id=${currentUser.id}`,
        method: 'GET',
        success(lista) {
          // Por ejemplo, en consola:
          console.log('Disponibilidad del psicólogo:', lista);
          // y luego pintas en tu UI:
          //   - eventClick → enlaces a notas de sesión
          //   - daily-agenda → pintar citas confirmadas/hoy
        },
        error() {
          showNotification('Error al cargar disponibilidad psicólogo', 'error');
        }
      });
    }

    // ------------------------------------------------------------------------------------------------
    // Ahora el resto del código (initializeEstudianteCalendar, initializePsicologoCalendar, etc.) queda igual
    // Solo que cuando llames a “Solicitar Cita” o “Ver Disponibilidad”, también harás AJAX a:
    //   POST   /appointments          ← para agendar realmente
    //   GET    /availability         ← para ver franjas del psicólogo
    //   POST   /availability         ← para que el psicólogo agregue franjas
    //   GET    /session-notes?cita_id=…  ← para ver notas
    //   POST   /session-notes        ← para guardar notas
    //   GET    /recursos             ← para cargar recursos
    // Ejemplo rápido para “Solicitar Cita”:
    $('#content-area').on('click', '.estudiante-view .btn-primary-custom:contains("Solicitar Cita")', function(e) {
      e.preventDefault();
      // Suponemos que ya tienes un modal o formulario donde el usuario elige:
      // psicologo_id, fecha, hora_inicio, hora_fin, tipo_cita y motivo.
      // En este ejemplo lo “hardcodeamos” para demostrar:
      const payload = {
        estudiante_id: currentUser.id,
        psicologo_id: 2,                   // reemplaza por el ID real del psicólogo
        fecha: '2025-06-10',
        hora_inicio: '10:00',
        hora_fin: '11:00',
        tipo_cita: 'primera',
        motivo: 'Ansiedad'
      };
      $('#loader').show();
      $.ajax({
        url: 'http://localhost:3000/appointments',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success(res) {
          $('#loader').hide();
          if (res.success) {
            showNotification('Cita solicitada correctamente', 'success');
            loadStudentDashboard(); // refrescar historial/próxima cita
            // Además, si quieres recargar el calendario:
            const calEl = document.getElementById('estudiante-calendar');
            if (calEl && calEl.calendar) {
              calEl.calendar.refetchEvents();
            }
          } else {
            showNotification(res.error || 'Error al solicitar cita', 'error');
          }
        },
        error() {
          $('#loader').hide();
          showNotification('Error en el servidor al solicitar cita', 'error');
        }
      });
    });

    // Ejemplo para “Ver Disponibilidad”:
    $('#content-area').on('click', '.estudiante-view .btn-primary-custom:contains("Ver Disponibilidad")', function(e) {
      e.preventDefault();
      // Aquí deberías saber el psicólogo_id que quieres consultar.
      // Por simplicidad, usaremos el ID=2 otra vez:
      $('#loader').show();
      $.ajax({
        url: 'http://localhost:3000/availability?psicologo_id=2',
        method: 'GET',
        success(lista) {
          $('#loader').hide();
          console.table(lista); // mira en consola las franjas
          showNotification('Disponibilidad cargada, revisa la consola', 'info');
          // Luego pintarías esas franjas en el calendario (usando FullCalendar
          // con eventSource apuntando a la ruta /calendar?psicologo_id=2).
        },
        error() {
          $('#loader').hide();
          showNotification('Error al cargar disponibilidad', 'error');
        }
      });
    });

    // ------------------------------------------------------------------------------------------------
    // El resto de tus handlers puede quedar igual, solo cambia simulaciones por llamadas reales.
    // Por ejemplo, en “Historial de Citas” antes usabas setTimeout: ahora ya loadStudentDashboard()
    // ------------------------------------------------------------------------------------------------

    // Calendario Estudiante (igual que antes)
    function initializeEstudianteCalendar() {
      const calendarEl = document.getElementById('estudiante-calendar');
      if (!calendarEl) return;

      if (calendarEl.calendar) calendarEl.calendar.destroy();

      calendarEl.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        },
        locale: 'es',
        // Ahora cargamos eventos desde el backend:
        events: function(fetchInfo, successCallback, failureCallback) {
          // fetchInfo tiene .startStr y .endStr (rangos de fecha que pide FullCalendar)
          // Llamamos a GET /calendar?psicologo_id=... O a /appointments?estudiante_id=...
          // según quieras pintar disponibilidad o citas
          // En este ejemplo, pintamos "disponibilidad" (usando psicólogo_id=2):
          $.ajax({
            url: 'http://localhost:3000/calendar?psicologo_id=2',
            method: 'GET',
            success(events) {
              successCallback(events);
            },
            error() {
              failureCallback();
            }
          });
        },
        eventDidMount: function(info) {
          info.el.style.opacity = 1;
        }
      });

      calendarEl.calendar.render();
      calendarEl.calendar.updateSize();
    }

    // Calendario Psicólogo (similar)
    function initializePsicologoCalendar() {
      const calendarEl = document.getElementById('psicologo-calendar');
      if (!calendarEl) return;

      if (calendarEl.calendar) calendarEl.calendar.destroy();

      calendarEl.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          right: ''
        },
        locale: 'es',
        height: 330,
        events: function(fetchInfo, successCallback, failureCallback) {
          // Pintamos disponibilidad del psicólogo logueado:
          $.ajax({
            url: `http://localhost:3000/calendar?psicologo_id=${currentUser.id}`,
            method: 'GET',
            success(events) {
              successCallback(events);
            },
            error() {
              failureCallback();
            }
          });
        },
        datesSet: function() {
          this.updateSize();
        }
      });

      calendarEl.calendar.render();
      calendarEl.calendar.updateSize();
    }

    // Resto de funciones (initializeAdminCharts, etc.) sin cambios...
    function initializeAdminCharts() {
      new Chart(document.getElementById('appointments-chart'), {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Citas 2023',
            data: [65, 78, 90, 81, 95, 110],
            borderColor: '#8E1B3F',
            tension: 0.3
          }]
        }
      });

      new Chart(document.getElementById('majors-chart'), {
        type: 'doughnut',
        data: {
          labels: ['Ing. Informática', 'Ing. Industrial', 'Administración'],
          datasets: [{
            data: [40, 35, 25],
            backgroundColor: ['#8E1B3F', '#3498DB', '#28A745']
          }]
        }
      });
    }
  });


  // Calendario Estudiante
  function initializeEstudianteCalendar() {
    const calendarEl = document.getElementById('estudiante-calendar');
    if (!calendarEl) return;

    if (calendarEl.calendar) calendarEl.calendar.destroy();

    calendarEl.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      locale: 'es',
      events: [{
        title: 'Disponible',
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 3)),
        className: 'available'
      }],
      eventDidMount: function(info) {
        info.el.style.opacity = 1;
      }
    });

    calendarEl.calendar.render();
    calendarEl.calendar.updateSize();
  }

  // Calendario Psicólogo
  function initializePsicologoCalendar() {
    const calendarEl = document.getElementById('psicologo-calendar');
    if (!calendarEl) return;

    if (calendarEl.calendar) calendarEl.calendar.destroy();

    calendarEl.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: ''
      },
      locale: 'es',
      height: 330,
      events: [{
        title: 'Disponible',
        start: new Date(),
        className: 'available'
      }],
      datesSet: function() {
        this.updateSize();
      }
    });

    calendarEl.calendar.render();
    calendarEl.calendar.updateSize();
  }

  // Gráficas Admin
  function initializeAdminCharts() {
    new Chart(document.getElementById('appointments-chart'), {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Citas 2023',
          data: [65, 78, 90, 81, 95, 110],
          borderColor: '#8E1B3F',
          tension: 0.3
        }]
      }
    });

    new Chart(document.getElementById('majors-chart'), {
      type: 'doughnut',
      data: {
        labels: ['Ing. Informática', 'Ing. Industrial', 'Administración'],
        datasets: [{
          data: [40, 35, 25],
          backgroundColor: ['#8E1B3F', '#3498DB', '#28A745']
        }]
      }
    });
  }

  // Selector de rol
  $('.role-btn').on('click', function() {
    $('.role-btn').removeClass('active');
    $(this).addClass('active');
    $('#show-register').toggle($(this).data('role') === 'estudiante');
  });

  // Logout
  $('#logout-btn').on('click', function() {
    $('#loader').show();
    setTimeout(() => {
      $('#app-main').hide();
      $('#auth-screen').show();
      $('form')[0].reset();
      $('#loader').hide();
      showNotification('Sesión cerrada correctamente', 'info');
    }, 1000);
  });

  // Sidebar móvil
  $('#sidebar-toggle').on('click', function() {
    $('#sidebar').toggleClass('show');
    $('#content-area').toggleClass('pushed');
  });

  // Expediente clínico
  $('#record-toggle').on('click', function() {
    $('#record-body').slideToggle();
    $(this).find('i').toggleClass('bx-chevron-down bx-chevron-up');
  });

  // Registro estudiante
  $('#show-register').on('click', function() {
    $('#login-form, #show-register').hide();
    $('#register-form').show();
  });

  $('#back-to-login').on('click', function() {
    $('#register-form').hide();
    $('#login-form, #show-register').show();
  });

  // Validación formulario registro
  $('#register-form').on('submit', function(e) {
    e.preventDefault();
    const requiredFields = $('#reg-carrera, #reg-semestre, #reg-caso, #reg-boleta, #reg-password');
    let isValid = true;

    requiredFields.each(function() {
      if (!$(this).val()) {
        $(this).addClass('is-invalid');
        isValid = false;
      }
    });

    if (!isValid) return;

    $('#loader').show();
    setTimeout(() => {
      $('#loader').hide();
      showNotification('Registro exitoso. Verifica tu correo.', 'success');
      $('#back-to-login').click();
    }, 2000);
  });

  // Botones estudiante
  $('#content-area').on('click', '.estudiante-view .btn-primary-custom', function(e) {
    e.preventDefault();
    const action = $(this).text().trim();
    $('#loader').show();

    if (action === 'Solicitar Cita') {
      setTimeout(() => {
        $('#loader').hide();
        showNotification('Cita solicitada correctamente', 'success');
      }, 1200);
    } else if (action === 'Ver Disponibilidad') {
      setTimeout(() => {
        $('#loader').hide();
        showNotification('Disponibilidad actualizada', 'info');
      }, 1200);
    } else if (action === 'Recursos') {
      setTimeout(() => {
        $('#loader').hide();
        showNotification('Cargando recursos...', 'info');
      }, 800);
    } else {
      $('#loader').hide();
    }
  });

  // Acciones psicólogo
  $('#content-area').on('click', '#daily-agenda button', function() {
    const $btn = $(this);
    const action = $btn.find('i').attr('class').split(' ')[1];

    $('#loader').show();
    if (action === 'bx-check') {
      setTimeout(() => {
        $('#loader').hide();
        showNotification('Acción confirmada', 'success');
      }, 1000);
    } else if (action === 'bx-edit') {
      setTimeout(() => {
        $('#loader').hide();
        showNotification('Edición habilitada', 'warning');
      }, 1000);
    } else if (action === 'bx-trash') {
      setTimeout(() => {
        $('#loader').hide();
        $btn.closest('.appointment-item').remove();
        showNotification('Cita eliminada', 'error');
      }, 1000);
    }
  });

  // Acciones admin
  $('.admin-view').on('click', '.btn-primary-custom:contains("Nuevo Usuario")', function() {
    $('#loader').show();
    setTimeout(() => {
      $('#loader').hide();
      showNotification('Formulario de nuevo usuario', 'info');
    }, 800);
  });

  $('.admin-view').on('submit', '.custom-form', function(e) {
    e.preventDefault();
    $('#loader').show();
    setTimeout(() => {
      $('#loader').hide();
      showNotification('Reporte generado', 'success');
    }, 1500);
  });

  // Validación en tiempo real
  $('input, select').on('input', function() {
    $(this).removeClass('is-invalid');
  });

  // Notas de sesión
  $('#session-note-form').on('submit', function(e) {
    e.preventDefault();
    showNotification('Nota guardada correctamente', 'success');
  });

  // Historial de citas
  $('.estudiante-sidebar').on('click', '[data-view="history"]', function(e) {
    e.preventDefault();
    $('#loader').show();
    setTimeout(() => {
      $('#loader').hide();
      $('#appointment-history').html(`
                <li class="appointment-item">
                    <div class="d-flex justify-content-between">
                        <h5 class="mb-1">Consulta Reciente</h5>
                        <span class="badge bg-success">Completada</span>
                    </div>
                    <p><i class='bx bx-calendar me-2'></i>${new Date().toLocaleDateString()}</p>
                    <p><i class='bx bx-time me-2'></i>09:00 - 10:00</p>
                </li>
            `);
      showNotification('Historial actualizado', 'success');
    }, 1300);
  });
});
