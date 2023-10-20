export default class Api {

    #baseUrl = "https://api.themoviedb.org/3/";
    #apiKey;

    constructor(apiKey) 
    {
        this.#apiKey = apiKey;
    }

    searchForAMovie(searchTerm, page = 1)
    {
        let searchUrl = `${this.#baseUrl}search/movie?query=${searchTerm}&api_key=${this.#apiKey}&page=${page}`;
        
        return new Promise((resolve) => {
            fetch(searchUrl)
                .then((response) => response.json())
                .then((response) => resolve(response));
        });
    }

}