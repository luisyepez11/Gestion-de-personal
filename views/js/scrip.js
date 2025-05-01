// FUNCIONES DE VALIDACION Y MANIPULACION DE DOM

// Función para mostrar mensajes de error (desaparece después de 5 segundos)
function mostrarError(mensaje) {
    // Eliminar errores previos
    const erroresPrevios = document.querySelectorAll('.error-message');
    erroresPrevios.forEach(error => error.remove());

    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger error-message";
    errorDiv.textContent = mensaje;
    
    const form = document.querySelector("form");
    form.parentNode.insertBefore(errorDiv, form);
    
    // Desaparecer después de 5 segundos
    setTimeout(() => errorDiv.remove(), 5000);
    
    // Desplazarse al mensaje de error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Función para mostrar mensajes de éxito (desaparecen después de 5 segundos)
function mostrarExito(mensaje) {
    const exitoDiv = document.createElement("div");
    exitoDiv.className = "alert alert-success";
    exitoDiv.textContent = mensaje;
    
    const form = document.querySelector("form");
    form.parentNode.insertBefore(exitoDiv, form);
    
    setTimeout(() => exitoDiv.remove(), 5000);
}

// Validación de campos obligatorios
function validarCamposObligatorios() {
    const campos = [
        { id: 'nombre', nombre: 'Nombre' },
        { id: 'apellido', nombre: 'Apellido' },
        { id: 'cedula', nombre: 'Cédula' },
        { id: 'fecha_nacimiento', nombre: 'Fecha de nacimiento' },
        { id: 'fecha_ingreso', nombre: 'Fecha de ingreso' },
        { id: 'direccion', nombre: 'Dirección' },
        { id: 'email', nombre: 'Email' },
        { id: 'telefono', nombre: 'Teléfono' },
        { id: 'rol', nombre: 'Rol' },
        { id: 'especialidad', nombre: 'Especialidad' },
        { id: 'cargo', nombre: 'Cargo' },
        { id: 'sueldo', nombre: 'Sueldo' }
    ];

    for (const campo of campos) {
        const elemento = document.getElementById(campo.id);
        const valor = elemento.value.trim();
        
        if (!valor) {
            mostrarError(`El campo ${campo.nombre} es obligatorio`);
            elemento.focus();
            return false;
        }
    }
    return true;
}

// Validación de nombre y apellido (solo letras)
function soloLetras(event) {
    const key = event.key;
    const esLetra = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key);
    const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    
    if (!esLetra && !teclasPermitidas.includes(key)) {
        event.preventDefault();
    }
}

// Validación para números (cédula)
function soloNumeros(event) {
    const key = event.key;
    const esNumero = /^[0-9]$/.test(key);
    const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    
    if (!esNumero && !teclasPermitidas.includes(key)) {
        event.preventDefault();
    }
}

// primera letra en mayusculas
function capitalizarTexto(texto) {
    if (!texto) return texto;
    
    // Eliminar espacios extras y dividir en palabras
    return texto.trim()
        .toLowerCase()
        .split(/\s+/)
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

// Validación para sueldo (números y punto decimal)
function soloNumerosDecimales(event) {
    const key = event.key;
    const esNumero = /^[0-9.]$/.test(key);
    const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    
    // Evitar múltiples puntos decimales
    if (key === '.' && event.target.value.includes('.')) {
        event.preventDefault();
        return;
    }
    
    if (!esNumero && !teclasPermitidas.includes(key)) {
        event.preventDefault();
    }
}

// Primera letra en mayuscula del nombre y apellido
function capitalizarAlPerderFoco(event) {
    const input = event.target;
    input.value = validarNombreApellido(input.value);
}

// Validación de email en tiempo real
function validarEmailEnTiempoReal(e) {
    const email = this.value;
    const iconoValido = document.createElement('span');
    iconoValido.innerHTML = '&nbsp;<i class="fas fa-check-circle" style="color:green"></i>';
    const iconoInvalido = document.createElement('span');
    iconoInvalido.innerHTML = '&nbsp;<i class="fas fa-times-circle" style="color:red"></i>';
    
    // Eliminar iconos anteriores
    const iconosAnteriores = this.parentNode.querySelectorAll('span, i');
    iconosAnteriores.forEach(icon => icon.remove());
    
    if (validarEmail(email)) {
        this.parentNode.appendChild(iconoValido);
    } else if (email.length > 0) {
        this.parentNode.appendChild(iconoInvalido);
    }
}

// Formatear nombre y apellido
function validarNombreApellido(texto) {
    const soloLetras = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    return soloLetras.toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

function validarCedula(ci) {
    const numero = parseInt(ci, 10);
    return !isNaN(numero) && numero >= 4000000 && numero <= 35000000;
}

function validarTelefono(tel) {
    const regex = /^04\d{9}$/;
    return regex.test(tel);
}

function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email) && 
           !email.startsWith('.') && 
           !email.startsWith('@') && 
           !email.includes('..') && 
           email.split('@')[0].length > 0 && 
           email.split('@')[1].length > 0;
}

function validarFechaNacimiento(fechaNac) {
    const fechaNacimiento = new Date(fechaNac);
    const hoy = new Date();
    const minEdad = new Date();
    minEdad.setFullYear(hoy.getFullYear() - 100); // 100 años atrás
    
    if (fechaNacimiento > hoy) {
        return { valido: false, error: "La fecha de nacimiento no puede ser futura" };
    }
    
    if (fechaNacimiento < minEdad) {
        return { valido: false, error: "La edad no puede ser mayor a 100 años" };
    }
    
    const minEdadLaboral = new Date();
    minEdadLaboral.setFullYear(hoy.getFullYear() - 16);
    if (fechaNacimiento > minEdadLaboral) {
        return { valido: false, error: "El empleado debe tener al menos 16 años" };
    }
    
    return { valido: true };
}

function validarFechaContratacion(fechaCont, fechaNac) {
    const fechaContratacion = new Date(fechaCont);
    const fechaNacimiento = new Date(fechaNac);
    const hoy = new Date();
    const maxAntiguedad = new Date();
    maxAntiguedad.setMonth(hoy.getMonth() - 6); // 6 meses atrás
    
    // No puede ser fecha futura
    if (fechaContratacion > hoy) {
        return { valido: false, error: "La fecha de contratación no puede ser futura" };
    }
    
    // No puede ser más antigua que 6 meses antes de hoy
    if (fechaContratacion < maxAntiguedad) {
        return { valido: false, error: "La fecha de contratación no puede ser anterior a 6 meses antes de hoy" };
    }
    
    // Debe ser posterior a la fecha de nacimiento
    if (fechaContratacion <= fechaNacimiento) {
        return { valido: false, error: "La fecha de contratación debe ser posterior a la fecha de nacimiento" };
    }
    
    // Edad mínima al momento de contratación (16 años)
    let edadContratacion = fechaContratacion.getFullYear() - fechaNacimiento.getFullYear();
    const m = fechaContratacion.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && fechaContratacion.getDate() < fechaNacimiento.getDate())) {
        edadContratacion--;
    }
    
    if (edadContratacion < 16) {
        return { valido: false, error: "El empleado debía tener al menos 16 años al momento de contratación" };
    }
    
    return { valido: true };
}

/***********************
 *  FUNCIONES PRINCIPALES *
 ***********************/

// Función para cargar especialidades y roles al iniciar
async function cargar() {
    try {
        const response = await fetch("http://localhost:8000/api/personal/especialidades");
        const datos = await response.json();
        const especialidades = document.getElementById("especialidad");
        especialidades.innerHTML = '';
        datos.forEach(element => {
            const campos = document.createElement("option");
            campos.value = element.departamento_id;
            campos.textContent = element.nombre;
            especialidades.append(campos);
        });
    } catch(error) {
        console.error('Error al cargar especialidades:', error);
        mostrarError('Error al cargar las especialidades');
    }

    try {
        const response = await fetch("http://localhost:8000/api/personal/roles");
        const datos = await response.json();
        const roles = document.getElementById("rol");
        roles.innerHTML = '';
        datos.forEach(element => {
            const campos = document.createElement("option");
            campos.value = element.rol_id;
            campos.textContent = element.nombre;
            roles.append(campos);
        });
    } catch(error) {
        console.error('Error al cargar roles:', error);
        mostrarError('Error al cargar los roles');
    }
    
}

/***********************
 *  EVENT LISTENERS    *
 ***********************/

// Configuración inicial al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargar();
    
    // Configurar límites de fechas
    const hoy = new Date().toISOString().split('T')[0];
    const maxNacimiento = new Date();
    maxNacimiento.setFullYear(maxNacimiento.getFullYear() - 16); // 16 años atrás
    
    document.getElementById('fecha_nacimiento').max = maxNacimiento.toISOString().split('T')[0];
    document.getElementById('fecha_ingreso').max = hoy;
    
    // Opcional: Establecer mínimo para fecha de nacimiento (100 años)
    const minNacimiento = new Date();
    minNacimiento.setFullYear(minNacimiento.getFullYear() - 100);
    document.getElementById('fecha_nacimiento').min = minNacimiento.toISOString().split('T')[0];
});

// Validaciones en tiempo real para los campos
document.getElementById('nombre').addEventListener('keydown', soloLetras);
document.getElementById('apellido').addEventListener('keydown', soloLetras);
document.getElementById('cedula').addEventListener('keydown', soloNumeros);
document.getElementById('telefono').addEventListener('keydown', soloNumeros);
document.getElementById('sueldo').addEventListener('keydown', soloNumerosDecimales);


//Aplicar mientras escribe (input)
document.getElementById('nombre').addEventListener('input', function(e) {
    if (this.value.length === 1) {
        this.value = this.value.toUpperCase();
    }
});

document.getElementById('apellido').addEventListener('input', function(e) {
    if (this.value.length === 1) {
        this.value = this.value.toUpperCase();
    }
});

// Validación especial para teléfono
document.getElementById('telefono').addEventListener('input', function(e) {
    if (!this.value.startsWith('04')) {
        this.value = '04';
    }
    if (this.value.length > 11) {
        this.value = this.value.slice(0, 11);
    }
});

// Validación de email en tiempo real
document.getElementById('email').addEventListener('input', validarEmailEnTiempoReal);

// Evento principal del botón cargar
document.getElementById("cargar").addEventListener("click", async () => {
    // Validar primero todos los campos obligatorios
    event.preventDefault()
    if (!validarCamposObligatorios()) {
        return;
    }
    // Obtener y formatear valores
    let nombre = capitalizarTexto(document.getElementById("nombre").value.trim());
    let apellido = capitalizarTexto(document.getElementById("apellido").value.trim());
    let direccion = capitalizarTexto(document.getElementById("direccion").value.trim());
    
    // Actualizar los campos en el formulario
    document.getElementById("nombre").value = nombre;
    document.getElementById("apellido").value = apellido;
    document.getElementById("direccion").value = direccion;

    const ci = document.getElementById("cedula").value.trim();
    const fechas_nacimiento = document.getElementById("fecha_nacimiento").value;
    const fecha_contratacion = document.getElementById("fecha_ingreso").value;
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const rol = document.getElementById("rol").value;
    const especialidad = document.getElementById("especialidad").value;
    const cargo = document.getElementById("cargo").value;
    const sueldo = document.getElementById("sueldo").value.trim();
    const sueldoneto = document.getElementById("sueldo-neto").value.trim();
    
    // Validar fechas de nacimiento
    const validacionNacimiento = validarFechaNacimiento(fechas_nacimiento);
    if (!validacionNacimiento.valido) {
        mostrarError(validacionNacimiento.error);
        return;
    }
    
    // Validar fecha de contratación
    const validacionContratacion = validarFechaContratacion(fecha_contratacion, fechas_nacimiento);
    if (!validacionContratacion.valido) {
        mostrarError(validacionContratacion.error);
        return;
    }

    // Validar nombre y apellido
    nombre = validarNombreApellido(nombre);
    apellido = validarNombreApellido(apellido);
    document.getElementById("nombre").value = nombre;
    document.getElementById("apellido").value = apellido;

    // Validar cédula
    if (!validarCedula(ci)) {
        mostrarError("La cédula debe estar entre 4.000.000 y 35.000.000");
        return;
    }

    // Validar teléfono
    if (!validarTelefono(telefono)) {
        mostrarError("El teléfono debe tener 11 dígitos y comenzar con 04 (ej: 04123456789)");
        return;
    }

    // Validar email
    if (!validarEmail(email)) {
        mostrarError("Por favor ingrese un email válido");
        return;
    }

    try {
        // Verificar datos únicos
        const response = await fetch('http://localhost:8000/api/personal/empleados');
        const data = await response.json();
        
        // Extraer todos los datos necesarios
        const cedulas = data.map(item => item.cedula.toString());
        const emails = data.map(item => item.email?.toLowerCase()); // Usamos ?. por si email es null
        const telefonos = data.map(item => item.telefono);
        // Empleado inactivo
        bandera=0
        let cedula_enviada=""
        let telefono_usuario=""
        let email_usuario=""
        let empleado_id=0
        for(const i of data){
            if (i.cedula.toString()==ci.toString() && i.estado=="Inactivo"){
                alert("este empleado ya fue contratado antes")
                cedula_enviada=ci.toString()
                telefono_usuario=i.telefono
                email_usuario=i.email
                empleado_id=i.empleado_id
                bandera=1
            }
        }
        if(bandera==0){
        // 1. Validar cédula única
        if (cedulas.includes(ci.toString())) {
            mostrarError("Esta cédula ya está registrada");
            return;
        }
        
        // 2. Validar email único (si se proporcionó)
        if (email && emails.includes(email.toLowerCase())) {
            mostrarError("Este correo electrónico ya está registrado");
            return;
        }
        // 3. Validar teléfono único
        if (telefonos.includes(telefono)) {
            mostrarError("Este número de teléfono ya está registrado");
            return;
        }
        const turno = obtenerTurnosSeleccionados();
        const dias= obtenerDiasSeleccionados();
        const cuenta =document.getElementById("cuenta").value;
        const area=document.getElementById("area").value;
        const descripcion_empleado=document.getElementById("descripcion_empleado").value


        // Preparar y enviar datos al servidor
        const empleadoData = {
            nombre: nombre,
            apellido: apellido,
            cedula: ci,
            fecha_nacimiento: fechas_nacimiento,
            fecha_contratacion: fecha_contratacion,
            direccion: direccion,
            email: email,
            telefono: telefono,
            rol_id: rol,
            departamento_id: especialidad,
            cargo: cargo,
            sueldo: sueldo,
            salario_neto: sueldoneto,
            numero_cuenta:cuenta,
            turno:turno,
            dia:dias,
            area:area,
            descripcion_empleado:descripcion_empleado,
        };

        const postResponse = await fetch('http://localhost:8000/api/personal/empleados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(empleadoData)
        });
        
        if (!postResponse.ok) {
            throw new Error('Error al registrar empleado');
        }

        const result = await postResponse.json();

        if (result) {
           mostrarExito(`El empleado ${empleadoData.nombre} ${empleadoData.apellido} ha sido registrado con éxito.`);
        }

        }else{
            activacion(email_usuario,telefono_usuario,cedula_enviada,empleado_id)
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al registrar empleado: ' + error.message);
    }
});

document.getElementById("agregar-rol").addEventListener("click",()=>{
    document.getElementById("ventana-rol").showModal();
});

document.getElementById("cargar-especialidad").addEventListener("click",()=>{
    document.getElementById("ventana-especialidad").showModal();
});

document.getElementById("confirmar-rol").addEventListener("click", async () => {
    document.getElementById("ventana-rol").close();
    const nombre = document.getElementById("nombre-rol").value;
    const descripcion = document.getElementById("descripcion-rol").value;
    const rolData = {
        nombre: nombre,
        descripcion: descripcion,
    };
    
    const postResponse = await fetch('http://localhost:8000/api/personal/roles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(rolData)
    });
    cargar();
    document.getElementById("nombre-rol").value = '';
    document.getElementById("descripcion-rol").value = '';
});
//confirmar-especialidad
document.getElementById("confirmar-especialidad").addEventListener("click", async () => {
    document.getElementById("ventana-especialidad").close();
    const nombre = document.getElementById("nombre-especialidad").value;
    const descripcion = document.getElementById("descripcion-especialidad").value;
    const especialidadData = {
        nombre: nombre,
        descripcion: descripcion,
    };
    const postResponse = await fetch('http://localhost:8000/api/personal/especialidades', {
        
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(especialidadData)
    });
    cargar();
    document.getElementById("nombre-especialidad").value = '';
    document.getElementById("descripcion-especialidad").value = '';
});

document.getElementById("ventana-especialidad").addEventListener("close",()=>{
    cargar();
    document.getElementById("nombre-especialidad").value = '';
    document.getElementById("descripcion-especialidad").value = '';
});

document.getElementById("ventana-rol").addEventListener("close",()=>{
    cargar();
    document.getElementById("nombre-rol").value = '';
    document.getElementById("descripcion-rol").value = '';
});

document.getElementById("cancelar-rol").addEventListener("click",()=>{
    document.getElementById("ventana-rol").close();
});

document.getElementById("cancelar-especialidad").addEventListener("click",()=>{
    document.getElementById("ventana-especialidad").close();
});

function obtenerDiasSeleccionados() {
    const checkboxes = document.querySelectorAll('.dia-checkbox');
    
    const diasSeleccionados = Array.from(checkboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    return diasSeleccionados.join(', ');
}

function marcarDiasSeleccionados(diasString) {
    document.querySelectorAll('.dia-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  
    if (!diasString || diasString.trim() === '') return;
  
    const dias = diasString.split(',').map(dia => dia.trim());

    dias.forEach(dia => {
      const checkbox = document.querySelector(`.dia-checkbox[value="${dia}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
}

function extraerNombreUsuario(correo) {

    if (typeof correo !== 'string' || !correo.includes('@')) {
        return correo; 
    }

    const partes = correo.split('@');

    return partes[0];
}

function obtenerTurnosSeleccionados() {
    const turnos = [];
    
    document.querySelectorAll('.dia-turno-item').forEach(item => {
      const checkbox = item.querySelector('.dia-checkbox');
      const select = item.querySelector('.turno-select');
      turnos.push(checkbox.checked ? select.value : "No asiste");
    });
    
    return turnos.join(', ');
  }
  async function activacion(email_usuario,telefono_usuario,cedula_enviada,empleado_id){
    // Validar primero todos los campos obligatorios
    if (!validarCamposObligatorios()) {
        return;
    }
    // Obtener y formatear valores
    let nombre = capitalizarTexto(document.getElementById("nombre").value.trim());
    let apellido = capitalizarTexto(document.getElementById("apellido").value.trim());
    let direccion = capitalizarTexto(document.getElementById("direccion").value.trim());
    
    // Actualizar los campos en el formulario
    document.getElementById("nombre").value = nombre;
    document.getElementById("apellido").value = apellido;
    document.getElementById("direccion").value = direccion;

    const ci = document.getElementById("cedula").value.trim();
    const fechas_nacimiento = document.getElementById("fecha_nacimiento").value;
    const fecha_contratacion = document.getElementById("fecha_ingreso").value;
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const rol = document.getElementById("rol").value;
    const especialidad = document.getElementById("especialidad").value;
    const cargo = document.getElementById("cargo").value;
    const sueldo = document.getElementById("sueldo").value.trim();
    const sueldoneto = document.getElementById("sueldo-neto").value.trim();
    const area=document.getElementById("area").value;
    
    // Validar fechas de nacimiento
    const validacionNacimiento = validarFechaNacimiento(fechas_nacimiento);
    if (!validacionNacimiento.valido) {
        mostrarError(validacionNacimiento.error);
        return;
    }
    
    // Validar fecha de contratación
    const validacionContratacion = validarFechaContratacion(fecha_contratacion, fechas_nacimiento);
    if (!validacionContratacion.valido) {
        mostrarError(validacionContratacion.error);
        return;
    }

    // Validar nombre y apellido
    nombre = validarNombreApellido(nombre);
    apellido = validarNombreApellido(apellido);
    document.getElementById("nombre").value = nombre;
    document.getElementById("apellido").value = apellido;

    // Validar cédula
    if (!validarCedula(ci)) {
        mostrarError("La cédula debe estar entre 4.000.000 y 35.000.000");
        return;
    }

    // Validar teléfono
    if (!validarTelefono(telefono)) {
        mostrarError("El teléfono debe tener 11 dígitos y comenzar con 04 (ej: 04123456789)");
        return;
    }

    // Validar email
    if (!validarEmail(email)) {
        mostrarError("Por favor ingrese un email válido");
        return;
    }

    try {
        // Verificar datos únicos
    const response = await fetch('http://localhost:8000/api/personal/empleados');
    const data = await response.json();
    
    // Extraer todos los datos necesarios
    const cedulas = data.filter(item => item.cedula?.toString() != cedula_enviada).map(item => item.cedula.toString());
    const emails = data.filter(item => item.email?.toLowerCase() != email_usuario).map(item => item.email?.toLowerCase()); // Usamos ?. por si email es null
    const telefonos = data.filter(item => item.telefono != telefono_usuario).map(item => item.telefono);

    // 1. Validar cédula única
    if (cedulas.includes(ci.toString())) {
        mostrarError("Esta cédula ya está registrada");
        return;
    }
    
    // 2. Validar email único (si se proporcionó)
    if (email && emails.includes(email.toLowerCase())) {
        mostrarError("Este correo electrónico ya está registrado");
        return;
    }
    
    // 3. Validar teléfono único
    if (telefonos.includes(telefono)) {
        mostrarError("Este número de teléfono ya está registrado");
        return;
    }
    const dia= obtenerDiasSeleccionados();
    const turno = obtenerTurnosSeleccionados();
    const descripcion_empleado=document.getElementById("descripcion_empleado").value
    const cuenta =document.getElementById("cuenta").value;

    const empleadoData = {
        id: empleado_id,  
        nombre: nombre,
        apellido: apellido,
        cedula: ci,
        fecha_nacimiento: fechas_nacimiento,
        fecha_contratacion: fecha_contratacion,
        direccion: direccion,
        email: email,
        telefono: telefono,
        rol_id: rol,
        departamento_id: especialidad,
        cargo: cargo,
        sueldo: sueldo,
        salario_neto: sueldoneto,
        cuenta: cuenta ,
        turno:turno,
        dia:dia,
        area:area,
        estado:"Activo",
        descripcion_empleado:descripcion_empleado
    };

        const putResponse = await fetch(`http://localhost:8000/api/personal/empleados/activacion/${empleado_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(empleadoData)
        });

        if (!putResponse.ok) {
            throw new Error('Error al Recontratar empleado');
        }

        const result = await putResponse.json();

        if (putResponse.ok) {
            mostrarExito(`El empleado ${empleadoData.nombre} ${empleadoData.apellido} ha sido Recontratado con éxito.`);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al Recontratar empleado: ' + error.message);
    }
    
}