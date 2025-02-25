// Datos iniciales
let students = JSON.parse(localStorage.getItem('students')) || [];
let currentStudent = JSON.parse(localStorage.getItem('currentStudent')) || null;
let isAdmin = JSON.parse(localStorage.getItem('isAdmin')) || false;
const adminPin = "1234"; // PIN de administrador

// Función para guardar datos en localStorage
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin));
}

// Convertir archivo a base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

// Mostrar modal de bienvenida
function showWelcomeModal(name) {
    const modal = document.getElementById('welcome-modal');
    const message = document.getElementById('modal-welcome-message');
    message.textContent = `Bienvenido, ${name}!`;
    modal.style.display = 'flex';

    // Cerrar la modal después de 1 segundo
    setTimeout(() => {
        modal.style.display = 'none';
    }, 1000); // 1000 ms = 1 segundo
}

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
    });
});

// Validar campos de entrada
function validateInputs(studentName, studentGrade, studentPin) {
    if (!studentName || !studentGrade || !studentPin) {
        alert("Por favor, complete todos los campos.");
        return false;
    }
    if (studentPin.length !== 4 || isNaN(studentPin)) {
        alert("El PIN debe ser un número de 4 dígitos.");
        return false;
    }
    return true;
}

// Iniciar sesión del estudiante
document.getElementById('login-btn').addEventListener('click', function() {
    const studentName = document.getElementById('student-name').value.trim();
    const studentGrade = document.getElementById('student-grade').value.trim();
    const studentPin = document.getElementById('student-pin').value.trim();

    if (validateInputs(studentName, studentGrade, studentPin)) {
        let student = students.find(s => s.name === studentName && s.grade === studentGrade);
        if (!student) {
            student = {
                name: studentName,
                grade: studentGrade,
                pin: studentPin, // Guardar el PIN
                tasks: []
            };
            students.push(student);
            saveData();
        }

        currentStudent = student;
        saveData(); // Guardar el estudiante actual
        document.getElementById('login-interface').style.display = 'none';
        document.getElementById('student-interface').style.display = 'block';
        document.getElementById('switch-interface').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block'; // Mostrar botón de cerrar sesión
        showWelcomeModal(studentName);

        // Mostrar alerta de SweetAlert2
        Swal.fire({
            title: '¡Éxito!',
            text: 'Has iniciado sesión correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });
    }
});

// Subir tareas
document.querySelectorAll('.upload-btn').forEach(button => {
    button.addEventListener('click', function() {
        if (!currentStudent) {
            alert("Por favor, inicie sesión primero.");
            return;
        }

        const course = this.closest('.course-card').getAttribute('data-course');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*, .pdf, .doc, .docx';
        fileInput.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await fileToBase64(file);
                    const task = {
                        id: currentStudent.tasks.length + 1,
                        course: course,
                        file: {
                            name: file.name,
                            type: file.type,
                            base64: base64 // Guardar el archivo en base64
                        },
                        grade: null,
                        comment: null
                    };

                    currentStudent.tasks.push(task);
                    saveData();
                    alert("Archivo subido correctamente.");
                } catch (error) {
                    console.error("Error al convertir el archivo a base64:", error);
                    alert("Hubo un error al subir el archivo. Inténtalo de nuevo.");
                }
            }
        };
        fileInput.click();
    });
});

// Tomar fotos
document.querySelectorAll('.take-photo-btn').forEach(button => {
    button.addEventListener('click', function() {
        if (!currentStudent) {
            alert("Por favor, inicie sesión primero.");
            return;
        }

        const course = this.closest('.course-card').getAttribute('data-course');
        const video = document.createElement('video');
        video.setAttribute('autoplay', true);
        video.setAttribute('playsinline', true);
        document.body.appendChild(video);

        // Acceder a la cámara
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                video.srcObject = stream;
                const captureButton = document.createElement('button');
                captureButton.textContent = 'Capturar Foto';
                document.body.appendChild(captureButton);

                captureButton.addEventListener('click', async function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const context = canvas.getContext('2d');
                    context.drawImage(video, 0, 0);

                    canvas.toBlob(async blob => {
                        try {
                            const base64 = await fileToBase64(blob);
                            const task = {
                                id: currentStudent.tasks.length + 1,
                                course: course,
                                file: {
                                    name: 'foto.jpg',
                                    type: 'image/jpeg',
                                    base64: base64 // Guardar la foto en base64
                                },
                                grade: null,
                                comment: null
                            };

                            currentStudent.tasks.push(task);
                            saveData();
                            alert("Foto subida correctamente.");
                        } catch (error) {
                            console.error("Error al convertir la foto a base64:", error);
                            alert("Hubo un error al capturar la foto. Inténtalo de nuevo.");
                        }
                    }, 'image/jpeg');

                    // Limpiar
                    stream.getTracks().forEach(track => track.stop());
                    video.remove();
                    captureButton.remove();
                });
            }).catch(error => {
                console.error("Error accediendo a la cámara: ", error);
                alert("No se pudo acceder a la cámara. Asegúrate de permitir el acceso.");
            });
    });
});

// Ver archivos subidos en un curso (para estudiantes)
document.querySelectorAll('.view-files-btn').forEach(button => {
    button.addEventListener('click', function() {
        if (!currentStudent) {
            alert("Por favor, inicie sesión primero.");
            return;
        }

        const course = this.closest('.course-card').getAttribute('data-course');
        const files = currentStudent.tasks
            .filter(task => task.course === course && task.file && !task.file.type.startsWith('image')) // Solo archivos, no imágenes
            .map(task => task.file);

        if (files.length === 0) {
            alert("No hay archivos subidos en este curso.");
            return;
        }

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.overflowY = 'auto';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cerrar';
        closeButton.style.marginTop = '10px';
        closeButton.addEventListener('click', function() {
            modal.remove();
        });

        files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.style.marginBottom = '10px';

            const link = document.createElement('a');
            link.href = file.base64;
            link.textContent = file.name;
            link.download = file.name;
            fileDiv.appendChild(link);

            modalContent.appendChild(fileDiv);
        });

        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    });
});

// Ver fotos subidas en un curso (para estudiantes)
document.querySelectorAll('.view-photos-btn').forEach(button => {
    button.addEventListener('click', function() {
        if (!currentStudent) {
            alert("Por favor, inicie sesión primero.");
            return;
        }

        const course = this.closest('.course-card').getAttribute('data-course');
        const photos = currentStudent.tasks
            .filter(task => task.course === course && task.file && task.file.type.startsWith('image')) // Solo imágenes
            .map(task => task.file);

        if (photos.length === 0) {
            alert("No hay fotos subidas en este curso.");
            return;
        }

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.overflowY = 'auto';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cerrar';
        closeButton.style.marginTop = '10px';
        closeButton.addEventListener('click', function() {
            modal.remove();
        });

        photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.base64;
            img.style.width = '100px';
            img.style.marginBottom = '10px';
            modalContent.appendChild(img);
        });

        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    });
});

// Cambiar a la interfaz del administrador
document.getElementById('switch-interface').addEventListener('click', function() {
    const modal = document.getElementById('pin-modal');
    if (!isAdmin) {
        modal.style.display = 'flex';

        document.getElementById('submit-pin').addEventListener('click', function() {
            const pin = document.getElementById('pin-input').value;
            if (pin === adminPin) {
                isAdmin = true;
                saveData(); // Guardar estado de administrador
                document.getElementById('student-interface').style.display = 'none';
                document.getElementById('admin-interface').style.display = 'block';
                document.getElementById('switch-interface').textContent = 'Cambiar a Estudiante';
                document.getElementById('logout-btn').style.display = 'block'; // Mostrar botón de cerrar sesión
                displayAdminTasks();
                modal.style.display = 'none';
            } else {
                alert("PIN incorrecto");
            }
        });
    } else {
        isAdmin = false;
        saveData(); // Guardar estado de administrador
        document.getElementById('student-interface').style.display = 'block';
        document.getElementById('admin-interface').style.display = 'none';
        document.getElementById('switch-interface').textContent = 'Cambiar a Administrador';
    }
});

// Mostrar tareas para el administrador
function displayAdminTasks() {
    const adminTasksDiv = document.getElementById('admin-tasks');
    adminTasksDiv.innerHTML = '';

    students.forEach((student, index) => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'student';
        studentDiv.style.display = 'flex';
        studentDiv.style.flexDirection = 'column'; // Mostrar los usuarios de forma vertical
        studentDiv.innerHTML = `<h2>${student.name} - Grado: ${student.grade}</h2>`;

        // Botón para eliminar usuario
        const deleteUserButton = document.createElement('button');
        deleteUserButton.textContent = 'Eliminar Usuario';
        deleteUserButton.addEventListener('click', function() {
            if (confirm(`¿Estás seguro de que deseas eliminar a ${student.name}?`)) {
                students.splice(index, 1); // Eliminar el usuario del array
                saveData();
                displayAdminTasks(); // Actualizar la interfaz
            }
        });

        studentDiv.appendChild(deleteUserButton);

        student.tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task';

            if (task.file && task.file.base64) { // Verificar si task.file y task.file.base64 existen
                if (task.file.type.startsWith('image')) {
                    const img = document.createElement('img');
                    img.src = task.file.base64;
                    img.style.width = '100px'; // Ajustar tamaño de la imagen
                    taskDiv.appendChild(img);
                } else {
                    const link = document.createElement('a');
                    link.href = task.file.base64;
                    link.textContent = task.file.name;
                    link.download = task.file.name;
                    taskDiv.appendChild(link);
                }
            } else {
                console.error("No hay archivo para la tarea:", task);
            }

            const gradeInput = document.createElement('input');
            gradeInput.type = 'number';
            gradeInput.placeholder = 'Calificación';
            gradeInput.value = task.grade || '';
            gradeInput.addEventListener('change', function() {
                task.grade = this.value;
                saveData();
            });

            const commentInput = document.createElement('input');
            commentInput.type = 'text';
            commentInput.placeholder = 'Comentario';
            commentInput.value = task.comment || '';
            commentInput.addEventListener('change', function() {
                task.comment = this.value;
                saveData();
            });

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Subir Calificación';
            submitButton.addEventListener('click', function() {
                task.grade = gradeInput.value;
                task.comment = commentInput.value;
                saveData();
                alert("Calificación y comentario subidos correctamente.");
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', function() {
                student.tasks = student.tasks.filter(t => t.id !== task.id);
                saveData();
                displayAdminTasks();
            });

            taskDiv.appendChild(gradeInput);
            taskDiv.appendChild(commentInput);
            taskDiv.appendChild(submitButton);
            taskDiv.appendChild(deleteButton);
            studentDiv.appendChild(taskDiv);
        });

        adminTasksDiv.appendChild(studentDiv);
    });
}

// Cerrar sesión
document.getElementById('logout-btn').addEventListener('click', function() {
    currentStudent = null;
    isAdmin = false;
    saveData(); // Limpiar datos de sesión
    document.getElementById('login-interface').style.display = 'block';
    document.getElementById('student-interface').style.display = 'none';
    document.getElementById('admin-interface').style.display = 'none';
    document.getElementById('switch-interface').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none'; // Ocultar botón de cerrar sesión
});

// Verificar si hay una sesión activa al cargar la página
window.addEventListener('load', function() {
    if (currentStudent) {
        document.getElementById('login-interface').style.display = 'none';
        document.getElementById('student-interface').style.display = 'block';
        document.getElementById('switch-interface').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
    } else if (isAdmin) {
        document.getElementById('student-interface').style.display = 'none';
        document.getElementById('admin-interface').style.display = 'block';
        document.getElementById('switch-interface').textContent = 'Cambiar a Estudiante';
        document.getElementById('logout-btn').style.display = 'block';
        displayAdminTasks();
    }
});