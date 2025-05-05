 // Dati di esempio (verranno sovrascritti dal localStorage se disponibili)
let books = [
    { id: 1, title: "Il Mio Libro", color: 0x4287f5, position: { x: 0, y: 0, z: 0 } }
];
let notes = [
    { id: 1, bookId: 1, title: "Prima Nota", content: "Questo è il contenuto della prima nota.", color: 0xf54242, orbit: { radius: 5, speed: 0.001, angle: 0 } },
    { id: 2, bookId: 1, title: "Seconda Nota", content: "Qui c'è il contenuto della seconda nota, un po' più lungo.", color: 0x42f554, orbit: { radius: 7, speed: 0.0015, angle: 2 } },
    { id: 3, bookId: 1, title: "Terza Nota", content: "La terza nota contiene informazioni importanti sul progetto.", color: 0xf5a442, orbit: { radius: 9, speed: 0.0008, angle: 4 } }
];

// Inizializzazione della scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luci
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

// Oggetti 3D
const bookObjects = {};
const bookLabels = {};
const notePositions = {};
const noteLabels = {};
const lineObjects = {};
let currentEditingNoteId = null;

// Controlli della camera
let isDragging = false;
let isShiftDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraTarget = new THREE.Vector3(0, 0, 0);

// serve per gestire il clik sul book che porta alla Creazione
// di una nuova nota al book selezionato
let selectedBookId = null;
let lastBookClickTime = 0;

// per lo sfondo stellato 
let starsBackground; 
let starfieldEnabled = false;

const createStarfieldToggle = ()=> {
	//const toggleContainer = document.querySelector(".starfield-toggle");
	//const label = document.querySelector('.label-toggle');
	const toggleSwitch = document.querySelector('.toggle-switch');
	const toggleSlider = document.querySelector(".toggle-slider")
	
	toggleSwitch.addEventListener('click', function() {
		starfieldEnabled = !starfieldEnabled;
		
		if (starfieldEnabled) {
				// Attiva sfondo stellato
				toggleSwitch.style.backgroundColor = '#4287f5';
				toggleSlider.style.transform = 'translateX(20px)';
				
				if (!starsBackground) {
						createStarfield();
				} else {
						starsBackground.visible = true;
				}
		} else {
				// Disattiva sfondo stellato
				toggleSwitch.style.backgroundColor = '#ccc';
				toggleSlider.style.transform = 'translateX(0)';
				
				if (starsBackground) {
						starsBackground.visible = false;
				}
		}
	});
}

// funzione che Crea lo sfondo stellato
function createStarfield() {
	// Crea un nuovo gruppo per contenere le stelle
	starsBackground = new THREE.Group();
	// Crea geometria per le stelle (particelle)
	const starsGeometry = new THREE.BufferGeometry();
	const starCount = 1500; // Numero di stelle (regolato per le performance)
	// Posizioni delle stelle (3 valori per stella: x, y, z)
	const positions = new Float32Array(starCount * 3);
	const sizes = new Float32Array(starCount);
	
	// Distribuisci le stelle in una sfera attorno alla scena
	for (let i = 0; i < starCount; i++) {
			// Posizione
			const i3 = i * 3;
			
			// Coordiante sferiche per distribuzione uniforme
			const radius = 100 + Math.random() * 50; // Distanza dal centro
			const theta = Math.random() * Math.PI * 2; // Angolo orizzontale
			const phi = Math.random() * Math.PI; // Angolo verticale
			
			// Converti coordinate sferiche in cartesiane
			positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
			positions[i3 + 1] = radius * Math.cos(phi);
			positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
			
			// Dimensione della stella (variabile)
			sizes[i] = Math.random() * 2 + 0.5;
	}
	
	starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
	
	// Materiale che renderà le stelle come punti luminosi
	const starsMaterial = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.7,
			transparent: true,
			opacity: 0.8,
			sizeAttenuation: true // Le stelle più lontane appaiono più piccole
	});
	
	// Crea le stelle (sistema di particelle)
	const starPoints = new THREE.Points(starsGeometry, starsMaterial);
	starsBackground.add(starPoints);
	
	// Aggiungi alla scena
	scene.add(starsBackground);
	
	// Crea stelle più luminose (più rare)
	const brightStarsGeometry = new THREE.BufferGeometry();
	const brightStarCount = 100;
	
	const brightPositions = new Float32Array(brightStarCount * 3);
	const brightSizes = new Float32Array(brightStarCount);
	
	for (let i = 0; i < brightStarCount; i++) {
			const i3 = i * 3;
			// Stessa logica di distribuzione
			const radius = 90 + Math.random() * 60;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.random() * Math.PI;
			brightPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
			brightPositions[i3 + 1] = radius * Math.cos(phi);
			brightPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
			// Stelle più grandi
			brightSizes[i] = Math.random() * 3 + 1.5;
	}
	brightStarsGeometry.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3));
	brightStarsGeometry.setAttribute('size', new THREE.BufferAttribute(brightSizes, 1));
	const brightStarsMaterial = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 1.5,
			transparent: true,
			opacity: 0.9,
			sizeAttenuation: true
	});
	const brightStarPoints = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
	starsBackground.add(brightStarPoints);
}

// Funzioni di salvataggio e caricamento dei dati
function saveDataToLocalStorage() {
	const data = {
			books: books,
			notes: notes
	};
	
	try {
			localStorage.setItem('mindMapData', JSON.stringify(data));
			console.log('Dati salvati correttamente in localStorage');
	} catch (e) {
			console.error('Errore durante il salvataggio dei dati:', e);
	}
}

function loadDataFromLocalStorage() {
	try {
			const savedData = localStorage.getItem('mindMapData');
			
			if (savedData) {
					const data = JSON.parse(savedData);
					
					if (data.books && Array.isArray(data.books)) {
							books = data.books;
					}
					
					if (data.notes && Array.isArray(data.notes)) {
							notes = data.notes;
					}
					
					console.log('Dati caricati correttamente da localStorage');
					return true;
			}
	} catch (e) {
			console.error('Errore durante il caricamento dei dati:', e);
	}
	
	return false;
}

// Esporta i dati in un file JSON
function exportData() {
	const data = {
			books: books,
			notes: notes
	};
	
	const dataStr = JSON.stringify(data, null, 2);
	const dataBlob = new Blob([dataStr], { type: 'application/json' });
	const dataUrl = URL.createObjectURL(dataBlob);
	
	const downloadLink = document.createElement('a');
	downloadLink.href = dataUrl;
	downloadLink.download = 'mind_map_data.json';
	downloadLink.click();
	
	URL.revokeObjectURL(dataUrl);
}

// Importa i dati da un file JSON
function importData(event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function(e) {
		try {
			const data = JSON.parse(e.target.result);
			
			if (data.books && Array.isArray(data.books) && 
					data.notes && Array.isArray(data.notes)) {
					
					// Pulisci la scena
					clearScene();
					
					// Imposta i nuovi dati
					books = data.books;
					notes = data.notes;
					
					// Ricrea la scena
					books.forEach(createBook);
					notes.forEach(createNote);
					
					// Salva i dati importati
					saveDataToLocalStorage();
					
					// Aggiorna l'UI
					updateBookSelect();
					zoomOutView();
					
					alert('Dati importati con successo!');
			} else {
					alert('File JSON non valido. Assicurati che contenga libri e note.');
			}
		} catch (err) {
				console.error('Errore durante l\'importazione:', err);
				alert('Errore durante l\'importazione del file.');
		}
	};
	
	reader.readAsText(file);
	
	// Reset input file
	event.target.value = '';
}

// Pulisci la scena
function clearScene() {
	// Rimuovi libri
	for (const bookId in bookObjects) {
			scene.remove(bookObjects[bookId]);
			bookLabels[bookId].remove();
	}
	
	// Rimuovi linee
	for (const noteId in lineObjects) {
			scene.remove(lineObjects[noteId]);
	}
	
	// Rimuovi etichette delle note
	for (const noteId in noteLabels) {
			noteLabels[noteId].remove();
	}
	
	// Resetta gli oggetti
	Object.keys(bookObjects).forEach(key => delete bookObjects[key]);
	Object.keys(bookLabels).forEach(key => delete bookLabels[key]);
	Object.keys(lineObjects).forEach(key => delete lineObjects[key]);
	Object.keys(noteLabels).forEach(key => delete noteLabels[key]);
	Object.keys(notePositions).forEach(key => delete notePositions[key]);
}

// Creazione di elementi HTML per le etichette
function createBookLabel(text, id) {
	const div = document.createElement('div');
	div.className = 'book-label';
	div.textContent = text;
	div.dataset.bookId = id;
	div.style.position = 'absolute';
	div.style.top = '0px';
	div.style.left = '0px';
	div.style.pointerEvents = 'none';
	div.style.zIndex = '10';
	document.body.appendChild(div);
	return div;
}

function createNoteLabel(text, id, noteColor) {
	const div = document.createElement('div');
	div.className = 'note-label';
	div.textContent = text;
	div.dataset.noteId = id;
	div.style.position = 'absolute';
	div.style.top = '0px';
	div.style.left = '0px';
	div.style.zIndex = '10';
	
	// Converti colore in formato RGB
	const r = (noteColor >> 16) & 255;
	const g = (noteColor >> 8) & 255;
	const b = noteColor & 255;
	div.style.color = `rgb(${r}, ${g}, ${b})`;
	
	// Aggiungi event listener
	div.addEventListener('click', function() {
			const noteId = parseInt(this.dataset.noteId);
			const note = notes.find(n => n.id === noteId);
			if (note) {
				openNoteEditor(note);
			}
	});
	
	document.body.appendChild(div);
	return div;
}

// Aggiorna la posizione di un'etichetta in base alla posizione 3D
function updateLabelPosition(label, position) {
	if (!label || !position) return;
	// Calcola posizione proiettata sullo schermo
	const vector = new THREE.Vector3(position.x, position.y, position.z);
	
	vector.project(camera);
	
	const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
	const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
	
	// Aggiorna la posizione dell'etichetta
	label.style.transform = `translate(-50%, -100%)`;
	label.style.left = `${x}px`;
	label.style.top = `${y}px`;
}

// Creazione del libro
function createBook(book) {
	const geometry = new THREE.SphereGeometry(2, 32, 32);
	const material = new THREE.MeshPhongMaterial({ 
		color: book.color,
		emissive: new THREE.Color(book.color).multiplyScalar(0.3)
	});
	const mesh = new THREE.Mesh(geometry, material);
	
	// Posiziona il libro
	mesh.position.set(book.position.x, book.position.y, book.position.z);
	
	scene.add(mesh);
	bookObjects[book.id] = mesh;
	
	// Aggiungi un effetto glow
	const glowGeometry = new THREE.SphereGeometry(2.2, 32, 32);
	const glowMaterial = new THREE.MeshBasicMaterial({
		color: book.color,
		transparent: true,
		opacity: 0.2
	});
	const glow = new THREE.Mesh(glowGeometry, glowMaterial);
	mesh.add(glow);
	
	// Crea l'etichetta per il titolo del libro
	const label = createBookLabel(book.title, book.id);
	bookLabels[book.id] = label;	
	return mesh;
}

// Creazione delle note (ora solo etichette e posizioni)
function createNote(note) {
	const book = books.find(b => b.id === note.bookId);
	if (!book) return null;
	
	// Calcola la posizione iniziale della nota
	const bookPosition = new THREE.Vector3(book.position.x, book.position.y, book.position.z);
	const notePosition = calculateNotePosition(note.orbit, bookPosition);
	
	// Memorizza la posizione della nota
	notePositions[note.id] = {
			position: notePosition,
			data: note
	};
	
	// Crea l'etichetta per il titolo della nota
	const label = createNoteLabel(note.title, note.id, note.color);
	noteLabels[note.id] = label;
	
	// Crea la linea di collegamento
	const bookMesh = bookObjects[note.bookId];
	const lineMaterial = new THREE.LineBasicMaterial({ 
			color: note.color,
			transparent: true,
			opacity: 0.4
	});
	
	const points = [
			bookMesh.position,
			notePosition
	];
	
	const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
	const line = new THREE.Line(lineGeometry, lineMaterial);
	scene.add(line);	
	lineObjects[note.id] = line;
}

// Calcola la posizione della nota durante l'orbita
function calculateNotePosition(orbit, bookPosition) {
	const x = Math.cos(orbit.angle) * orbit.radius + bookPosition.x;
	const y = Math.sin(orbit.angle) * orbit.radius * 0.3 + bookPosition.y; // Ellittica
	const z = Math.sin(orbit.angle) * orbit.radius + bookPosition.z;
	
	return new THREE.Vector3(x, y, z);
}

// Aggiorna la posizione delle note
function updateNotePositions() {
	for (const noteId in notePositions) {
			const noteData = notePositions[noteId];
			const note = noteData.data;
			const bookId = note.bookId;
			const book = books.find(b => b.id === bookId);
			
			if (book) {
					note.orbit.angle += note.orbit.speed;
					const bookPosition = new THREE.Vector3(book.position.x, book.position.y, book.position.z);
					noteData.position = calculateNotePosition(note.orbit, bookPosition);
			}
	}
}

// Aggiorna le linee di collegamento
function updateLines() {
	for (const noteId in notePositions) {
			const noteData = notePositions[noteId];
			const line = lineObjects[noteId];
			const bookId = noteData.data.bookId;
			
			if (line && line.geometry && bookObjects[bookId]) {
					const points = [
							bookObjects[bookId].position,
							noteData.position
					];
					
					line.geometry.setFromPoints(points);
					line.geometry.attributes.position.needsUpdate = true;
			}
	}
}

// Aggiorna le etichette
function updateLabels() {
	// Aggiorna le etichette dei libri
	for (const bookId in bookObjects) {
			updateLabelPosition(bookLabels[bookId], bookObjects[bookId].position);
	}
	
	// Aggiorna le etichette delle note
	for (const noteId in notePositions) {
			updateLabelPosition(noteLabels[noteId], notePositions[noteId].position);
	}
}

// Gestione del controllo della camera con il mouse
function handleMouseDown(event) {
	isDragging = true;
	isShiftDragging = event.shiftKey;
	previousMousePosition = {
			x: event.clientX,
			y: event.clientY
	};
}

function handleMouseMove(event) {
	if (!isDragging) return;
	
	const deltaMove = {
			x: event.clientX - previousMousePosition.x,
			y: event.clientY - previousMousePosition.y
	};
	
	if (isShiftDragging) {
			// Modalità di panning (spostamento laterale)
			const panSpeed = 0.05;
			const panLeft = new THREE.Vector3();
			const panUp = new THREE.Vector3();
			
			// Calcola i vettori di panning basati sulla camera
			const vec = new THREE.Vector3();
			const position = camera.position.clone();
			
			vec.setFromMatrixColumn(camera.matrix, 0);
			vec.multiplyScalar(-deltaMove.x * panSpeed);
			panLeft.copy(vec);
			
			vec.setFromMatrixColumn(camera.matrix, 1);
			vec.multiplyScalar(deltaMove.y * panSpeed);
			panUp.copy(vec);
			
			// Applica il panning
			camera.position.add(panLeft);
			camera.position.add(panUp);
			cameraTarget.add(panLeft);
			cameraTarget.add(panUp);
			camera.lookAt(cameraTarget);
	} else {
			// Modalità di rotazione
			const rotationSpeed = 0.01;
			
			// Calcola la rotazione della camera intorno al punto target
			const cameraPosVector = camera.position.clone().sub(cameraTarget);
			
			// Rotazione orizzontale (intorno all'asse Y)
			const rotationY = new THREE.Quaternion().setFromAxisAngle(
					new THREE.Vector3(0, 1, 0),
					deltaMove.x * rotationSpeed
			);
			cameraPosVector.applyQuaternion(rotationY);
			
			// Rotazione verticale (intorno all'asse X)
			const axis = new THREE.Vector3().crossVectors(
					cameraPosVector,
					new THREE.Vector3(0, 1, 0)
			).normalize();
			
			const rotationX = new THREE.Quaternion().setFromAxisAngle(
					axis,
					deltaMove.y * rotationSpeed
			);
			cameraPosVector.applyQuaternion(rotationX);
			
			// Aggiorna la posizione della camera
			camera.position.copy(cameraTarget).add(cameraPosVector);
			camera.lookAt(cameraTarget);
	}
	
	previousMousePosition = {
			x: event.clientX,
			y: event.clientY
	};
}

function handleMouseUp() {
  isDragging = false;
}

// Gestione dello zoom con la rotellina del mouse
function handleMouseWheel(event) {
	event.preventDefault();
	
	// Calcola direzione e intensità dello zoom
	const delta = Math.sign(event.deltaY);
	const zoomSpeed = 1;
	
	// Calcola il vettore dalla camera al target
	const direction = new THREE.Vector3().subVectors(camera.position, cameraTarget).normalize();
	
	// Applica lo zoom (avvicina o allontana la camera)
	const distance = camera.position.distanceTo(cameraTarget);
	const newDistance = Math.max(5, distance + delta * zoomSpeed);
	
	camera.position.copy(cameraTarget).addScaledVector(direction, newDistance);
}

// Inizializza la scena
function init() {
	// Carica dati da localStorage (se disponibili)
	const dataLoaded = loadDataFromLocalStorage();
	
	// Crea i bottoni per import/export
	createDataButtons();

		// Crea l'interruttore per lo sfondo stellato
	createStarfieldToggle();
	
	// Crea i libri
	books.forEach(createBook);
	
	// Crea le note
	notes.forEach(createNote);
	
	// Event listeners
	window.addEventListener('resize', onWindowResize);
	
	// Interazione con il mouse per la navigazione
	renderer.domElement.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('mouseup', handleMouseUp);
	
	// Zoom con la rotellina del mouse
	renderer.domElement.addEventListener('wheel', handleMouseWheel, { passive: false });
	
	// Interazione con il mouse per la selezione
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	
	renderer.domElement.addEventListener('click', (event) => {
			if (isDragging) return; // Ignora il click se si sta trascinando
			
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			
			raycaster.setFromCamera(mouse, camera);
			
			// Controlla intersezioni con i libri
			const bookIntersects = raycaster.intersectObjects(
					Object.values(bookObjects)
			);
			if (bookIntersects.length > 0) {
			const object = bookIntersects[0].object;
			const bookId = parseInt(Object.keys(bookObjects).find(
					id => bookObjects[id] === object
			));
			
			if (bookId) {
					selectBook(bookId);
			}
		} else {
				// Se non abbiamo cliccato su un libro, resetta la selezione
				selectedBookId = null;
		}
	});
	
	// UI Events
	document.getElementById('addBook').addEventListener('click', showBookForm);
	document.getElementById('saveBook').addEventListener('click', saveBook);
	document.getElementById('cancelBook').addEventListener('click', hideBookForm);
	
	document.getElementById('addNote').addEventListener('click', showNoteForm);
	document.getElementById('saveNote').addEventListener('click', saveNote);
	document.getElementById('cancelNote').addEventListener('click', hideNoteForm);
	
	document.getElementById('updateNote').addEventListener('click', updateNote);
	document.getElementById('deleteNote').addEventListener('click', deleteNote);
	document.getElementById('cancelEdit').addEventListener('click', hideNoteEditor);
	
	document.getElementById('zoomOut').addEventListener('click', zoomOutView);
	
	// Importazione dati
	document.getElementById('importInput').addEventListener('change', importData);

	addBookEditorEventListeners()

	// Imposta salvataggio automatico ogni 30 secondi
	setInterval(saveDataToLocalStorage, 30000);
	
	// Popola il select dei libri
	updateBookSelect();
	
	// Se abbiamo caricato dati, zoom out per vedere tutto
	if (dataLoaded && books.length > 0) {
			zoomOutView();
	}
}
		// Aggiungi questi event listener nella funzione init()
function addBookEditorEventListeners() {
		document.getElementById('updateBook').addEventListener('click', updateBook);
		document.getElementById('deleteBook').addEventListener('click', function() {
				const bookId = parseInt(document.getElementById('bookEditor').dataset.bookId);
				if (bookId) {
						deleteBook(bookId);
				}
		});
		document.getElementById('cancelEditBook').addEventListener('click', hideBookEditor);
}




// Crea bottoni per import/export
function createDataButtons() {
	const controlsContainer = document.querySelector('.controls') || document.body;
	
	// Div per contenere i pulsanti di import/export
	const dataButtonsDiv = document.createElement('div');
	dataButtonsDiv.className = 'data-controls';
	dataButtonsDiv.style.marginTop = '15px';
	
	// Bottone Export
	const exportButton = document.createElement('button');
	exportButton.id = 'exportData';
	exportButton.textContent = 'Esporta Dati (JSON)';
	exportButton.addEventListener('click', exportData);
	
	// Bottone Import
	const importLabel = document.createElement('label');
	importLabel.className = 'import-label';
	importLabel.textContent = 'Importa Dati';
	importLabel.style.padding = '5px 10px';
	importLabel.style.backgroundColor = '#333';
	importLabel.style.color = 'white';
	importLabel.style.borderRadius = '4px';
	importLabel.style.cursor = 'pointer';
	importLabel.style.display = 'inline-block';
	importLabel.style.marginLeft = '10px';
	
	const importInput = document.createElement('input');
	importInput.type = 'file';
	importInput.id = 'importInput';
	importInput.accept = '.json';
	importInput.style.display = 'none';
	
	importLabel.appendChild(importInput);
	
	// Aggiungi i bottoni al container
	dataButtonsDiv.appendChild(exportButton);
	dataButtonsDiv.appendChild(importLabel);
	controlsContainer.appendChild(dataButtonsDiv);
}

// Apri l'editor di note
function openNoteEditor(note) {
	document.getElementById('editNoteTitle').textContent = `Modifica: ${note.title}`;
	document.getElementById('editNoteTitleInput').value = note.title;
	document.getElementById('editNoteContentInput').value = note.content;
	document.getElementById('noteEditor').style.display = 'block';
	currentEditingNoteId = note.id;
}

// Nascondi l'editor di note
function hideNoteEditor() {
    document.getElementById('noteEditor').style.display = 'none';
    currentEditingNoteId = null;
}

// Aggiorna una nota esistente
function updateNote() {
	if (!currentEditingNoteId) return;
	
	const note = notes.find(n => n.id === currentEditingNoteId);
	if (!note) return;
	
	const newTitle = document.getElementById('editNoteTitleInput').value.trim();
	const newContent = document.getElementById('editNoteContentInput').value.trim();
	
	if (!newTitle) return;
	
	// Aggiorna i dati della nota
	note.title = newTitle;
	note.content = newContent;
	
	// Aggiorna l'etichetta
	const noteLabel = noteLabels[note.id];
	if (noteLabel) {
			noteLabel.textContent = newTitle;
	}
	
	// Salva i dati aggiornati
	saveDataToLocalStorage();
	
	hideNoteEditor();
}

// Elimina una nota
function deleteNote() {
	if (!currentEditingNoteId) return;
	
	// Trova l'indice della nota
	const noteIndex = notes.findIndex(n => n.id === currentEditingNoteId);
	if (noteIndex === -1) return;
	
	// Rimuovi la linea dalla scena
	if (lineObjects[currentEditingNoteId]) {
			scene.remove(lineObjects[currentEditingNoteId]);
			delete lineObjects[currentEditingNoteId];
	}
	
	// Rimuovi l'etichetta dal DOM
	if (noteLabels[currentEditingNoteId]) {
			noteLabels[currentEditingNoteId].remove();
			delete noteLabels[currentEditingNoteId];
	}
	
	// Rimuovi la posizione
	delete notePositions[currentEditingNoteId];
	
	// Rimuovi la nota dai dati
	notes.splice(noteIndex, 1);
	
	// Salva i dati aggiornati
	saveDataToLocalStorage();
	
	hideNoteEditor();
}

// Seleziona un libro
function selectBook(bookId) {
	const currentTime = new Date().getTime();
   if (bookId === selectedBookId && (currentTime - lastBookClickTime < 1500)) {
			// Prepara il form per aggiungere una nuova nota a questo libro
			prepareNoteFormForBook(bookId); 	
	// Se è lo stesso libro già selezionato e il click avviene entro un certo tempo (1.5 secondi)
	 } else if (bookId === selectedBookId && (currentTime - lastBookClickTime > 1500)) {
			// Doppio click: apri l'editor del libro invece di una nota
			const book = books.find(b => b.id === bookId);
			if (book) {
					showBookEditor(book);
			}
	} else {
			// Primo click o click su libro diverso: seleziona il libro e zoom
			selectedBookId = bookId;
			
			const bookMesh = bookObjects[bookId];
			
			// Imposta il target della camera
			cameraTarget.copy(bookMesh.position);
			
			// Zoom sul libro
			const distance = 10;
			const direction = new THREE.Vector3(0, 0, 1).normalize();
			camera.position.copy(cameraTarget).addScaledVector(direction, distance);
			
			// Guarda verso il libro
			camera.lookAt(cameraTarget);
	}
	
	// Aggiorna il timestamp dell'ultimo click
	lastBookClickTime = currentTime;
}
// Funzione per preparare automaticamente il form 
// per l'aggiunta di una nota al libro selezionato
function prepareNoteFormForBook(bookId) {
	// Trova il libro per il titolo
	const book = books.find(b => b.id === bookId);
	if (!book) return;
	
	// Mostra il form per la nota
	document.getElementById('noteForm').style.display = 'block';
	
	// Seleziona automaticamente il libro nel select
	const bookSelect = document.getElementById('bookSelect');
	bookSelect.value = bookId;
	
	// Metti focus sul titolo della nota
	document.getElementById('noteTitleInput').focus();
	
	// Aggiorna il titolo del form per chiarire che si sta aggiungendo una nota a un libro specifico
	const formTitle = document.querySelector('#noteForm h2') || document.createElement('h2');
	formTitle.textContent = `Nuova nota per: ${book.title}`;
	
	if (!formTitle.parentNode) {
			document.getElementById('noteForm').insertBefore(formTitle, document.getElementById('noteForm').firstChild);
	}
}




// Vista generale
function zoomOutView() {
	// Se non ci sono libri, non fare nulla
	if (books.length === 0) return;
	
	// Calcola il centro di tutti i libri
	let centerX = 0, centerY = 0, centerZ = 0;
	const bookCount = books.length;
	
	books.forEach(book => {
			centerX += book.position.x;
			centerY += book.position.y;
			centerZ += book.position.z;
	});
	
	centerX /= Math.max(1, bookCount);
	centerY /= Math.max(1, bookCount);
	centerZ /= Math.max(1, bookCount);
	
	// Imposta il target della camera
	cameraTarget.set(centerX, centerY, centerZ);
	
	// Calcola la distanza massima
	let maxDist = 0;
	books.forEach(book => {
			const dx = book.position.x - centerX;
			const dy = book.position.y - centerY;
			const dz = book.position.z - centerZ;
			const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
			maxDist = Math.max(maxDist, dist);
	});
	
	// Posiziona la camera
	const viewDistance = Math.max(30, maxDist * 2.5);
	camera.position.set(
			centerX,
			centerY + viewDistance * 0.7,
			centerZ + viewDistance
	);
	
	// Guarda verso il centro
	camera.lookAt(cameraTarget);
}

// Form per nuovo libro
function showBookForm() {
	document.getElementById('bookForm').style.display = 'block';
	document.getElementById('bookTitleInput').focus();
}

function hideBookForm() {
	document.getElementById('bookForm').style.display = 'none';
}

// savebook 
//
// Modifica la funzione saveBook() per posizionare i libri in 3D in modo casuale evitando sovrapposizioni
function saveBook() {
	const title = document.getElementById('bookTitleInput').value.trim();
	if (!title) return;
	
	let x, y, z;
	let validPosition = false;
	let attempts = 0;
	const maxAttempts = 50; // Limite massimo di tentativi per trovare una posizione valida
	
	// Dimensione del libro (raggio) - usata per il controllo delle collisioni
	const bookRadius = 2.5; // Leggermente più grande del raggio geometrico per garantire un po' di spazio
	
	if (books.length === 0) {
			// Se è il primo libro, lo mettiamo al centro
			x = 0;
			y = 0;
			z = 0;
			validPosition = true;
	} else {
			// Se ci sono già altri libri, tentiamo di trovare una posizione valida
			while (!validPosition && attempts < maxAttempts) {
				attempts++;
				
				// Usiamo il primo libro come riferimento
				let referenceBook = books[0];
				
				// Raggio minimo e massimo dal punto di riferimento
				const minRadius = 10;
				const maxRadius = 25;
				
				// Randomizzazione della posizione in 3D vicino al libro di riferimento
				const radius = minRadius + Math.random() * (maxRadius - minRadius);
				const theta = Math.random() * Math.PI * 2; // Angolo orizzontale (0-360 gradi)
				const phi = (Math.random() - 0.5) * Math.PI; // Angolo verticale (-90 a +90 gradi)
				
				// Calcola le coordinate cartesiane basate sugli angoli sferici
				x = referenceBook.position.x + radius * Math.cos(theta) * Math.cos(phi);
				y = referenceBook.position.y + radius * Math.sin(phi); // Componente verticale
				z = referenceBook.position.z + radius * Math.sin(theta) * Math.cos(phi);
				
				// Controlla sovrapposizioni con tutti i libri esistenti
				validPosition = true; // Presume che sia valida finché non si trova una sovrapposizione
				
				for (const book of books) {
						// Calcola la distanza tra la nuova posizione e il libro esistente
						const dx = x - book.position.x;
						const dy = y - book.position.y;
						const dz = z - book.position.z;
						const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
						
						// Se la distanza è minore della somma dei raggi, c'è sovrapposizione
						if (distance < bookRadius * 2) {
								validPosition = false;
								break;
						}
				}
			}
			
			// Se non si trova una posizione valida dopo molti tentativi, avvisa l'utente
			if (!validPosition) {
					console.warn("Non è stato possibile trovare una posizione senza sovrapposizioni dopo", maxAttempts, "tentativi");
					// Usiamo comunque l'ultima posizione generata, anche se potrebbe sovrapporsi
			}
	}
	
	const newBook = {
			id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
			title: title,
			color: Math.random() * 0xffffff,
			position: { x, y, z }
	};
	
	books.push(newBook);
	createBook(newBook);
	updateBookSelect();
	hideBookForm();
	
	// Salva i dati aggiornati
	saveDataToLocalStorage();
	
	// Reset input
	document.getElementById('bookTitleInput').value = '';
	
	// Zoom out to see all books
	zoomOutView();
}

// Form per nuova nota
function showNoteForm() {
	if (books.length === 0) {
			alert('Crea prima un libro!');
			return;
	}
	
	document.getElementById('noteForm').style.display = 'block';
	document.getElementById('noteTitleInput').focus();
}

function hideNoteForm() {
    document.getElementById('noteForm').style.display = 'none';
}

function saveNote() {
	const bookId = parseInt(document.getElementById('bookSelect').value);
	const title = document.getElementById('noteTitleInput').value.trim();
	const content = document.getElementById('noteContentInput').value.trim();
	
	if (!title) return;
	
	const newNote = {
			id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
			bookId: bookId,
			title: title,
			content: content,
			color: Math.random() * 0xffffff,
			orbit: {
					radius: 5 + Math.random() * 5,
					speed: 0.0005 + Math.random() * 0.0015,
					angle: Math.random() * Math.PI * 2
			}
	};
	
	notes.push(newNote);
	createNote(newNote);
	hideNoteForm();
	
	// Salva i dati aggiornati
	saveDataToLocalStorage();
	
	// Reset inputs
	document.getElementById('noteTitleInput').value = '';
	document.getElementById('noteContentInput').value = '';
	
	// Zoom sul libro
	setTimeout(() => {
			selectBook(bookId);
	}, 100);
}

// Aggiorna la lista dei libri nel select
function updateBookSelect() {
	const select = document.getElementById('bookSelect');
	select.innerHTML = '';
	
	books.forEach(book => {
		const option = document.createElement('option');
		option.value = book.id;
		option.textContent = book.title;
		select.appendChild(option);
	});
}

// Gestione del ridimensionamento della finestra
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

// Loop di animazione
function animate() {
	requestAnimationFrame(animate);
	
	// Aggiorna posizioni delle note
	updateNotePositions();
	
	// Aggiorna le linee
	updateLines();
	
	// Aggiorna le etichette
	updateLabels();
	 
	// Rotazione leggera dei libri
	for (const bookId in bookObjects) {
			bookObjects[bookId].rotation.y += 0.005;
	}
			// Animazione delle stelle - rotazione molto lenta
	if (starsBackground && starsBackground.visible) {
			starsBackground.rotation.y += 0.0001;
	}
	renderer.render(scene, camera);
}



// funzione per eliminare books e note associate
const deleteBook = (bookId)=> {
	if (!confirm(`Sei sicuro di eliminare il book e le note associate ?`)) {
		return;
	}
	// trova l'indice del Libro
	const bookIndex = books.findIndex(b => b.id === bookId);
	if (bookIndex === -1) return;
	//ottieni il libro 
	const book = books[bookIndex];
	// trova tutte le note associata al book
	const notesToDelete = notes.filter(note => note.bookId === bookId);
	
	//per ogni nota del libro 
	notesToDelete.forEach(note => {
		//rimozione delle linee di collegamento
		if (lineObjects[note.id]) {
			scene.remove(lineObjects[note.id]);
			delete lineObjects[note.id];
		}
		//rimozione etichetta dom 
		if (noteLabels[note.id]) {
			noteLabels[note.id].remove();
			delete noteLabels[note.id];
		}
		delete notePositions[note.id];
	});
	
	// rimuovi il libro dalla scena
	if (bookObjects[bookId]) {
		scene.remove(bookObjects[bookId]);
		delete bookObjects[bookId];
	}
	// rimuovi le note della array 
	notes = notes.filter(note=>note.bookId !== bookId);
	//rimuovi book dall'array 
	books.splice(bookIndex, 1);
	// salva i dati aggiornati
	saveDataToLocalStorage();
	//aggiorna select 
	updateBookSelect();
	// zoom out 
	zoomOutView();
	// chiudi editor
	hideBookEditor();
}
// Funzione per mostrare l'editor del libro
function showBookEditor(book) {
    document.getElementById('editBookTitle').textContent = `Modifica: ${book.title}`;
    document.getElementById('editBookTitleInput').value = book.title;
    document.getElementById('bookEditor').style.display = 'block';
    
    // Memorizza l'ID del libro che stiamo modificando
    document.getElementById('bookEditor').dataset.bookId = book.id;
}

// Funzione per nascondere l'editor del libro
function hideBookEditor() {
    document.getElementById('bookEditor').style.display = 'none';
    document.getElementById('bookEditor').dataset.bookId = '';
}

// Funzione per aggiornare il titolo di un libro esistente
function updateBook() {
    // Ottieni l'ID del libro da modificare
    const bookId = parseInt(document.getElementById('bookEditor').dataset.bookId);
    if (!bookId) return;
    
    // Trova il libro
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    // Ottieni il nuovo titolo
    const newTitle = document.getElementById('editBookTitleInput').value.trim();
    if (!newTitle) return;
    
    // Aggiorna il titolo del libro
    book.title = newTitle;
    
    // Aggiorna l'etichetta del libro
    const bookLabel = bookLabels[book.id];
    if (bookLabel) {
        bookLabel.textContent = newTitle;
    }
    
    // Salva i dati aggiornati
    saveDataToLocalStorage();
    
    // Aggiorna il select dei libri
    updateBookSelect();
    
    // Nascondi l'editor
    hideBookEditor();
}





// Aggiungi CSS per mostrare quando il mouse può trascinare
document.head.insertAdjacentHTML('beforeend', `
<style>
    canvas { 
        cursor: grab; 
    }
    canvas:active { 
        cursor: grabbing; 
    }
</style>
`);

// Avvia tutto
init();
animate();
