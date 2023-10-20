import Api from './api.js';

const apiManager = new Api('331c96ca84507937192421691486c499');

document.querySelector('#searchForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const searchText = document.querySelector('#searchText').value;

    if(searchText.length < 3) {
        alert(`Merci d'entrer une recherche supérieure à 3 caractères`);
    }

    const searchResultsArray = await apiManager.searchForAMovie(searchText);

    const pages = searchResultsArray.total_pages;
    const pagesHtml = document.querySelector('#paginationLinks');
    for(let i = 1; i < pages; i++) 
    {
        const navigationLink = document.createElement('button');
        navigationLink.className = "p-2 m-2";
        navigationLink.innerText = i;
        navigationLink.addEventListener('click', async (ev) => {
            displaySearchResults(await apiManager.searchForAMovie(searchText, i));
        });
        pagesHtml.appendChild(navigationLink);
    }

    displaySearchResults(searchResultsArray);
});

async function displaySearchResults(searchResultsArray) {
    const searchResultsHtml = document.querySelector('#searchResults');
    searchResultsHtml.innerHTML = searchResultsArray.results.map((searchResult) => {
        return `
                <div>
                    <img src="https://image.tmdb.org/t/p/w500/${searchResult.poster_path}"/>
                    <h3 class="font-bold">
                        ${searchResult.title}
                    </h3>
                    <p>
                        ${searchResult.overview}
                    </p>
                </div>
            `;
    }).join('');
}