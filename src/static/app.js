document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activitySelect before repopulating to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build main card content
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const partSection = document.createElement("div");
        partSection.className = "participants-section";
        const partTitle = document.createElement("strong");
        partTitle.textContent = "Participants:";
        partSection.appendChild(partTitle);

        if (details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          ul.style.listStyle = "none";
          ul.style.paddingLeft = "0";
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";

            // Email text
            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            li.appendChild(emailSpan);

            // Delete icon
            const delBtn = document.createElement("button");
            delBtn.innerHTML = "<span style='font-size:18px; color:#c62828; margin-left:8px; cursor:pointer;' title='Remove'>&#10006;</span>";
            delBtn.style.background = "none";
            delBtn.style.border = "none";
            delBtn.style.cursor = "pointer";
            delBtn.style.padding = "0 0 0 8px";
            delBtn.setAttribute("aria-label", `Remove ${email}`);
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${email} from ${name}?`)) return;
              try {
                const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: "DELETE"
                });
                if (response.ok) {
                  fetchActivities();
                } else {
                  const result = await response.json();
                  alert(result.detail || "Failed to remove participant.");
                }
              } catch (err) {
                alert("Failed to remove participant.");
              }
            });
            li.appendChild(delBtn);

            ul.appendChild(li);
          });
          partSection.appendChild(ul);
        } else {
          const none = document.createElement("span");
          none.className = "no-participants";
          none.textContent = "No participants yet.";
          partSection.appendChild(none);
        }
        activityCard.appendChild(partSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
