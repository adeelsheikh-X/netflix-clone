const container = document.getElementById("myListContainer");

// ✅ Load My List Page
async function loadMyList() {
  try {
    const res = await fetch("/api/mylist");
    const data = await res.json();

    if (!container) return;

    if (data.movies.length === 0) {
      container.innerHTML = "<p style='color:white;'>Your list is empty.</p>";
      return;
    }

    container.innerHTML = "";
    data.movies.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${movie.imageUrl}" alt="${movie.movieTitle}" />
        <div class="tag">In My List</div>
        <button class="btn-remove" onclick="removeFromList('${movie._id}')">Remove</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error loading movies:", err);
  }
}

// ✅ Add to My List
async function addToMyList(button) {
  const movieId = button.getAttribute("data-id");
  const movieTitle = button.getAttribute("data-title");
  const imageUrl = button.getAttribute("data-img");

  if (!movieId || !movieTitle || !imageUrl) {
    alert("❌ Missing movie data.");
    return;
  }

  try {
    const res = await fetch("/mylist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId, movieTitle, imageUrl }),
    });

    const data = await res.json();
    alert(data.message);
    if (typeof loadMyList === "function") loadMyList();
  } catch (err) {
    console.error("❌ Error adding movie:", err);
  }
}

// ✅ Remove from My List
async function removeFromList(movieId) {
  try {
    const res = await fetch(`/mylist/remove/${movieId}`, {
      method: "DELETE",
    });

    const data = await res.json();
    alert(data.message);
    loadMyList();
  } catch (err) {
    console.error("❌ Error removing movie:", err);
  }
}

// ✅ Run loadMyList only if on My List page
if (container) {
  loadMyList();
}
