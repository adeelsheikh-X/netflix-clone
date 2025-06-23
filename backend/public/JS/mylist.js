const container = document.getElementById("myListContainer");

// Fetch movies from the server
async function fetchMyList() {
  try {
    const res = await fetch("/api/mylist");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch My List");
    }

    renderList(data.movies);
  } catch (err) {
    console.error("❌ Error fetching list:", err);
    container.innerHTML = "<p style='color:white;'>Failed to load your list.</p>";
  }
}

// Render the list
function renderList(movies) {
  container.innerHTML = "";
  if (movies.length === 0) {
    container.innerHTML = "<p style='color:white;'>Your list is empty.</p>";
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${movie.imageUrl || '#'}" alt="${movie.movieTitle}" />
      <div class="tag">In My List</div>
      <button class="btn-remove" onclick="removeFromList('${movie._id}')">Remove</button>
    `;
    container.appendChild(card);
  });
}

// Remove a movie
async function removeFromList(movieId) {
  try {
    const res = await fetch(`/mylist/remove/${movieId}`, {
      method: "DELETE",
    });

    const result = await res.json();
    alert(result.message);

    // Refresh list
    fetchMyList();
  } catch (err) {
    console.error("❌ Error removing movie:", err);
    alert("Failed to remove movie.");
  }
}

// Load the list on page load
fetchMyList();
