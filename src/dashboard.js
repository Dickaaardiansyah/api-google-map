import './style/dashboard.css'
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');

  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  let mediaStream = null;
  let audioRecorder = null;
  let audioBlob = null;
  let mapMarker = null;
  let storiesMapInstance = null;
  let myMap = null;
  let detailMapInstance = null;

  initializeDashboard();

  function initializeDashboard() {
    const usernameElement = document.getElementById('username');
    if (usernameElement && name) {
      usernameElement.textContent = name;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const storyForm = document.getElementById('storyForm');
    if (storyForm) storyForm.addEventListener('submit', handleStorySubmit);

    initializeModal();

    initializeCamera();
    initializeAudioRecorder();
    initializeMap();

    fetchUserData();
    loadStories();
  }

  function initializeModal() {
    const modal = document.getElementById('storyDetailModal');
    const closeBtn = document.getElementById('closeModal');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (detailMapInstance) {
          detailMapInstance.remove();
          detailMapInstance = null;
        }
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        if (detailMapInstance) {
          detailMapInstance.remove();
          detailMapInstance = null;
        }
      }
    });
  }

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.clear();
      window.location.href = 'index.html';
    }
  }

  async function fetchUserData() {
    try {
      console.log('Fetching user data...');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function initializeCamera() {
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureBtn = document.getElementById('captureBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');
    const captureCanvas = document.getElementById('captureCanvas');
    const photoInput = document.getElementById('photo');

    if (takePhotoBtn) {
      takePhotoBtn.addEventListener('click', async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia) {
            alert('Browser tidak mendukung kamera');
            return;
          }

          mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          cameraVideo.srcObject = mediaStream;
          cameraPreview.classList.remove('hidden');
        } catch (error) {
          alert('Gagal mengakses kamera: ' + error.message);
        }
      });
    }

    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        const ctx = captureCanvas.getContext('2d');
        captureCanvas.width = cameraVideo.videoWidth;
        captureCanvas.height = cameraVideo.videoHeight;
        ctx.drawImage(cameraVideo, 0, 0);

        captureCanvas.toBlob(blob => {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          const dt = new DataTransfer();
          dt.items.add(file);
          photoInput.files = dt.files;

          stopCamera();
          cameraPreview.classList.add('hidden');
        }, 'image/jpeg');
      });
    }

    if (closeCameraBtn) {
      closeCameraBtn.addEventListener('click', () => {
        stopCamera();
        cameraPreview.classList.add('hidden');
      });
    }
  }

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
  }

  function initializeAudioRecorder() {
    const recordBtn = document.getElementById('recordAudioBtn');
    const audioContainer = document.getElementById('audioRecorder');
    const startBtn = document.getElementById('startRecordingBtn');
    const stopBtn = document.getElementById('stopRecordingBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioPreview = document.getElementById('audioPreview');

    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        audioContainer.classList.toggle('hidden');
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          const chunks = [];

          recorder.ondataavailable = e => chunks.push(e.data);
          recorder.onstop = () => {
            audioBlob = new Blob(chunks, { type: 'audio/wav' });
            audioPreview.src = URL.createObjectURL(audioBlob);
            audioPlayer.classList.remove('hidden');
            stream.getTracks().forEach(track => track.stop());
          };

          recorder.start();
          audioRecorder = recorder;
          startBtn.disabled = true;
          stopBtn.disabled = false;
        } catch (err) {
          alert('Gagal merekam audio: ' + err.message);
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (audioRecorder?.state !== 'inactive') {
          audioRecorder.stop();
          startBtn.disabled = false;
          stopBtn.disabled = true;
        }
      });
    }
  }

  function initializeMap() {
    const mapContainer = document.getElementById('map');
    const storiesMapContainer = document.getElementById('storiesMap');
    const getLocationBtn = document.getElementById('getCurrentLocationBtn');
    const locationStatus = document.getElementById('locationStatus');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');

    if (mapContainer) {
      myMap = L.map(mapContainer).setView([-6.2, 106.8], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(myMap);

      myMap.on('click', e => setMapMarker(e.latlng.lat, e.latlng.lng));
    }

    if (storiesMapContainer) {
      storiesMapInstance = L.map(storiesMapContainer).setView([-6.2, 106.8], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(storiesMapInstance);
    }

    if (getLocationBtn) {
      getLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
          locationStatus.textContent = 'Browser tidak mendukung lokasi';
          return;
        }

        locationStatus.textContent = 'Mendeteksi lokasi...';

        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude, longitude } = pos.coords;
          setMapMarker(latitude, longitude);
          myMap.setView([latitude, longitude], 15);
          locationStatus.textContent = `Lokasi ditemukan: ${latitude}, ${longitude}`;
        }, err => {
          locationStatus.textContent = 'Gagal mendapatkan lokasi: ' + err.message;
        });
      });
    }
  }

  function setMapMarker(lat, lon) {
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;

    if (mapMarker) {
      mapMarker.setLatLng([lat, lon]);
    } else {
      mapMarker = L.marker([lat, lon]).addTo(myMap);
    }
  }

  async function loadStories() {
    const container = document.getElementById('storiesContainer');
    if (!token || !container) return;

    try {
      const res = await fetch('https://story-api.dicoding.dev/v1/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { error, listStory } = await res.json();
      if (error) return (container.innerHTML = 'Gagal memuat story');

      container.innerHTML = listStory.map(story => `
        <div class="story-card" data-id="${story.id}">
          <img src="${story.photoUrl}" class="story-image" alt="${story.name}'s story" />
          <div class="story-info">
            <h3>${story.name}</h3>
            <p>${story.description.length > 100 ? story.description.substring(0, 100) + '...' : story.description}</p>
            ${story.lat ? `<p class="location-info">📍 Location available</p>` : ''}
            <button class="view-detail-btn" data-id="${story.id}">View Details</button>
          </div>
        </div>
      `).join('');

      if (storiesMapInstance) {
        storiesMapInstance.eachLayer(layer => {
          if (layer instanceof L.Marker) storiesMapInstance.removeLayer(layer);
        });

        listStory.forEach(story => {
          if (story.lat && story.lon) {
            L.marker([story.lat, story.lon])
              .addTo(storiesMapInstance)
              .bindPopup(`<strong>${story.name}</strong><br>${story.description.substring(0, 100)}...
                         <br><button class="map-detail-btn" data-id="${story.id}">View Details</button>`);
          }
        });

        storiesMapInstance.on('popupopen', function(e) {
          const mapDetailBtn = document.querySelector('.map-detail-btn');
          if (mapDetailBtn) {
            mapDetailBtn.addEventListener('click', function() {
              const storyId = this.getAttribute('data-id');
              openStoryDetail(storyId);
            });
          }
        });
      }

      container.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation(); 
          const storyId = button.getAttribute('data-id');
          openStoryDetail(storyId);
        });
      });

      container.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          openStoryDetail(id);
        });
      });
    } catch (e) {
      console.error('Error:', e);
      container.innerHTML = 'Gagal memuat story.';
    }
  }

  function openStoryDetail(storyId) {
    if (!storyId) return;
    
    const modal = document.getElementById('storyDetailModal');
    if (modal) {
      modal.style.display = 'block';
      const contentContainer = document.getElementById('storyDetailContent');
      if (contentContainer) {
        contentContainer.innerHTML = '<p>Loading story details...</p>';
        getStoryDetail(storyId);
      }
    }
  }

  async function getStoryDetail(storyId) {
    const contentContainer = document.getElementById('storyDetailContent');
    if (!token || !storyId || !contentContainer) return;

    try {
      const res = await fetch(`https://story-api.dicoding.dev/v1/stories/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { error, message, story } = await res.json();
      
      if (error) {
        contentContainer.innerHTML = `<p>Error: ${message || 'Failed to load story details'}</p>`;
        return;
      }

      const createdDate = new Date(story.createdAt);
      const formattedDate = createdDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      contentContainer.innerHTML = `
        <div class="story-detail-header">
          <h2>${story.name}'s Story</h2>
        </div>
        
        <img src="${story.photoUrl}" class="story-detail-image" alt="${story.name}'s story" />
        
        <div class="story-detail-info">
          <h3>Description</h3>
          <p class="story-detail-description">${story.description}</p>
        </div>
        
        <div class="story-detail-meta">
          <div>Posted on: ${formattedDate}</div>
          <div>Story ID: ${story.id}</div>
        </div>
      `;

      if (story.lat && story.lon) {
        contentContainer.innerHTML += `
          <div class="story-detail-location">
            <h3>Location</h3>
            <p>Latitude: ${story.lat}, Longitude: ${story.lon}</p>
            <div id="detailLocationMap" class="detail-location-map"></div>
          </div>
        `;

        setTimeout(() => {
          const mapContainer = document.getElementById('detailLocationMap');
          if (mapContainer) {

            if (detailMapInstance) {
              detailMapInstance.remove();
            }
            
            detailMapInstance = L.map('detailLocationMap').setView([story.lat, story.lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMapInstance);
            L.marker([story.lat, story.lon])
              .addTo(detailMapInstance)
              .bindPopup(`<strong>${story.name}</strong><br>Located here`);
            
            setTimeout(() => {
              detailMapInstance.invalidateSize();
            }, 100);
          }
        }, 0);
      }

    } catch (err) {
      console.error('Error fetching story detail:', err);
      contentContainer.innerHTML = `<p>Failed to load story details. Please try again later.</p>`;
    }
  }

  async function handleStorySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const description = form.description.value.trim();
    const photo = form.photo.files[0];
    const lat = form.lat.value;
    const lon = form.lon.value;
    const messageBox = document.getElementById('formMessage');

    if (!description || !photo) {
      messageBox.textContent = 'Deskripsi dan foto wajib diisi.';
      return;
    }

    if (photo.size > 1024 * 1024) {
      messageBox.textContent = 'Ukuran foto maksimal 1MB.';
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }
    if (audioBlob) {
      formData.append('audio', audioBlob, 'audio.wav');
    }

    try {
      const res = await fetch('https://story-api.dicoding.dev/v1/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await res.json();

      if (!result.error) {
        messageBox.textContent = 'Story berhasil ditambahkan!';
        form.reset();
        stopCamera();
        audioBlob = null;
        if (mapMarker) myMap.removeLayer(mapMarker);
        document.getElementById('audioPlayer').classList.add('hidden');
        document.getElementById('audioRecorder').classList.add('hidden');
        document.getElementById('locationStatus').textContent = '';
        loadStories();
      } else {
        messageBox.textContent = result.message;
      }
    } catch (err) {
      messageBox.textContent = 'Gagal mengirim story.';
    }
  }

  window.addEventListener('beforeunload', () => {
    stopCamera();
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.stop();
    }
  });
});