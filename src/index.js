import './css/styles.css';
import PixabayAPIService from './js/fetch-photo';
import { Notify } from 'notiflix';
import infiniteScroll from 'infinite-scroll';

const pixabayAPIService = new PixabayAPIService();

const OPTIONS_NOTIFICATION = {
  timeout: 4000,
  fontSize: '16px',
};
const refs = {
  formEl: document.querySelector('#search-form'),
  loadMoreBtn: document.querySelector('.load-more'),
  galleryContainer: document.querySelector('.gallery'),
};

refs.formEl.addEventListener('submit', onSubmit);
refs.loadMoreBtn.addEventListener('click', onLoadMorePhotos);
refs.loadMoreBtn.classList.add('visually-hidden');

/** functions */

function onSubmit(evt) {
  evt.preventDefault();
  refs.galleryContainer.innerHTML = '';
  const formData = new FormData(evt.target);
  const searchQuery = formData.get('searchQuery').trim();
  // const searchQuery = evt.currentTarget.elements.searchQuery.value.trim();
  refs.formEl.reset();

  if (!searchQuery || searchQuery.length < 3) {
    Notify.warning(
      'Warning! Search must not be empty and includes more then 2 letters',
      OPTIONS_NOTIFICATION
    );
    return;
  }

  pixabayAPIService.setNewQuery = searchQuery;
  pixabayAPIService.resetPage();
  pixabayAPIService.onFetchPhotos().then(onLoadFirstPhotos).catch(onError);
}

function onLoadFirstPhotos(response) {
  if (response.data.total === 0) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again',
      OPTIONS_NOTIFICATION
    );
    return;
  }

  const photos = response.data.hits;
  onMarkupPhotos(photos);

  refs.loadMoreBtn.classList.remove('visually-hidden');
}

function onLoadMorePhotos() {
  pixabayAPIService.incrementPages();

  pixabayAPIService
    .onFetchPhotos()
    .then(response => {
      const photos = response.data.hits;
      onMarkupPhotos(photos);

      let restOfPhotos =
        response.data.total -
        pixabayAPIService.page * pixabayAPIService.perPage;
      if (restOfPhotos <= 0) {
        Notify.warning(
          `Photos about ${pixabayAPIService.getCurrentQuery.toUpperCase()} are over. Please start a new search`,
          OPTIONS_NOTIFICATION
        );
        return;
      }
    })
    .catch(onError);
}

function onError(error) {
  if (error.response) {
    Notify.failure(
      `Sorry, an error occurred - ${error.response.status}. Try again`,
      OPTIONS_NOTIFICATION
    );
  }
  Notify.failure(
    'Sorry, a request was made, but no response was received. Try again',
    OPTIONS_NOTIFICATION
  );
}

function onMarkupPhotos(photos) {
  const markupPhotos = photos
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="photo-card">
            <img src="${webformatURL}" alt="${tags}" loading="lazy" />
             <div class="info">
                <p class="info-item">
                  <b>Likes: </b>${likes}
                </p>
                <p class="info-item">
                  <b>Views: </b>${views}
                </p>
                <p class="info-item">
                  <b>Comments: </b>${comments}
                </p>
                <p class="info-item">
                  <b>Downloads: </b>${downloads}
                </p>
              </div>
      </div>`;
      }
    )
    .join('');

  refs.galleryContainer.insertAdjacentHTML('beforeend', markupPhotos);
}
