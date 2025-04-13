let cedulas=[]
async function cargar(){
    try{
    const response = await fetch("http://localhost:6500/especialidades")
    const datos= await response.json();
    const especialidades= document.getElementById("especialidad")
    especialidades.innerHTML = '';
    datos.forEach(element => {
        const campos = document.createElement("option");
        campos.value=element.departamento_id;
        campos.textContent=element.nombre;
        especialidades.append(campos)
    });
    }catch(error){
        console.error('Error al cargar los datos:', error);
    }

    try{
        const response = await fetch("http://localhost:6500/roles")
        const datos= await response.json();
        const especialidades= document.getElementById("rol")
        especialidades.innerHTML = '';
        datos.forEach(element => {
            const campos = document.createElement("option");
            campos.value=element.rol_id;
            campos.textContent=element.nombre;
            especialidades.append(campos)
        });
        }catch(error){
            console.error('Error al cargar los datos:', error);
        }
}
cargar();
document.getElementById("cargar").addEventListener("click",async ()=>{
    const nombre=document.getElementById("nombre").value;
    const apellido=document.getElementById("apellido").value;
    const ci=document.getElementById("cedula").value;
    const fechas_nacimiento=document.getElementById("fecha_nacimiento").value;
    const fecha_contratacion=document.getElementById("fecha_ingreso").value;
    const direccion=document.getElementById("direccion").value;
    const email=document.getElementById("email").value;
    const telefono=document.getElementById("telefono").value;
    const rol= document.getElementById("rol").value;
    const especialidad=document.getElementById("especialidad").value;
    const cargo=document.getElementById("cargo").value;
    const sueldo=document.getElementById("sueldo").value;
    try{
        const response = await fetch('http://localhost:6500/empleados');
        cedulas=[]
        const data = await response.json();
        data["rows"].forEach(item => {
            cedulas.push(item.cedula)
        });
        console.log(cedulas.length)
        let bandera=0
        cedulas.forEach(campos =>{
            if (campos==ci){
                alert("Esta cedula ya esta registrada")
                bandera=1
            }
        });
        if (bandera==0){
            try {
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
                    sueldo: sueldo
                };
                
                const response = await fetch('http://localhost:6500/empleados', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(empleadoData)
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const result = await response.json();
                console.log('Empleado registrado:', result);
                alert('Empleado registrado con éxito');
                
                document.getElementById("nombre").value = '';
                document.getElementById("apellido").value = '';
                document.getElementById("cedula").value = '';

        
            } catch (error) {
                console.error('Error al registrar empleado:', error);
                alert('Error al registrar empleado: ' + error.message);
            }
        }
    }
    catch(error){
        console.error('Error al cargar los datos:', error);
    }
})