import axios from 'axios';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

// Elementy DOM
const form = document.getElementById('search-form');
const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
const loadMoreBtn = document.getElementById('load-more');

// Klucz API Pixabay
const API_KEY = '45947467-1fb23e21d26a094164d331d1f';

// Zmienna globalna dla zarządzania paginacją
let query = '';
let page = 1;
let totalHits = 0;

// Obsługa formularza
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  query = document.getElementById('query').value.trim();

  // Walidacja pustego zapytania
  if (!query) {
    iziToast.error({
      title: 'Error',
      message: 'Please enter a search term!',
    });
    return;
  }

  // Resetowanie wyników i paginacji
  clearGallery();
  page = 1;
  loadMoreBtn.classList.add('hidden'); // Ukryj przycisk "Load more"
  showLoader();

  try {
    const data = await fetchImages(query, page);
    totalHits = data.totalHits;

    hideLoader();

    if (data.hits.length === 0) {
      iziToast.info({
        message: 'Sorry, there are no images matching your search query. Please try again!',
      });
      return;
    }

    displayImages(data.hits);

    if (data.hits.length < totalHits) {
      loadMoreBtn.classList.remove('hidden'); // Pokaż przycisk, jeśli są więcej wyników
    }
  } catch (error) {
    handleError();
  }
});

// Funkcja do pobierania obrazów
async function fetchImages(query, page) {
  const URL = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=40`;
  const response = await axios.get(URL);
  return response.data;
}

// Wyświetlanie obrazów
function displayImages(images) {
  gallery.insertAdjacentHTML(
    'beforeend',
    images
      .map(
        (img) => `
        <a href="${img.largeImageURL}" class="gallery-item">
          <img src="${img.webformatURL}" alt="${img.tags}" />
          <div class="info">
            <p>Likes: ${img.likes}</p>
            <p>Views: ${img.views}</p>
            <p>Comments: ${img.comments}</p>
            <p>Downloads: ${img.downloads}</p>
          </div>
        </a>`
      )
      .join('')
  );

  refreshLightbox(); // Odświeżenie galerii SimpleLightbox
}

// Paginacja: Obsługa kliknięcia przycisku "Load more"
loadMoreBtn.addEventListener('click', async () => {
  page += 1;
  showLoader();

  try {
    const data = await fetchImages(query, page);
    displayImages(data.hits);

    if (page * 40 >= totalHits) {
      loadMoreBtn.classList.add('hidden'); // Ukryj przycisk, gdy dotrzesz do końca
      iziToast.info({
        message: "We're sorry, but you've reached the end of search results.",
      });
    }
    
    scrollToNextBatch();
  } catch (error) {
    handleError();
  } finally {
    hideLoader();
  }
});

// Wyczyść galerię
function clearGallery() {
  gallery.innerHTML = '';
}

// Pokaż loader
function showLoader() {
  loader.classList.remove('hidden');
}

// Ukryj loader
function hideLoader() {
  loader.classList.add('hidden');
}

// Odświeżanie SimpleLightbox
function refreshLightbox() {
  const lightbox = new SimpleLightbox('.gallery-item', {
    captionsData: 'alt',
    captionDelay: 250,
  });
  lightbox.refresh();
}

// Płynne przewijanie
function scrollToNextBatch() {
  const { height: cardHeight } = gallery.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

// Obsługa błędów
function handleError() {
  iziToast.error({
    title: 'Error',
    message: 'Something went wrong. Please try again later.',
  });
  hideLoader();
}
