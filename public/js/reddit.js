async function fetchRedditPosts() {
  const redditPostsList = document.getElementById("reddit-posts");

  try {
    const response = await fetch("/reddit/programming");

    if (!response.ok) {
      console.log(`HTTP error! Status: ${response.status}`);
    }

    const posts = await response.json();

    posts.forEach((post) => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";

      const shortUrl =
        post.url.length > 15 ? `${post.url.slice(15, 40)}...` : post.url;

      listItem.innerHTML = ` 
            <p class="mb-1">${post.author}</p>
            <h6 class="mb-1">${post.title}</h6>
            <p>
              <a class="text-danger" href="${post.url}" target="_blank">${shortUrl}
              <i class="fa fa-external-link text-danger"></i></a>
            </p>
          `;

      redditPostsList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error fetching Reddit posts:", error.message);
  }
}

export { fetchRedditPosts };
