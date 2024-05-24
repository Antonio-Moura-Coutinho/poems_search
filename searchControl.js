document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById("search-input");
    const backendUrl = 'https://poems-backend-fbe3c465d5f2.herokuapp.com';
    //const backendUrl = 'http://127.0.0.1:5000';
    function searchPoems(searchType) {
        const query = searchInput.value;
        let endpoint = "/classify_poem";
        if (searchType === 'author') {
            endpoint = "/find_by_author";
        } else if (searchType === 'emotion') {
            endpoint = "/classify_poem"; // Assuming different handling for emotion can be added later
        } else if (searchType === 'title') {
            endpoint = "/find_by_title";
        }
        loadingIndicator.style.display = 'block';
        fetch(`${backendUrl}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query }),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(data); // Handle the display of poems here
            localStorage.setItem('results', JSON.stringify(data));
            window.location.href = 'results.html';
        })
        .catch((err) => console.error("Error:", err));
    }

    window.handleKeyPress = function(event) {
        if (event.key === 'Enter') {
            searchPoems('title');
        }
    }

    window.sendSearchQuery = function(searchType) {
        searchPoems(searchType);
    }
});
